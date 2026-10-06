<template>
    <div class="s2-sheet">
        <!-- Overview metric band -->
        <div class="s2-sheet-section">
            <div class="s2-metric-band">
                <div class="s2-metric">
                    <div class="s2-stat-value s2-stat-value--brand">{{ recordCount }}</div>
                    <div class="s2-stat-label">
                        {{ t('top.metrics.records') }}
                        <span class="s2-stat-sub">{{ t('top.metrics.counterSuffix') }}</span>
                    </div>
                </div>
                <div class="s2-metric">
                    <div class="s2-stat-value">{{ totalTrafficFormatted }}</div>
                    <div class="s2-stat-label">{{ t('top.metrics.totalTraffic') }}</div>
                </div>
                <div class="s2-metric">
                    <div class="s2-stat-value s2-stat-value--accent">{{ peakPercentage }}</div>
                    <div class="s2-stat-label">{{ t('top.metrics.peakShare') }}</div>
                </div>
            </div>
        </div>

        <!-- Traffic ranking chart + open sidebar -->
        <section class="s2-sheet-section">
            <h2 class="s2-section-label">
                {{ t('top.chart.title')
                }}<span v-if="topItems.length > CHART_TOP_N" class="s2-section-hint">{{
                    t('top.chart.hint', { n: CHART_TOP_N, total: topItems.length })
                }}</span>
            </h2>
            <div class="s2-chart-area">
                <div class="s2-chart-box">
                    <div :style="{ height: chartHeight + 'px' }">
                        <Bar :data="chartData" :options="chartOptions" :plugins="chartPlugins" />
                    </div>
                </div>
                <div class="s2-sidebar-glass s2-sidebar-fixed">
                    <div class="s2-sidebar-item">
                        <div class="s2-sidebar-label">{{ t('top.donut.title') }}</div>
                        <div class="s2-ring-wrap s2-ring-wrap--sm">
                            <Doughnut :data="donutData" :options="donutOptions" />
                            <div class="s2-ring-center">
                                <div class="s2-ring-center-val">{{ sideStats.rxPercent }}</div>
                                <div class="s2-ring-center-label">{{ t('common.rx') }}</div>
                            </div>
                        </div>
                    </div>
                    <div class="s2-sidebar-divider"></div>
                    <div class="s2-sidebar-item">
                        <div class="s2-sidebar-label">{{ t('top.side.details') }}</div>
                        <div class="s2-sidebar-stats">
                            <div class="s2-sidebar-row">
                                <span class="s2-sidebar-row-label">{{ t('top.side.count') }}</span
                                ><span class="mono s2-mono-strong"
                                    >{{ sideStats.count }} {{ t('top.metrics.counterSuffix') }}</span
                                >
                            </div>
                            <div class="s2-sidebar-row">
                                <span class="s2-sidebar-row-label">{{ t('top.metrics.totalTraffic') }}</span
                                ><span class="mono s2-mono-strong">{{ sideStats.total }}</span>
                            </div>
                            <div class="s2-sidebar-row">
                                <span class="s2-sidebar-row-label">{{ t('top.metrics.peakShare') }}</span
                                ><span class="mono s2-mono-strong">{{ sideStats.peakPercent }}</span>
                            </div>
                            <div class="s2-sidebar-row">
                                <span class="s2-sidebar-row-label">{{ t('top.side.rxShare') }}</span
                                ><span class="mono s2-mono-strong">{{ sideStats.rxPercent }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Ranking detail table -->
        <section class="s2-sheet-section">
            <h2 class="s2-section-label">
                {{ t('top.table.title') }}<span class="s2-section-hint">{{ t('top.table.hint') }}</span>
            </h2>
            <div class="s2-table-scroll s2-table-scroll--dense">
                <table class="s2-table">
                    <caption class="s2-visually-hidden">
                        {{
                            $t('top.table.title')
                        }}
                    </caption>
                    <colgroup v-if="!isMobile">
                        <col style="width: 48px" />
                        <col v-for="col in tableColumns" :key="col.key" :style="{ width: col.width }" />
                    </colgroup>
                    <thead>
                        <tr>
                            <th scope="col">
                                <span class="s2-visually-hidden">{{ t('top.table.rank') }}</span
                                >#
                            </th>
                            <th v-for="col in tableColumns" :key="col.key" scope="col">{{ col.title }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(row, i) in tableData" :key="row.timestamp">
                            <td class="s2-rank">
                                <span
                                    class="s2-rank-badge"
                                    :class="{ 's2-rank-badge--top': i < 3 }"
                                    :style="i < 3 ? { color: RANK_COLORS[i] } : undefined"
                                    >{{ i + 1 }}</span
                                >
                            </td>
                            <th scope="row">{{ row.time }}</th>
                            <td v-for="col in dataColumns" :key="col.key">{{ row[col.key] }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    </div>
</template>

<script lang="ts" setup>
import { Bar, Doughnut } from '@/plugins/chartjs';
import { useChartTheme } from '@/composables/useChartTheme';
import type { ChartData, ChartOptions, ScriptableContext, TooltipItem } from 'chart.js';
import { computed, type ComputedRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMobile } from '@/composables/useMobile';
import { useDayjs } from '@/composables/useDayjs';
import { useSpeedFormat } from '@/composables/useSpeedFormat';
import { formatBytes } from '@/utils/bytes';
import { formatDecimal } from '@/utils/numbers';
import { hexToRgba } from '@/utils/color';
import { useInterfaceDetailStore } from '@/stores/interfaceDetail';
import { palette } from '@/config/colors';
import { buildDonutData, donutOptions } from '@/composables/useTrafficChart';
import { computeRxTxTotals, computeTotalBytes, buildBarBase } from '@/composables/useTrafficStats';
import { CHART_TOP_N, peakSharePercent, rankByTotal } from '@/composables/topRanking';
import { createMeanLinePlugin } from '@/components/charts/meanLinePlugin';

const dayjs = useDayjs();
const chartTheme = useChartTheme();
const { t } = useI18n();
const { isMobile } = useMobile();
const { formatSpeed } = useSpeedFormat();
const interfaceDetailStore = useInterfaceDetailStore();

/** top data source */
const topItems = computed(() => interfaceDetailStore.value?.traffic?.top ?? []);

/**
 * Ranking bar chart height (px).
 *
 * On desktop 420px is the floor and it grows adaptively at about 34px per row;
 * on mobile it is fixed at about 280px, so the chart does not take up too much vertical space on small screens.
 */
const chartHeight = computed(() => {
    const n = Math.max(Math.min(topItems.value.length, CHART_TOP_N), 1);
    return isMobile.value ? 280 : Math.max(420, n * 34 + 64);
});

/** Accent colors for the top three bars / rank badges: 1st accent, 2nd brand, 3rd tx */
const RANK_COLORS = [palette.accent, palette.brand, palette.tx] as const;

/** Bar fill color: the top three are accented, the rest use the brand color at 35% opacity */
function barColor(ctx: ScriptableContext<'bar'>): string {
    const i = ctx.dataIndex;
    return i < RANK_COLORS.length ? RANK_COLORS[i] : hexToRgba(palette.brand, 0.35);
}

/** Mean reference line injected into vue-chartjs. The theme is read at draw time */
const chartPlugins = [
    createMeanLinePlugin(() => ({
        fontFamily: chartTheme.value.fontFamily,
        surfaceColor: chartTheme.value.surfaceColor,
    })),
];

/**
 * The top CHART_TOP_N entries sorted by total traffic in descending order (1st place at the top).
 */
const chartItems = computed(() => rankByTotal(topItems.value, CHART_TOP_N));

const recordCount = computed(() => topItems.value.length);

const totalTrafficFormatted = computed(() => {
    const items = topItems.value;
    if (!items.length) return '0 B';
    return formatBytes(computeTotalBytes(items)).formatted;
});

const peakPercentage = computed(() => peakSharePercent(topItems.value));

/**
 * Horizontal ranking bar chart data.
 *
 * Sorted by total traffic in descending order (1st place at the top), taking only the top CHART_TOP_N;
 * the top three use the accent / rx / tx accent colors, the rest use rx at 35% opacity.
 */
const chartData: ComputedRef<ChartData<'bar'>> = computed(() => {
    const items = chartItems.value;
    const labels = items.map((d) => dayjs.unix(d.timestamp).format(t('common.format.date')));
    const totals = items.map((d) => (d.rx ?? 0) + (d.tx ?? 0));
    const { barPercentage, categoryPercentage } = buildBarBase(items.length);
    return {
        labels,
        datasets: [
            {
                label: t('top.metrics.totalTraffic'),
                data: totals,
                backgroundColor: barColor,
                borderRadius: { topRight: 6, bottomRight: 6 },
                barPercentage,
                categoryPercentage,
            },
        ],
    };
});

/** Horizontal ranking bar chart options (indexAxis: 'y') */
const chartOptions = computed<ChartOptions<'bar'>>(() => ({
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: {
        duration: 600,
        easing: 'linear',
    },
    layout: {
        padding: {
            top: 16,
            right: 12,
        },
    },
    plugins: {
        legend: {
            display: false,
        },
        title: {
            display: false,
        },
        tooltip: {
            enabled: true,
            callbacks: {
                // The title includes the rank, e.g. "#1 · 2026-04-06"
                title: (items: TooltipItem<'bar'>[]) => `#${items[0].dataIndex + 1} · ${items[0].label}`,
                // The value reuses the formatBytes formatting
                label: (context: TooltipItem<'bar'>) =>
                    `${context.dataset.label}: ${formatBytes(context.parsed.x ?? 0).formatted}`,
            },
        },
    },
    scales: {
        // Horizontal bars: the x axis is a linear value axis
        x: {
            type: 'linear',
            beginAtZero: true,
            grid: {
                color: chartTheme.value.gridColor,
            },
            ticks: {
                maxTicksLimit: 6,
                color: chartTheme.value.textColor,
                callback: (tickValue) => formatBytes(Number(tickValue), 0).formatted,
            },
        },
        // The y axis is a category axis: Chart.js 4 horizontal bars place the 1st category at the top by default
        y: {
            grid: {
                display: false,
            },
            ticks: {
                color: chartTheme.value.textColor,
                autoSkip: true,
            },
        },
    },
}));

const donutData = computed<ChartData<'doughnut'>>(() => buildDonutData(topItems.value));

const sideStats = computed(() => {
    const items = topItems.value;
    const count = items.length;
    if (!count) return { count: 0, total: '0 B', peakPercent: '0%', rxPercent: '0%' };
    const { totalRx, total } = computeRxTxTotals(items);
    return {
        count,
        total: formatBytes(total).formatted,
        peakPercent: peakSharePercent(items),
        rxPercent: total > 0 ? formatDecimal((totalRx / total) * 100, 1) + '%' : '0%',
    };
});

/** Table row data (already formatted) */
type TopRow = {
    /** Record timestamp (seconds), used as the row key */
    timestamp: number;
    /** Date (YYYY-MM-DD) */
    time: string;
    received: string;
    sent: string;
    total: string;
    avgSpeed: string;
};

const tableColumns = computed<{ key: keyof TopRow; title: string; width: string }[]>(() => {
    if (isMobile.value)
        return [
            { key: 'time', title: t('top.columns.date'), width: '28%' },
            { key: 'total', title: t('top.columns.total'), width: '38%' },
            { key: 'avgSpeed', title: t('top.columns.avgSpeed'), width: '34%' },
        ];
    return [
        { key: 'time', title: t('top.columns.date'), width: '16%' },
        { key: 'received', title: t('common.rx'), width: '20%' },
        { key: 'sent', title: t('common.tx'), width: '20%' },
        { key: 'total', title: t('top.columns.total'), width: '22%' },
        { key: 'avgSpeed', title: t('top.columns.avgSpeed'), width: '22%' },
    ];
});

const tableData = computed<TopRow[]>(() => {
    return topItems.value.slice().map((d) => ({
        timestamp: d.timestamp,
        time: dayjs.unix(d.timestamp).format(t('common.format.date')),
        received: formatBytes(d.rx ?? 0).formatted,
        sent: formatBytes(d.tx ?? 0).formatted,
        total: formatBytes((d.rx ?? 0) + (d.tx ?? 0)).formatted,
        // Average rate = the day's total traffic / 86400 seconds, following the global unit preference in the top bar
        avgSpeed: formatSpeed(((d.rx ?? 0) + (d.tx ?? 0)) / 86400),
    }));
});

/** Body cells only: the first column (time) is rendered separately as the row header */
const dataColumns = computed(() => tableColumns.value.slice(1));
</script>

<style scoped>
/* ══ Frameless tweaks inside the sheet ══ */
/* The chart area's vertical spacing comes from the section padding and the section title */
.s2-chart-area {
    margin: 0;
}

/* Zero out the table scroll area padding so it aligns with the chart on the same content edge */
.s2-table-scroll--dense {
    padding: 0;
}

/* .s2-metric does not declare box-sizing: the theme's mobile two-column 50% layout includes padding/border,
   so border-box is required to keep two per row */
.s2-metric {
    box-sizing: border-box;
}

/* ══ Rank column width ══ */
.s2-rank {
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 600;
    color: var(--s2-text-muted);
    width: 48px;
}

/* ══ Rank badge ══ */
.s2-rank-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

/* Top three badges: leading dot, color bound by the inline style */
.s2-rank-badge--top::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
}

@media (--mobile) {
    .s2-rank {
        width: 32px;
        padding-left: 0;
    }
}
</style>
