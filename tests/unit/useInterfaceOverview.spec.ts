import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, h, type App } from 'vue';
import { flushPromises } from '@vue/test-utils';
import dayjs from 'dayjs';

import { getInterfacesStats, getInterfacesSummary } from '@/api/interfaces';
import { getInterfaceDetailCached } from '@/composables/useInterfaceDetailCache';
import { useInterfaceOverview } from '@/composables/useInterfaceOverview';
import { useToast } from '@/composables/useToast';
import { DAYJS_KEY } from '@/composables/useDayjs';
import type { InterfaceStats, InterfaceSummary } from '@/types/network';

vi.mock('@/api/interfaces', () => ({
    getInterfacesSummary: vi.fn(),
    getInterfacesStats: vi.fn(),
}));

vi.mock('@/composables/useInterfaceDetailCache', () => ({
    getInterfaceDetailCached: vi.fn(),
}));

const summaryMock = vi.mocked(getInterfacesSummary);
const statsMock = vi.mocked(getInterfacesStats);
const detailMock = vi.mocked(getInterfaceDetailCached);

type Overview = ReturnType<typeof useInterfaceOverview>;
type Detail = Awaited<ReturnType<typeof getInterfaceDetailCached>>;

/**
 * Run the composable inside a component context.
 *
 * onMounted and onScopeDispose are both component-scoped, so the app is handed back and kept alive
 * by the caller; unmounting it is what exercises the dispose guard.
 */
function withSetup(options?: Parameters<typeof useInterfaceOverview>[0]): [Overview, App] {
    let result!: Overview;
    const app = createApp({
        setup() {
            result = useInterfaceOverview(options);
            return () => h('div');
        },
    });
    app.provide(DAYJS_KEY, dayjs);
    app.mount(document.createElement('div'));
    return [result, app];
}

function summary(name: string, over: Partial<InterfaceSummary> = {}): InterfaceSummary {
    return {
        name,
        alias: name,
        total: { rx: 100, tx: 50 },
        todayRx: 10,
        todayTx: 5,
        updatedTimestamp: 1_700_000_000,
        ...over,
    };
}

/** A detail with `days` daily records whose rx+tx total is i (so the series is ascending) */
function detailWithDays(days: number): Detail {
    return {
        traffic: {
            day: Array.from({ length: days }, (_, i) => ({
                date: { year: 2026, month: 1, day: i + 1 },
                id: i,
                rx: i,
                tx: 0,
                timestamp: 1_700_000_000 + i,
            })),
        },
    } as unknown as Detail;
}

/** Let a promise returned by a mocked api call settle */
async function settle() {
    await flushPromises();
}

describe('useInterfaceOverview', () => {
    let app: App | null = null;

    beforeEach(() => {
        summaryMock.mockReset();
        statsMock.mockReset();
        detailMock.mockReset();
        // The toast queue lives at module scope, so it has to be reset between cases
        useToast().toasts.value = [];
        summaryMock.mockResolvedValue([summary('eth0'), summary('wlan0')]);
        statsMock.mockResolvedValue({ totalInterfaces: 2, totalRx: 300, totalTx: 150 } as InterfaceStats);
        detailMock.mockResolvedValue(detailWithDays(10));
    });

    afterEach(() => {
        app?.unmount();
        app = null;
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('fetches summary and stats once on mount and exposes both', async () => {
        const [result, mounted] = withSetup();
        app = mounted;
        await settle();

        expect(summaryMock).toHaveBeenCalledTimes(1);
        expect(statsMock).toHaveBeenCalledTimes(1);
        expect(result.summaries.value.map((s) => s.name)).toEqual(['eth0', 'wlan0']);
        expect(result.stats.value).toEqual({ totalInterfaces: 2, totalRx: 300, totalTx: 150 });
    });

    it('polls every 60 seconds', async () => {
        vi.useFakeTimers();
        [, app] = withSetup();
        await settle();
        expect(summaryMock).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(60_000);
        await settle();
        expect(summaryMock).toHaveBeenCalledTimes(2);
    });

    it('passes the poller AbortSignal to the requests so a round can be cancelled', async () => {
        vi.useFakeTimers();
        [, app] = withSetup();
        await settle();
        // The initial mount fetch is not driven by the poller, so it carries no signal
        expect(summaryMock).toHaveBeenLastCalledWith(undefined);

        await vi.advanceTimersByTimeAsync(60_000);
        await settle();
        expect(summaryMock).toHaveBeenLastCalledWith(expect.any(AbortSignal));
        expect(statsMock).toHaveBeenLastCalledWith(expect.any(AbortSignal));
    });

    it('requests details for at most the first 8 interfaces', async () => {
        summaryMock.mockResolvedValue(Array.from({ length: 12 }, (_, i) => summary(`if${i}`)));
        [, app] = withSetup();
        await settle();

        expect(detailMock).toHaveBeenCalledTimes(8);
        expect(detailMock).toHaveBeenCalledWith('if7');
        expect(detailMock).not.toHaveBeenCalledWith('if8');
    });

    it('derives the sparkline from the last 7 rx+tx days, plus today progress', async () => {
        const [result, mounted] = withSetup();
        app = mounted;
        await settle();

        // rx+tx per day is i, so the trailing 7 of 10 days are 3..9
        expect(result.sparklineState.eth0).toEqual([3, 4, 5, 6, 7, 8, 9]);
        expect(result.todayProgressState.eth0).not.toBeNull();
    });

    it('blanks the sparkline when history is too short for a series', async () => {
        detailMock.mockResolvedValue(detailWithDays(1));
        const [result, mounted] = withSetup();
        app = mounted;
        await settle();

        expect(result.sparklineState.eth0).toBeNull();
    });

    it('blanks both sparkline and progress when a detail request fails', async () => {
        detailMock.mockRejectedValue(new Error('detail down'));
        const [result, mounted] = withSetup();
        app = mounted;
        await settle();

        expect(result.sparklineState.eth0).toBeNull();
        expect(result.todayProgressState.eth0).toBeNull();
    });

    it('raises an error toast when the summary request fails', async () => {
        summaryMock.mockRejectedValue(new Error('offline'));
        const { toasts } = useToast();
        [, app] = withSetup();
        await settle();

        expect(toasts.value.some((t) => t.type === 'error')).toBe(true);
    });

    it('stays silent when the round was cancelled (AbortError is not a failure)', async () => {
        summaryMock.mockRejectedValue(new DOMException('aborted', 'AbortError'));
        const { toasts } = useToast();
        [, app] = withSetup();
        await settle();

        expect(toasts.value).toHaveLength(0);
    });

    it('discards a late detail result once the owning scope is gone', async () => {
        let release!: (d: Detail) => void;
        detailMock.mockImplementation(() => new Promise<Detail>((resolve) => (release = resolve)));

        const [result, mounted] = withSetup();
        await settle();

        // Unmount while the detail requests are still in flight, then let them land
        mounted.unmount();
        release(detailWithDays(10));
        await settle();

        // The 'loading' placeholder was written before the await, so it survives; what the guard
        // prevents is the resolved series / progress being written after disposal.
        expect(result.sparklineState.eth0).toBe('loading');
        expect(result.todayProgressState.eth0).toBeUndefined();
    });

    it('refreshes the trend section alongside the summary fetch', async () => {
        const refreshTrend = vi.fn().mockResolvedValue(undefined);
        [, app] = withSetup({ refreshTrend });
        await settle();

        expect(refreshTrend).toHaveBeenCalledTimes(1);
    });

    it('a rejecting trend refresh does not blank the summaries', async () => {
        const refreshTrend = vi.fn().mockRejectedValue(new Error('trend down'));
        const [result, mounted] = withSetup({ refreshTrend });
        app = mounted;
        await settle();

        // Summaries are written before the trend promise is awaited, so they survive
        expect(result.summaries.value).toHaveLength(2);
    });
});
