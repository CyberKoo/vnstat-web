import { computed, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ChartOptions } from 'chart.js';
import type { InterfaceLinkSpeed, TimedNetworkStats, VnstatInterfaceDetail } from '@/types/network';
import { formatBytes } from '@/utils/bytes';
import { formatNumber } from '@/utils/numbers';
import { LINK_SPEED } from '@/config';
import { palette } from '@/config/colors';
import { mbpsToBytesPerSec } from '@/composables/liveThreshold';
import { FIVEMINUTE_INTERVAL_SEC } from '@/composables/replayWindow';
import { useSpeedFormat } from '@/composables/useSpeedFormat';

/**
 * Chart data and options configuration for each chart of the interface monitor page.
 *
 * Centralises the chart computation logic of InterfaceMonitor.vue here,
 * keeping the view layer clean.
 */
export function useLiveChartOptions(
    latestTraffic: Ref<TimedNetworkStats | null>,
    detailRef: Ref<VnstatInterfaceDetail | null>,
    linkSpeedRef: Ref<InterfaceLinkSpeed | null>,
) {
    const { formatSpeed } = useSpeedFormat();
    const { t } = useI18n();

    // ── PPS donut ──

    const ppsDonutData = computed(() => {
        const stats = latestTraffic.value?.stats;
        const rxPPS = stats?.rx?.packetspersecond ?? 0;
        const txPPS = stats?.tx?.packetspersecond ?? 0;
        return {
            labels: [t('common.rx'), t('common.tx')],
            datasets: [
                {
                    data: [rxPPS, txPPS],
                    backgroundColor: [palette.rx, palette.tx],
                    borderWidth: 0,
                    hoverOffset: 4,
                },
            ],
        };
    });

    // maintainAspectRatio is off, so as with the mini bar chart the container height drives the size,
    // which stops the doughnut from breaking the row height by its width on small screens with wide columns
    const ppsDonutOptions: ChartOptions<'doughnut'> = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '80%',
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx) =>
                        t('live.bottom.ppsTooltip', {
                            label: ctx.label,
                            value: formatNumber(ctx.parsed, { useGrouping: true }),
                        }),
                },
            },
        },
    };

    const ppsTotal = computed(() => {
        const stats = latestTraffic.value?.stats;
        return formatNumber((stats?.rx?.packetspersecond ?? 0) + (stats?.tx?.packetspersecond ?? 0), {
            useGrouping: true,
        });
    });

    /** PPS and share of receive / send respectively (for the breakdown legend next to the doughnut) */
    const ppsStats = computed(() => {
        const stats = latestTraffic.value?.stats;
        const rx = stats?.rx?.packetspersecond ?? 0;
        const tx = stats?.tx?.packetspersecond ?? 0;
        const total = rx + tx;
        return {
            rx,
            tx,
            rxPct: total > 0 ? Math.round((rx / total) * 100) : 0,
            txPct: total > 0 ? Math.round((tx / total) * 100) : 0,
        };
    });

    // ── Compact 24h bar ──

    const s2CompactData = computed(() => {
        const hours = detailRef.value?.traffic?.hour?.slice(-24) ?? [];
        return {
            labels: hours.map(() => ''),
            datasets: [
                {
                    label: 'RX',
                    data: hours.map((h) => h.rx ?? 0),
                    backgroundColor: palette.rx,
                    borderRadius: 2,
                },
                {
                    label: 'TX',
                    data: hours.map((h) => h.tx ?? 0),
                    backgroundColor: palette.tx,
                    borderRadius: 2,
                },
            ],
        };
    });

    const compactStats = computed(() => {
        // Not loaded yet: "-"; a loaded-but-empty history below is an honest "0 B"
        if (!detailRef.value) return { total: '-', rxPct: 50, txPct: 50 };
        const hours = detailRef.value.traffic?.hour?.slice(-24) ?? [];
        if (!hours.length) return { total: '0 B', rxPct: 50, txPct: 50 };
        const totalRx = hours.reduce((s, h) => s + (h.rx ?? 0), 0);
        const totalTx = hours.reduce((s, h) => s + (h.tx ?? 0), 0);
        const grandTotalTotal = totalRx + totalTx;
        const rxPct = grandTotalTotal > 0 ? Math.round((totalRx / grandTotalTotal) * 100) : 50;
        const txPct = grandTotalTotal > 0 ? Math.round((totalTx / grandTotalTotal) * 100) : 50;
        return { total: formatBytes(grandTotalTotal).formatted, rxPct, txPct };
    });

    const s2CompactOptions: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
            x: { stacked: true, display: false, grid: { display: false }, border: { display: false } },
            y: {
                stacked: true,
                display: false,
                grid: { display: false },
                border: { display: false },
                beginAtZero: true,
            },
        },
        interaction: { mode: undefined, intersect: false },
        events: [],
    };

    /** Effective link speed (Mbps), falling back to the configured default when the API provides none */
    const effectiveLinkSpeed = computed(() => {
        const ls = linkSpeedRef.value;
        return {
            rx: ls && ls.rx > 0 ? ls.rx : LINK_SPEED,
            tx: ls && ls.tx > 0 ? ls.tx : LINK_SPEED,
        };
    });

    /** Bandwidth limit (the larger of RX/TX, following the global rate unit) */
    const maxBandwidth = computed(() =>
        formatSpeed(mbpsToBytesPerSec(Math.max(effectiveLinkSpeed.value.rx, effectiveLinkSpeed.value.tx)), 1),
    );

    /**
     * Recent peak rates (bytes/s) per direction: the highest 5-minute average among the last 36
     * five-minute entries (≈3h, the same window as the mini trend bar). The utilisation bars scale
     * against this instead of the link capacity — a 28 Kbps stream on a 1 Gbps link used to pin
     * both bars at a rounded 0%, leaving them without any information.
     */
    const recentPeak = computed(() => {
        const items = detailRef.value?.traffic?.fiveminute?.slice(-36) ?? [];
        let rx = 0;
        let tx = 0;
        for (const d of items) {
            rx = Math.max(rx, (d.rx ?? 0) / FIVEMINUTE_INTERVAL_SEC);
            tx = Math.max(tx, (d.tx ?? 0) / FIVEMINUTE_INTERVAL_SEC);
        }
        return { rx, tx };
    });

    /** Current rate as a share of the recent peak (the current rate joins the max, so it never overflows) */
    const rxPeakPct = computed(() => {
        const cur = latestTraffic.value?.stats?.rx?.bytespersecond ?? 0;
        const base = Math.max(recentPeak.value.rx, cur);
        return base > 0 ? Math.min(Math.round((cur / base) * 100), 100) : 0;
    });

    /** TX share of the recent peak */
    const txPeakPct = computed(() => {
        const cur = latestTraffic.value?.stats?.tx?.bytespersecond ?? 0;
        const base = Math.max(recentPeak.value.tx, cur);
        return base > 0 ? Math.min(Math.round((cur / base) * 100), 100) : 0;
    });

    /** Current RX/TX rates, formatted (shown beside the bars; the link capacity stays in the header) */
    const rxRate = computed(() => formatSpeed(latestTraffic.value?.stats?.rx?.bytespersecond ?? 0));
    const txRate = computed(() => formatSpeed(latestTraffic.value?.stats?.tx?.bytespersecond ?? 0));

    // ── Mini trend bar ──

    const s2MiniBarData = computed(() => {
        const items = detailRef.value?.traffic?.fiveminute?.slice(-36) ?? [];
        const rxData = items.map((d) => d.rx ?? 0);
        const txData = items.map((d) => d.tx ?? 0);
        const sums = rxData.map((rx, i) => rx + (txData[i] ?? 0));
        const maxSum = Math.max(...sums, 1);
        const normRx = rxData.map((v) => v / maxSum);
        const normTx = txData.map((v) => v / maxSum);
        return {
            labels: items.map(() => ''),
            datasets: [
                { label: 'RX', data: normRx, backgroundColor: palette.rx, borderRadius: 1, stack: 'traffic' },
                { label: 'TX', data: normTx, backgroundColor: palette.tx, borderRadius: 1, stack: 'traffic' },
            ],
        };
    });

    const s2MiniBarOptions: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        // The normalised stack keeps the tallest bar at full height; a little padding at the top avoids
        // the look of it being "cut off"
        layout: { padding: { top: 6 } },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
            x: { stacked: true, display: false, grid: { display: false }, border: { display: false } },
            y: {
                stacked: true,
                display: false,
                grid: { display: false },
                border: { display: false },
                beginAtZero: true,
                min: 0,
                max: 1,
            },
        },
        interaction: { mode: undefined, intersect: false },
        events: [],
    };

    return {
        ppsDonutData,
        ppsDonutOptions,
        ppsTotal,
        ppsStats,
        s2CompactData,
        s2CompactOptions,
        compactStats,
        maxBandwidth,
        rxPeakPct,
        txPeakPct,
        rxRate,
        txRate,
        s2MiniBarData,
        s2MiniBarOptions,
    };
}
