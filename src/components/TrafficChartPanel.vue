<template>
    <!-- Section title row + chart mode toggle (modifier class --with-actions: hairline centered, tools pushed right).
         The toggle is a sibling of the h2, not its child: a radio group inside the heading would be
         announced as part of the heading text -->
    <div class="s2-section-label s2-section-label--with-actions">
        <h2 class="s2-chart-title-text">{{ resolvedChartTitle }}</h2>
        <SegmentedToggle
            v-model="modeModel"
            :options="modeOptions"
            :label="t('chart.mode.label')"
            class="s2-chart-mode-toggle"
        />
    </div>

    <div class="s2-chart-area s2-chart-panel-area">
        <div class="s2-chart-box">
            <div :style="{ height: chartHeight + 'px' }">
                <!-- Mode switching updates in place (no instance rebuild): each mode's dataset explicitly carries the full
                     attributes, so vue-chartjs's shallow merge leaves no residue, Chart.js morphs in place, and the axes and grid stay stable -->
                <Bar :data="chartData" :options="chartOptions" />
            </div>
        </div>
        <div class="s2-sidebar-glass s2-sidebar-fixed">
            <div class="s2-sidebar-item">
                <div class="s2-sidebar-label">{{ t('chart.panel.composition') }}</div>
                <div class="s2-ring-wrap s2-ring-wrap--lg">
                    <Doughnut :data="donutData" :options="donutOptions" />
                    <div class="s2-ring-center">
                        <div class="s2-ring-center-val">{{ rxPercent }}</div>
                        <div class="s2-ring-center-label">RX</div>
                    </div>
                </div>
            </div>
            <div class="s2-sidebar-divider"></div>
            <div class="s2-sidebar-item">
                <div class="s2-sidebar-label">{{ t('chart.panel.details') }}</div>
                <div class="s2-sidebar-stats">
                    <div v-for="row in detailRows" :key="row.label" class="s2-sidebar-row">
                        <span class="s2-sidebar-row-label">{{ row.label }}</span>
                        <span class="mono s2-mono-strong">{{ row.value }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { Bar, Doughnut } from '@/plugins/chartjs';
import type { ChartData, ChartOptions } from 'chart.js';
import { useI18n } from 'vue-i18n';
import { donutOptions } from '@/composables/useTrafficChart';
import { useChartMode } from '@/composables/useChartMode';
import SegmentedToggle from '@/components/charts/SegmentedToggle.vue';

/**
 * Detail row configuration.
 */
export interface DetailRow {
    /** Label text */
    label: string;
    /** Display value */
    value: string;
}

const props = withDefaults(
    defineProps<{
        /** Bar chart data */
        chartData: ChartData<'bar'>;
        /** Bar chart options */
        chartOptions: ChartOptions<'bar'>;
        /** Chart height (pixels) */
        chartHeight: number;
        /** Doughnut ring chart data */
        donutData: ChartData<'doughnut'>;
        /** RX share (with the percent sign, e.g. "35.6%") */
        rxPercent: string;
        /** Detail row configuration array */
        detailRows: DetailRow[];
        /** Whether to offer the "cumulative" chart mode (not offered in the hourly view) */
        allowCumulative?: boolean;
        /** Main chart section title (translated by the caller) */
        chartTitle?: string;
    }>(),
    { allowCumulative: false, chartTitle: undefined },
);

const { t } = useI18n();

/**
 * The parent page always passes a period-specific translated title; the fallback only keeps the old
 * hardcoded default for callers that omit the prop
 */
const resolvedChartTitle = computed(() => props.chartTitle ?? t('periods.day.chartTitle'));

const { chartMode, setChartMode } = useChartMode();

/**
 * Two-way binding proxy for SegmentedToggle:
 * when the current period does not support cumulative, a persisted 'cumulative' value falls back to displaying as 'bar'
 */
const modeModel = computed<string>({
    get: () => (chartMode.value === 'cumulative' && !props.allowCumulative ? 'bar' : chartMode.value),
    set: (v) => setChartMode(v === 'area' ? 'area' : v === 'cumulative' ? 'cumulative' : 'bar'),
});

/** Chart mode options (the cumulative option is only offered in the daily / monthly views) */
const modeOptions = computed(() => {
    const options = [
        { label: t('chart.mode.bar'), value: 'bar' },
        { label: t('chart.mode.area'), value: 'area' },
    ];
    if (props.allowCumulative) options.push({ label: t('chart.mode.cumulative'), value: 'cumulative' });
    return options;
});
</script>

<style scoped>
/* The title heading itself never wraps (CJK can break at any character); alignment and button ordering are provided by the --with-actions modifier class */
.s2-chart-title-text {
    flex-shrink: 0;
    white-space: nowrap;
}

/* sheet-section already provides the padding, so drop chart-area's own vertical margin */
.s2-chart-panel-area {
    margin: 0;
}
</style>
