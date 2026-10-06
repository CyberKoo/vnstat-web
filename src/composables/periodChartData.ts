import type { ChartData } from 'chart.js';

import dayjs from '@/plugins/dayjs';
import { formatNumber } from '@/utils/numbers';
import { palette } from '@/config/colors';
import { i18n } from '@/plugins/i18n';
import type { PeriodConfig } from '@/config/trafficPeriods';
import type { ChartMode } from '@/composables/useChartMode';
import { buildCumulativeSeries, buildGhostSeries } from '@/composables/usePeriodCompare';
import { buildBarBase } from '@/composables/useTrafficStats';
import type { TrafficItem } from '@/types/network';

/**
 * Message key of the ghost comparison line dataset (hidden in the legend).
 * The datasets carry the translated text: builders run inside computeds and call
 * `i18n.global.t(key)` at build time, so the labels follow the UI language.
 */
export const GHOST_LABEL = 'chart.ghostLine';

/**
 * Neutral values for the line properties of a bar dataset.
 * Switching chart modes does not rebuild the instance (smooth morphing) and vue-chartjs shallow
 * merges datasets by label (Object.assign), so the type/fill/tension/pointRadius/borderWidth of the
 * previous mode linger when area → bar and must be overridden explicitly.
 */
const BAR_NEUTRALS = { type: 'bar', fill: false, tension: 0, pointRadius: 0, borderWidth: 0 } as const;

/** Dataset label message key of the historical same-hour average line on the hourly view */
export const AVG_LINE_LABEL = 'chart.avgLine';

/** Window in days for the moving average and the same period of last week on the day view */
export const WEEK_WINDOW = 7;

/** Dataset label message keys of the day-view overlay lines ({days} is interpolated) */
export const MOVING_AVERAGE_LABEL = 'chart.movingAverage';
export const LAST_WEEK_LABEL = 'chart.lastWeek';

/**
 * Dataset label message keys of rx / tx in cumulative mode.
 *
 * They are constants because the tooltip callback in periodChartOptions looks up whether the current
 * entry is rx or tx by comparing the translated label against `t(RX_CUMULATIVE_LABEL)` (writing the
 * string literal in both places would silently pick the wrong series after a rename).
 */
export const RX_CUMULATIVE_LABEL = 'chart.rxCumulative';
export const TX_CUMULATIVE_LABEL = 'chart.txCumulative';

export interface PeriodChartDataInput {
    /** Items inside the chart window (already truncated to chartDisplayLimit, ascending by time) */
    items: TrafficItem[];
    /** Full data of the current period (not truncated). The hourly average line looks back into this
     * data by chart index */
    allFieldItems: TrafficItem[];
    /** Full day data, used by the week-over-week line and the ghost line */
    allDayItems: TrafficItem[];
    config: PeriodConfig;
    mode: ChartMode;
    /** Upper limit on the number of bars displayed, 0 means no limit. The look-back step of the
     * average line uses this value */
    chartDisplayLimit: number;
}

/**
 * Assemble the Chart.js data of the bar / area / cumulative charts on the period pages.
 *
 * Cumulative mode only returns the running-total of rx/tx, without the average line overlaid.
 * The look-back index of the hourly average line keeps the existing scope: `idx + d *
 * chartDisplayLimit`, aligned to the full array rather than to the tail of the window.
 */
export function buildPeriodChartData(input: PeriodChartDataInput): ChartData<'bar'> {
    const { items, allFieldItems, allDayItems, config, mode, chartDisplayLimit } = input;
    const labels = items.map((item) => dayjs.unix(item.timestamp).format(i18n.global.t(config.chartDateFormatKey)));
    const rx = items.map((item) => item.rx ?? 0);
    const tx = items.map((item) => item.tx ?? 0);
    const barBase = buildBarBase(items.length);

    if (mode === 'cumulative') {
        return {
            labels,
            datasets: [
                {
                    type: 'line',
                    label: i18n.global.t(RX_CUMULATIVE_LABEL),
                    data: buildCumulativeSeries(rx),
                    borderColor: palette.rx,
                    backgroundColor: palette.rxBg,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0,
                    borderWidth: 2,
                    stack: 'cumulative',
                },
                {
                    type: 'line',
                    label: i18n.global.t(TX_CUMULATIVE_LABEL),
                    data: buildCumulativeSeries(tx),
                    borderColor: palette.tx,
                    backgroundColor: palette.txBg,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0,
                    borderWidth: 2,
                    stack: 'cumulative',
                },
            ],
        } as unknown as ChartData<'bar'>;
    }

    const baseDatasets: Record<string, unknown>[] =
        mode === 'area'
            ? [
                  {
                      type: 'line',
                      label: i18n.global.t('common.rx'),
                      data: rx,
                      borderColor: palette.rx,
                      backgroundColor: palette.rxBg,
                      fill: true,
                      tension: 0.3,
                      pointRadius: 0,
                      borderWidth: 2,
                  },
                  {
                      type: 'line',
                      label: i18n.global.t('common.tx'),
                      data: tx,
                      borderColor: palette.tx,
                      backgroundColor: palette.txBg,
                      fill: true,
                      tension: 0.3,
                      pointRadius: 0,
                      borderWidth: 2,
                  },
              ]
            : [
                  {
                      ...BAR_NEUTRALS,
                      label: i18n.global.t('common.rx'),
                      data: rx,
                      backgroundColor: palette.rx,
                      borderRadius: 3,
                      ...barBase,
                  },
                  {
                      ...BAR_NEUTRALS,
                      label: i18n.global.t('common.tx'),
                      data: tx,
                      backgroundColor: palette.tx,
                      borderRadius: 3,
                      ...barBase,
                  },
              ];
    const datasets: Record<string, unknown>[] = [...baseDatasets];

    if (config.hasAvgLine) {
        const limit = chartDisplayLimit;
        const pastCount =
            limit > 0 && allFieldItems.length >= limit * 3 ? 3 : allFieldItems.length >= limit * 2 ? 2 : 1;
        if (pastCount > 1) {
            const avgLine: (number | null)[] = items.map((_item, idx) => {
                let sum = 0;
                let cnt = 0;
                for (let d = 1; d < pastCount; d++) {
                    const pastIdx = idx + d * limit;
                    if (pastIdx < allFieldItems.length) {
                        sum += (allFieldItems[pastIdx].rx ?? 0) + (allFieldItems[pastIdx].tx ?? 0);
                        cnt++;
                    }
                }
                return cnt > 0 ? sum / cnt : null;
            });
            datasets.push({
                type: 'line',
                label: i18n.global.t(AVG_LINE_LABEL),
                data: avgLine,
                borderColor: palette.accent,
                borderDash: [4, 3],
                pointRadius: 0,
                tension: 0.3,
                fill: false,
                order: -1,
            });
        }
    }

    if (config.hasWeekOverWeek) {
        const totals = items.map((item) => (item.rx ?? 0) + (item.tx ?? 0));
        const ma7: (number | null)[] = [];
        for (let i = 0; i < items.length; i++) {
            const windowStart = Math.max(0, i - (WEEK_WINDOW - 1));
            let sum = 0;
            for (let j = windowStart; j <= i; j++) sum += totals[j];
            ma7.push(sum / (i - windowStart + 1));
        }
        const lastWeek: (number | null)[] = [];
        const chartSrcOffset = allDayItems.length - items.length;
        for (let i = 0; i < items.length; i++) {
            const srcIdx = chartSrcOffset + i - WEEK_WINDOW;
            if (srcIdx >= 0) {
                lastWeek.push((allDayItems[srcIdx].rx ?? 0) + (allDayItems[srcIdx].tx ?? 0));
            } else {
                lastWeek.push(null);
            }
        }

        datasets.push({
            type: 'line',
            label: i18n.global.t(MOVING_AVERAGE_LABEL, { days: formatNumber(WEEK_WINDOW) }, WEEK_WINDOW),
            data: ma7,
            fill: false,
            borderColor: palette.accent,
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3,
            order: -1,
        });
        if (lastWeek.some((value) => value !== null)) {
            datasets.push({
                type: 'line',
                label: i18n.global.t(LAST_WEEK_LABEL),
                data: lastWeek,
                fill: false,
                borderColor: palette.accent,
                borderWidth: 1.5,
                borderDash: [5, 3],
                pointRadius: 0,
                tension: 0.3,
                order: -1,
            });
        }

        const ghost = buildGhostSeries(allDayItems, items);
        if (ghost.some((value) => value !== null)) {
            datasets.push({
                type: 'line',
                label: i18n.global.t(GHOST_LABEL),
                data: ghost,
                fill: false,
                borderColor: `color-mix(in srgb, ${palette.accent} 55%, transparent)`,
                borderWidth: 1.5,
                borderDash: [5, 4],
                pointRadius: 0,
                tension: 0.3,
                order: -1,
            });
        }
    }

    if (!config.hasAvgLine && !config.hasWeekOverWeek) {
        return { labels, datasets: baseDatasets } as unknown as ChartData<'bar'>;
    }

    return { labels, datasets } as unknown as ChartData<'bar'>;
}
