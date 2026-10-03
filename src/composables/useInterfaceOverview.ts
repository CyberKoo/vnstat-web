import { onMounted, onScopeDispose, reactive, ref } from 'vue';

import { getInterfacesStats, getInterfacesSummary } from '@/api/interfaces';
import { getInterfaceDetailCached } from '@/composables/useInterfaceDetailCache';
import { useDayjs } from '@/composables/useDayjs';
import { usePoll } from '@/composables/usePoll';
import { useToast } from '@/composables/useToast';
import { extractTodayProgress, type TodayProgress } from '@/composables/useTodayProgress';
import { i18n } from '@/plugins/i18n';
import type { InterfaceStats, InterfaceSummary } from '@/types/network';

/** Upper limit on interfaces with in-row sparklines, to avoid too many concurrent detail requests when the list is long */
export const SPARKLINE_MAX_INTERFACES = 8;

/** Number of trailing days kept for the in-row sparkline */
const SPARKLINE_DAYS = 7;

/** Overview polling interval, aligned with the interface detail cache TTL so each round sees fresh data */
const POLL_INTERVAL_MS = 60_000;

/**
 * In-row sparkline state: loading / 7 day rx+tx series / null (failed or not enough data, left blank)
 */
export type SparklineState = 'loading' | number[] | null;

/** Options for {@link useInterfaceOverview} */
export interface UseInterfaceOverviewOptions {
    /**
     * Refreshes the aggregate trend section, run in parallel with the summary fetch.
     *
     * The trend lives in a child component, so the caller owns the ref and passes the call down
     * rather than this composable reaching into a component — a composable consumed *by* that
     * component must not depend on it.
     */
    refreshTrend?: (signal?: AbortSignal) => Promise<void> | void;
}

/**
 * Data source for the all-interfaces overview page.
 *
 * Owns every request the page makes: the summary + stats pair, and the in-row sparkline / today
 * progress details. Views should consume this instead of calling `@/api` themselves, so the
 * fetching strategy (caching, cancellation, stale-response guards) stays in one place and the
 * page cannot accidentally grow a second one.
 *
 * The interface details go through the shared module-level cache, so the overview rows and the
 * aggregate trend chart reuse the same request per interface.
 *
 * @param options See {@link UseInterfaceOverviewOptions}
 * @returns summaries interface summaries, stats aggregated totals, sparklineState per-interface
 *   sparkline state, todayProgressState per-interface today progress
 *
 * @example
 * ```ts
 * const { summaries, stats, sparklineState, todayProgressState } = useInterfaceOverview({
 *     refreshTrend: (signal) => trendChartRef.value?.refresh(signal),
 * });
 * ```
 */
export function useInterfaceOverview(options: UseInterfaceOverviewOptions = {}) {
    const toast = useToast();
    const dayjs = useDayjs();

    const summaries = ref<InterfaceSummary[]>([]);
    const stats = ref<InterfaceStats>({ totalInterfaces: 0, totalRx: 0, totalTx: 0 });

    /** Interface name → sparkline state (dynamic keys are tracked by the Vue 3 reactivity proxy) */
    const sparklineState = reactive<Record<string, SparklineState>>({});

    /** Interface name → today's progress (a missing key means loading; failure or insufficient history is null, so the share ring shows "-") */
    const todayProgressState = reactive<Record<string, TodayProgress | null>>({});

    /** Today's date key (updated along with the polling refresh) */
    const todayKey = () => dayjs().format('YYYY-MM-DD');

    /** Sparkline fetch generation: once a new round starts, late results from the previous round are discarded */
    let sparkEpoch = 0;

    /** Whether the owning scope is gone: all late results are ignored after that */
    let disposed = false;

    onScopeDispose(() => {
        disposed = true;
    });

    /**
     * Concurrently fetch the 7 day traffic detail for the first {@link SPARKLINE_MAX_INTERFACES}
     * interfaces, extracting the rx+tx series as in-row sparkline data, and also extracting today's
     * progress (today's usage + the daily average over the last 30 days) to drive the today share ring.
     * The detail goes through the local cache (sharing the same request as the all-interfaces trend).
     * The first load sets loading (a skeleton placeholder inside the table); failures silently stay
     * blank; once the scope is disposed or a new round of fetching starts, late results are no longer
     * written into the state.
     */
    async function loadSparklines(list: InterfaceSummary[]) {
        const epoch = ++sparkEpoch;
        const targets = list.slice(0, SPARKLINE_MAX_INTERFACES);
        // Interfaces that already have data update silently, avoiding a periodic skeleton flicker
        for (const item of targets) {
            if (!(item.name in sparklineState)) sparklineState[item.name] = 'loading';
        }
        await Promise.all(
            targets.map(async (item) => {
                try {
                    const detail = await getInterfaceDetailCached(item.name);
                    if (disposed || epoch !== sparkEpoch) return;
                    // Take the rx+tx total series for the last 7 days
                    const series = detail.traffic.day.slice(-SPARKLINE_DAYS).map((day) => day.rx + day.tx);
                    sparklineState[item.name] = series.length >= 2 ? series : null;
                    todayProgressState[item.name] = extractTodayProgress(detail.traffic.day, todayKey());
                } catch {
                    if (disposed || epoch !== sparkEpoch) return;
                    sparklineState[item.name] = null;
                    todayProgressState[item.name] = null;
                }
            }),
        );
    }

    /**
     * Fetch the summary + stats pair, then kick off the row details.
     *
     * @param signal Optional external AbortSignal from the poller
     */
    async function fetchData(signal?: AbortSignal) {
        // The all-interfaces trend refreshes together with the page polling; refresh absorbs failures internally and does not throw
        const trendReady = options.refreshTrend?.(signal);
        try {
            const [summaryData, statsData] = await Promise.all([
                getInterfacesSummary(signal),
                getInterfacesStats(signal),
            ]);
            summaries.value = summaryData;
            stats.value = statsData;
            // The sparkline detail is fetched independently, does not block the main data, and fails silently
            void loadSparklines(summaryData);
            await trendReady;
        } catch (err) {
            // An intentional cancel (stop / re-polling) is handled silently, with no error message
            if (err instanceof DOMException && err.name === 'AbortError') return;
            toast.error(i18n.global.t('overview.fetchFailed'));
        }
    }

    onMounted(() => {
        fetchData();
    });

    usePoll(
        async ({ signal }) => {
            await fetchData(signal ?? undefined);
        },
        {
            intervalMs: POLL_INTERVAL_MS,
            immediate: false,
        },
    );

    return { summaries, stats, sparklineState, todayProgressState };
}
