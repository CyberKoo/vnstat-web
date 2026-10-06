import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { nextTick, shallowRef } from 'vue';

import InterfaceMonitor from '@/views/InterfaceMonitor.vue';
import { DAYJS_KEY } from '@/composables/useDayjs';
import { useLiveNetworkStats } from '@/composables/useLiveNetworkStats';
import dayjs from '@/plugins/dayjs';
import { i18n } from '@/plugins/i18n';
import type { NetworkStats, TimedNetworkStats } from '@/types/network';

vi.mock('@/composables/useLiveNetworkStats', () => ({ useLiveNetworkStats: vi.fn() }));
vi.mock('@/plugins/chartjs', () => ({ Bar: {}, Doughnut: {} }));

const latest = shallowRef<TimedNetworkStats | null>(null);
const originalLocale = i18n.global.locale.value;
let wrapper: VueWrapper | undefined;

function sample(timestamp: number): TimedNetworkStats {
    const direction = {
        ratestring: '1 kbit/s',
        bytespersecond: 125,
        packetspersecond: 1,
        bytes: 125,
        packets: 1,
        totalbytes: 125,
        totalpackets: 1,
    };
    const stats: NetworkStats = { index: 1, seconds: 1, rx: direction, tx: { ...direction } };
    return { timestamp, stats };
}

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 5, 13, 2, 3));
    i18n.global.locale.value = 'zh-CN';
    latest.value = null;
    vi.mocked(useLiveNetworkStats).mockReturnValue({
        latest,
        usage: { rx: { formatted: '1 Kbps' }, tx: { formatted: '1 Kbps' }, total: { formatted: '2 Kbps' } },
        open: vi.fn(),
        close: vi.fn(),
        resetTraffic: vi.fn(),
    } as unknown as ReturnType<typeof useLiveNetworkStats>);
});

afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    i18n.global.locale.value = originalLocale;
    vi.useRealTimers();
});

function mountMonitor() {
    wrapper = mount(InterfaceMonitor, {
        global: {
            plugins: [i18n, createTestingPinia({ createSpy: vi.fn })],
            provide: { [DAYJS_KEY as symbol]: dayjs },
            stubs: { CompactTrafficCard: true, LiveChartArea: true, BottomCards: true },
        },
    });
    // The real LiveHeader renders the parent view's formatted receipt time.
    return () => wrapper!.find('.s2-live-meta-line .mono').text();
}

describe('InterfaceMonitor receipt time', () => {
    it('keeps the initial time visible and reformats it without receiving a sample', async () => {
        const displayedTime = mountMonitor();
        expect(displayedTime()).toBe('13:02:03');

        vi.setSystemTime(new Date(2026, 9, 5, 18, 45, 59));
        i18n.global.locale.value = 'en-US';
        await nextTick();
        expect(displayedTime()).toBe('1:02:03 PM');
        expect(latest.value).toBeNull();
    });

    it('changes only the format on language switches and advances the time only on new data', async () => {
        const displayedTime = mountMonitor();
        const receivedAt = new Date(2026, 9, 5, 14, 6, 7);
        vi.setSystemTime(receivedAt);
        // The update label is the local receipt time, not a possibly older sample timestamp.
        latest.value = sample(receivedAt.getTime() - 60_000);
        await nextTick();
        expect(displayedTime()).toBe('14:06:07');
        const receivedSample = latest.value;

        vi.setSystemTime(new Date(2026, 9, 5, 19, 30, 40));
        i18n.global.locale.value = 'en-US';
        await nextTick();
        expect(displayedTime()).toBe('2:06:07 PM');
        expect(latest.value).toBe(receivedSample);
        expect(latest.value!.timestamp).toBe(receivedAt.getTime() - 60_000);

        i18n.global.locale.value = 'zh-CN';
        await nextTick();
        expect(displayedTime()).toBe('14:06:07');

        latest.value = sample(Date.now());
        await nextTick();
        expect(displayedTime()).toBe('19:30:40');
    });
});
