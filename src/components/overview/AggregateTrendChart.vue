<template>
    <!-- The s2-sheet-section wrapper is owned by the view, as on every other page -->
    <h2 class="s2-section-label">
        {{ t('overview.trend.title', { days: formatNumber(windowDays) }, windowDays) }}
        <span class="s2-section-hint ov-trend-legend">
            <span class="ov-trend-chip">
                <i class="ov-trend-dot ov-trend-dot--rx" />{{ t('overview.trend.rx') }} {{ rxTotalFormatted }}
            </span>
            <span class="ov-trend-chip">
                <i class="ov-trend-dot ov-trend-dot--tx" />{{ t('overview.trend.tx') }} {{ txTotalFormatted }}
            </span>
        </span>
    </h2>

    <!-- First load skeleton -->
    <div
        v-if="status === 'idle' || status === 'loading'"
        class="s2-skeleton ov-trend-skeleton"
        :style="{ height: chartHeight + 'px' }"
    />

    <!-- Load failure (and no historical data to show) -->
    <div v-else-if="failed" class="ov-trend-fallback">
        <span>{{ t('overview.trend.loadFailed') }}</span>
        <button type="button" class="s2-export-btn" @click="refresh()">{{ t('common.retry') }}</button>
    </div>

    <!-- No traffic data in the last 30 days -->
    <div v-else-if="!hasData" class="ov-trend-fallback">
        {{ t('overview.trend.noData', { days: formatNumber(windowDays) }, windowDays) }}
    </div>

    <div v-else class="s2-chart-box">
        <div :style="{ height: chartHeight + 'px' }">
            <Line :data="chartData" :options="chartOptions" />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { Line } from '@/plugins/chartjs';
import type { ChartData, ChartOptions, ScriptableContext } from 'chart.js';
import { useI18n } from 'vue-i18n';
import { useChartTheme } from '@/composables/useChartTheme';

import { AGGREGATE_WINDOW_DAYS, useAggregateTrend } from '@/composables/useAggregateTrend';
import { useDayjs } from '@/composables/useDayjs';
import { useMobile } from '@/composables/useMobile';
import { formatBytes } from '@/utils/bytes';
import { formatNumber } from '@/utils/numbers';
import { hexToRgba } from '@/utils/color';
import { palette } from '@/config/colors';

/**
 * Aggregate trend across all interfaces — a stacked rx/tx area chart for the last 30 days.
 * The data is fetched and cached locally on its own (see useAggregateTrend), independent of the currently selected interface;
 * it manages its own loading / failure / empty states and refreshes with the page polling through the exposed refresh.
 */
const dayjs = useDayjs();
const chartTheme = useChartTheme();
const { t } = useI18n();
const { isMobile } = useMobile();

const { status, series, failed, refresh } = useAggregateTrend();

/** Window size, passed to i18n messages so the copy never hard-codes "30" */
const windowDays = AGGREGATE_WINDOW_DAYS;

/** Chart height: lowered on mobile, same magnitude as the desktop and period pages */
const chartHeight = computed(() => (isMobile.value ? 200 : 260));

const hasData = computed(() => series.value.keys.length > 0);

/** RX / TX totals within the window (for the section title hint slot) */
const rxTotalFormatted = computed(() => formatBytes(series.value.rx.reduce((s, v) => s + v, 0)).formatted);
const txTotalFormatted = computed(() => formatBytes(series.value.tx.reduce((s, v) => s + v, 0)).formatted);

/** Vertical gradient fill: solid at the top fading to transparent at the bottom (scriptable backgroundColor) */
function verticalFade(hex: string, topAlpha: number) {
    return (context: ScriptableContext<'line'>) => {
        const { ctx, chartArea } = context.chart;
        if (!chartArea) return hexToRgba(hex, topAlpha);
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, hexToRgba(hex, topAlpha));
        gradient.addColorStop(1, hexToRgba(hex, 0));
        return gradient;
    };
}

const chartData = computed<ChartData<'line'>>(() => {
    const { keys, rx, tx } = series.value;
    return {
        labels: keys.map((key) => dayjs(key).format(t('common.format.monthDay'))),
        datasets: [
            {
                label: t('overview.trend.rx'),
                data: rx,
                borderColor: palette.rx,
                backgroundColor: verticalFade(palette.rx, 0.28),
                fill: true,
                stack: 'total',
                tension: 0.35,
                pointRadius: 0,
                borderWidth: 2,
            },
            {
                label: t('overview.trend.tx'),
                data: tx,
                borderColor: palette.tx,
                backgroundColor: verticalFade(palette.tx, 0.28),
                fill: true,
                stack: 'total',
                tension: 0.35,
                pointRadius: 0,
                borderWidth: 2,
            },
        ],
    };
});

const chartOptions = computed<ChartOptions<'line'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
        legend: { display: false },
        tooltip: {
            callbacks: {
                title: (items) => {
                    const idx = items[0]?.dataIndex;
                    const key = series.value.keys[idx ?? -1];
                    return key ? dayjs(key).format(t('common.format.dateWeekday')) : '';
                },
                label: (ctx) => {
                    const bytes = ctx.parsed.y;
                    return bytes === null
                        ? `${ctx.dataset.label}: --`
                        : `${ctx.dataset.label}: ${formatBytes(bytes).formatted}`;
                },
            },
        },
    },
    scales: {
        x: {
            stacked: true,
            grid: { display: false },
            ticks: {
                maxTicksLimit: isMobile.value ? 5 : 10,
                color: chartTheme.value.textColor,
            },
        },
        y: {
            stacked: true,
            beginAtZero: true,
            grid: { color: chartTheme.value.gridColor },
            ticks: {
                maxTicksLimit: 6,
                color: chartTheme.value.textColor,
                callback(this: unknown, tickValue: string | number) {
                    const bytes = typeof tickValue === 'string' ? Number(tickValue) : tickValue;
                    return formatBytes(bytes).formatted;
                },
            },
        },
    },
}));

/** For the parent component to refresh the trend data on polling */
defineExpose({ refresh });
</script>

<style scoped>
/* Inline mini legend inside the title hint (no legend box, replaces the Chart.js legend) */
.ov-trend-legend {
    display: inline-flex;
    gap: 12px;
}

.ov-trend-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
}

.ov-trend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.ov-trend-dot--rx {
    background: var(--rx);
}

.ov-trend-dot--tx {
    background: var(--tx);
}

.ov-trend-skeleton {
    border-radius: var(--s2-radius-sm);
}

.ov-trend-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    height: 120px;
    font-family: var(--font-sans);
    font-size: 13px;
    color: var(--s2-text-muted);
}
</style>
