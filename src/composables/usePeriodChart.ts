import { computed, type ComputedRef } from 'vue';

import type { PeriodDataContext } from '@/composables/usePeriodData';
import { useChartMode, type ChartMode } from '@/composables/useChartMode';
import { useChartTheme } from '@/composables/useChartTheme';
import { useMobile } from '@/composables/useMobile';
import { buildPeriodChartData } from '@/composables/periodChartData';
import { buildPeriodChartOptions } from '@/composables/periodChartOptions';
import {
    buildYearCards,
    buildYearOverYearChartData,
    buildYearOverYearChartOptions,
    buildYearOverYearModel,
    type YearCard,
} from '@/composables/yearOverYear';

/** The main chart of a period page */
export interface PeriodChart {
    /** Chart height in pixels (lower on mobile) */
    chartHeight: ComputedRef<number>;
    /** Chart dataset; the concrete dataset type depends on the period (bar or year-over-year) */
    chartData: ComputedRef<ReturnType<typeof buildPeriodChartData> | ReturnType<typeof buildYearOverYearChartData>>;
    /** Chart options; the concrete option type depends on the period */
    chartOptions: ComputedRef<
        ReturnType<typeof buildPeriodChartOptions> | ReturnType<typeof buildYearOverYearChartOptions>
    >;
    /** Whether the cumulative mode is offered in this period */
    supportsCumulative: ComputedRef<boolean>;
    /** Year comparison cards (year view only) */
    yearCards: ComputedRef<YearCard[]>;
}

/**
 * The main chart of a period page, including the year-over-year variant.
 *
 * Month and year pages do not plot the raw series: they plot a year-over-year model, so the data and
 * the options branch on the same model. Keeping that branch in one place is what stops the two from
 * disagreeing about which chart is on screen.
 *
 * @param data Shared data context from {@link usePeriodData}
 * @returns Chart height, data, options, cumulative support and the year cards
 */
export function usePeriodChart(data: PeriodDataContext): PeriodChart {
    const { period, config, allItems, allDayItems, allMonthItems, chartItems, chartDisplayLimit } = data;
    const chartTheme = useChartTheme();
    const { isMobile } = useMobile();

    /** Chart mode (bar / area / cumulative), shared at module level and persisted in localStorage */
    const { chartMode } = useChartMode();

    /**
     * Cumulative mode is not offered in the hourly view only (day = running total along the time axis;
     * month / year = intra-year cumulative race line)
     */
    const supportsCumulative = computed(() => period !== 'hour');

    /** Main chart of the month / year views: year-over-year, month-by-month comparison */
    const isYearCompare = period === 'month' || period === 'year';

    /**
     * Effective chart mode: falls back to 'bar' when localStorage holds 'cumulative' but the current
     * period does not support it
     */
    const effectiveChartMode = computed<ChartMode>(() =>
        chartMode.value === 'cumulative' && !supportsCumulative.value ? 'bar' : chartMode.value,
    );

    const chartHeight = computed(() => (isMobile.value ? 240 : 360));

    /** Year-over-year month-by-month model (month / year views only) */
    const yoyModel = computed(() => (isYearCompare ? buildYearOverYearModel(allMonthItems.value) : null));

    const chartData = computed(() => {
        const model = yoyModel.value;
        if (model) return buildYearOverYearChartData(model, effectiveChartMode.value);
        return buildPeriodChartData({
            items: chartItems.value,
            allFieldItems: allItems.value,
            allDayItems: allDayItems.value,
            config,
            mode: effectiveChartMode.value,
            chartDisplayLimit: chartDisplayLimit.value,
        });
    });

    const chartOptions = computed(() => {
        const model = yoyModel.value;
        if (model) {
            return buildYearOverYearChartOptions({
                model,
                mode: effectiveChartMode.value,
                chartData: chartData.value,
                theme: chartTheme.value,
            });
        }
        return buildPeriodChartOptions({
            config,
            mode: effectiveChartMode.value,
            items: chartItems.value,
            allDayItems: allDayItems.value,
            chartData: chartData.value,
            theme: chartTheme.value,
        });
    });

    const yearCards = computed(() => (period === 'year' && yoyModel.value ? buildYearCards(yoyModel.value) : []));

    return {
        chartHeight,
        chartData,
        chartOptions,
        supportsCumulative,
        yearCards,
    };
}
