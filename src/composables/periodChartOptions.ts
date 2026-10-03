import type { ChartData, ChartOptions, TooltipItem } from 'chart.js';

import dayjs from '@/plugins/dayjs';
import { i18n } from '@/plugins/i18n';
import type { PeriodConfig } from '@/config/trafficPeriods';
import type { ChartMode } from '@/composables/useChartMode';
import type { ChartTheme } from '@/types/chart';
import {
    GHOST_LABEL,
    LAST_WEEK_LABEL,
    MOVING_AVERAGE_LABEL,
    RX_CUMULATIVE_LABEL,
    WEEK_WINDOW,
} from '@/composables/periodChartData';
import type { TrafficItem } from '@/types/network';
import { createAdaptiveBarChartOptions } from '@/utils/chartOptions';
import { formatBytes } from '@/utils/bytes';

export interface PeriodChartOptionsInput {
    config: PeriodConfig;
    mode: ChartMode;
    /** Items inside the chart window, index-aligned with chartData */
    items: TrafficItem[];
    /** Full day data, used by the week-over-week line and the ghost line */
    allDayItems: TrafficItem[];
    chartData: ChartData<'bar'>;
    theme: ChartTheme;
}

/**
 * Chart.js configuration for the charts on the period pages (hour / day views; the month / year
 * views use the year-over-year month-by-month comparison).
 *
 * The overlay lines (average / week-over-week) share the unit of the bars and the left y axis, with
 * no right axis.
 * Cumulative mode returns early: there are no overlay lines, so neither legend filtering nor an
 * overlay line tooltip is needed.
 */
export function buildPeriodChartOptions(input: PeriodChartOptionsInput): ChartOptions<'bar'> {
    const { config, mode, items, chartData, theme } = input;

    let baseOptions = createAdaptiveBarChartOptions({
        theme,
        data: chartData,
        tooltipTitle: (tooltipItems) => {
            const idx = tooltipItems[0]?.dataIndex;
            if (idx === undefined || !items[idx]) return '';
            return dayjs.unix(items[idx].timestamp).format(i18n.global.t(config.tooltipDateFormatKey));
        },
    });

    // index mode + no intersection requirement: in bar and area mode alike the tooltip is triggered
    // by the whole column (the area line has no per-point hit area)
    baseOptions = {
        ...baseOptions,
        interaction: { mode: 'index', intersect: false },
    };

    if (mode === 'cumulative') {
        return {
            ...baseOptions,
            plugins: {
                ...baseOptions.plugins,
                tooltip: {
                    ...((baseOptions.plugins?.tooltip as object) || {}),
                    callbacks: {
                        ...((baseOptions.plugins?.tooltip as { callbacks?: Record<string, unknown> })?.callbacks || {}),
                        label(context: TooltipItem<'bar'>) {
                            const idx = context.dataIndex;
                            const item = items[idx];
                            const cum = context.parsed.y ?? 0;
                            // the datasets carry translated labels, so the series lookup compares
                            // against the same translation (see RX_CUMULATIVE_LABEL in periodChartData)
                            const current =
                                context.dataset.label === i18n.global.t(RX_CUMULATIVE_LABEL)
                                    ? (item?.rx ?? 0)
                                    : (item?.tx ?? 0);
                            return i18n.global.t('chart.cumulativeTip', {
                                label: context.dataset.label ?? '',
                                total: formatBytes(cum).formatted,
                                current: formatBytes(current).formatted,
                            });
                        },
                    },
                },
            },
        };
    }

    if (config.hasWeekOverWeek) {
        // translated labels of the overlay lines (built with the same t() calls as the datasets)
        const overlayLabels = [
            i18n.global.t(MOVING_AVERAGE_LABEL, { days: WEEK_WINDOW }),
            i18n.global.t(LAST_WEEK_LABEL),
            i18n.global.t(GHOST_LABEL),
        ];
        return {
            ...baseOptions,
            plugins: {
                ...baseOptions.plugins,
                legend: {
                    ...(baseOptions.plugins?.legend || {}),
                    labels: {
                        ...((baseOptions.plugins?.legend as { labels?: Record<string, unknown> })?.labels || {}),
                        filter: (item) => item.text !== i18n.global.t(GHOST_LABEL),
                    },
                },
                tooltip: {
                    ...((baseOptions.plugins?.tooltip as object) || {}),
                    callbacks: {
                        ...((baseOptions.plugins?.tooltip as { callbacks?: Record<string, unknown> })?.callbacks || {}),
                        label(context: TooltipItem<'bar'>) {
                            const bytes = context.parsed.y ?? undefined;
                            const label = context.dataset.label ?? '';
                            if (overlayLabels.includes(label)) {
                                return bytes === null
                                    ? i18n.global.t('chart.tooltipNoData', { label })
                                    : i18n.global.t('chart.tooltipValue', {
                                          label,
                                          value: formatBytes(bytes).formatted,
                                      });
                            }
                            return i18n.global.t('chart.tooltipValue', {
                                label,
                                value: formatBytes(bytes).formatted,
                            });
                        },
                    },
                },
            },
        };
    }

    return baseOptions;
}
