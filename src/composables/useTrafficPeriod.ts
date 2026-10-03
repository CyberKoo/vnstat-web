import type { PeriodType } from '@/config/trafficPeriods';
import { usePeriodChart } from '@/composables/usePeriodChart';
import { usePeriodData } from '@/composables/usePeriodData';
import { usePeriodExtras } from '@/composables/usePeriodExtras';
import { usePeriodMetrics } from '@/composables/usePeriodMetrics';
import { usePeriodTable } from '@/composables/usePeriodTable';

/**
 * Chart, stat card and table data for the traffic period pages (Hourly / Daily / Monthly / Yearly).
 *
 * Driven by the period config (PERIOD_CONFIGS); used by TrafficByPeriod.vue.
 *
 * This is a composition root, not a source of logic: it resolves the shared data window once and
 * hands the same context to each slice, so the chart, the metric band, the table and the extras all
 * read one set of rows. Each slice is independently readable and testable:
 *
 * - {@link usePeriodData} picks and windows the rows
 * - {@link usePeriodChart} builds the main chart (including the year-over-year variant)
 * - {@link usePeriodMetrics} builds the stat cards, donut and side panel
 * - {@link usePeriodTable} builds the table
 * - {@link usePeriodExtras} builds the insights, quota, record progress and peak strip
 *
 * @param period Period type, see PeriodType
 * @returns All reactive data and config required by the view
 */
export function useTrafficPeriod(period: PeriodType) {
    const data = usePeriodData(period);
    const chart = usePeriodChart(data);
    const metrics = usePeriodMetrics(data);
    const table = usePeriodTable(data);
    const extras = usePeriodExtras(data);

    return {
        config: data.config,
        chartHeight: chart.chartHeight,
        statsHeader: metrics.statsHeader,
        chartData: chart.chartData,
        chartOptions: chart.chartOptions,
        donutData: metrics.donutData,
        sideStats: metrics.sideStats,
        detailRows: metrics.detailRows,
        peakPeriods: extras.peakPeriods,
        tableDateLabels: table.tableDateLabels,
        tableColumns: table.tableColumns,
        tableData: table.tableData,
        insights: extras.insights,
        supportsCumulative: chart.supportsCumulative,
        quotaBlock: extras.quotaBlock,
        recordProgress: extras.recordProgress,
        yearCards: chart.yearCards,
    };
}
