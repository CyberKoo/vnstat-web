import type { ChartData, ChartOptions, TooltipItem } from 'chart.js';

import dayjs from '@/plugins/dayjs';
import { LOCALE_DAYJS } from '@/config/locales';
import { i18n } from '@/plugins/i18n';
import { palette } from '@/config/colors';
import type { ChartMode } from '@/composables/useChartMode';
import type { ChartTheme } from '@/types/chart';
import type { TrafficItem } from '@/types/network';
import { createAdaptiveBarChartOptions } from '@/utils/chartOptions';
import { formatBytes } from '@/utils/bytes';
import { formatDecimal } from '@/utils/numbers';

// ── Model ──

export interface YearOverYearModel {
    /** The years present in the data, ascending */
    years: number[];
    /** byYear[yearIndex][monthIndex 0-11]; months without records are null */
    byYear: Array<Array<{ rx: number; tx: number } | null>>;
    /** The month in progress [yearIndex, monthIndex], null when there is none */
    inProgress: [number, number] | null;
}

/**
 * Year-over-year month-by-month comparison model: groups the monthly records by year and aligns
 * them to months 1-12.
 * The main chart and the year cards of the month / year views share this structure.
 */
export function buildYearOverYearModel(monthItems: TrafficItem[]): YearOverYearModel {
    const byYearMap = new Map<number, Array<{ rx: number; tx: number } | null>>();
    for (const item of monthItems) {
        const { year, month } = item.date;
        if (!year || !month) continue;
        let row = byYearMap.get(year);
        if (!row) {
            row = Array.from({ length: 12 }, () => null);
            byYearMap.set(year, row);
        }
        row[month - 1] = { rx: item.rx ?? 0, tx: item.tx ?? 0 };
    }
    const years = [...byYearMap.keys()].sort((a, b) => a - b);
    const byYear = years.map((y) => byYearMap.get(y)!);
    const now = new Date();
    const yi = years.indexOf(now.getFullYear());
    const inProgress: [number, number] | null = yi >= 0 && byYear[yi]![now.getMonth()] ? [yi, now.getMonth()] : null;
    return { years, byYear, inProgress };
}

// ── Chart data ──

/**
 * dayjs bound to the current UI locale. Reading `i18n.global.locale.value` makes the computed that
 * calls this re-run on a language switch (the dayjs locale itself is not reactive; the locale store
 * keeps the dayjs global locale in sync with the i18n one).
 */
function localizedDayjs() {
    return dayjs().locale(LOCALE_DAYJS[i18n.global.locale.value]);
}

/** Year color: the latest year uses the primary blue, each earlier year fades */
export function yearColor(orderFromLatest: number): string {
    const strengths = [100, 38, 20, 12];
    const s = strengths[Math.min(orderFromLatest, strengths.length - 1)];
    return `color-mix(in srgb, ${palette.rx} ${s}%, transparent)`;
}

/** Cumulative within a year: null before the first month; a month without records keeps the previous cumulative value (it is not dropped) */
export function cumulativeYear(totals: (number | null)[]): (number | null)[] {
    let sum = 0;
    let started = false;
    return totals.map((v) => {
        if (v == null) return started ? sum : null;
        started = true;
        sum += v;
        return sum;
    });
}

/**
 * Year-over-year month-by-month chart data: the x axis covers months 1-12, with one dataset per year.
 * bar = grouped bars; area = one line per year (the latest one filled); cumulative = an intra-year
 * running-total race line.
 */
export function buildYearOverYearChartData(model: YearOverYearModel, mode: ChartMode): ChartData<'bar'> {
    // Month names come from dayjs so they follow the UI language; day 1 first so setting the month
    // never rolls over (e.g. Mar 31 → "Feb 31" would land in March)
    const monthBase = localizedDayjs().date(1);
    const labels = Array.from({ length: 12 }, (_v, i) => monthBase.month(i).format('MMM'));
    const latestIdx = model.years.length - 1;
    const datasets = model.years.map((year, yi) => {
        const color = yearColor(latestIdx - yi);
        const totals = model.byYear[yi]!.map((v) => (v ? v.rx + v.tx : null));
        if (mode === 'bar') {
            // Switching modes does not rebuild the instance (smooth morphing); vue-chartjs shallow merges
            // datasets by label (Object.assign), so neutral values for the line properties must be given
            // explicitly, otherwise type/fill/spanGaps and the like linger when area → bar
            return {
                type: 'bar' as const,
                label: String(year),
                data: totals,
                backgroundColor: color,
                fill: false,
                spanGaps: false,
                tension: 0,
                pointRadius: 0,
                borderWidth: 0,
                borderRadius: 3,
                barPercentage: 0.9,
                categoryPercentage: 0.75,
            };
        }
        return {
            type: 'line' as const,
            label: String(year),
            data: mode === 'cumulative' ? cumulativeYear(totals) : totals,
            borderColor: color,
            backgroundColor: yi === latestIdx ? `color-mix(in srgb, ${palette.rx} 14%, transparent)` : 'transparent',
            fill: yi === latestIdx,
            // Months without records are null: span the gaps, otherwise non-adjacent months stay isolated
            // and the whole line becomes invisible
            spanGaps: true,
            tension: 0.3,
            pointRadius: 0,
            borderWidth: yi === latestIdx ? 2.5 : 1.5,
        };
    });
    return { labels, datasets } as unknown as ChartData<'bar'>;
}

// ── Chart config ──

export interface YearOverYearChartOptionsInput {
    model: YearOverYearModel;
    mode: ChartMode;
    chartData: ChartData<'bar'>;
    theme: ChartTheme;
}

/**
 * Chart.js configuration for the year-over-year month-by-month chart.
 * A single y axis; the tooltip carries the receive/send breakdown, the year-over-year change and an
 * in-progress note.
 */
export function buildYearOverYearChartOptions(input: YearOverYearChartOptionsInput): ChartOptions<'bar'> {
    const { model, mode, chartData, theme } = input;
    const base = createAdaptiveBarChartOptions({
        theme,
        data: chartData,
        xAxis: { maxTicksLimit: 12 },
    });

    const options: ChartOptions<'bar'> = {
        ...base,
        // index mode: the tooltip is triggered by the whole column (all years of the same month), which
        // makes the year-over-year comparison easy
        interaction: { mode: 'index', intersect: false },
        // Year comparison uses grouped bars, so the stacking in the base config must be turned off
        // (otherwise the years stack on top of each other and cannot be compared side by side)
        scales: {
            ...base.scales,
            x: { ...base.scales?.x, stacked: false },
            y: { ...base.scales?.y, stacked: false },
        },
        plugins: {
            ...base.plugins,
            tooltip: {
                ...((base.plugins?.tooltip as object) || {}),
                callbacks: {
                    label(context: TooltipItem<'bar'>) {
                        const entry = model.byYear[context.datasetIndex]?.[context.dataIndex];
                        const label = context.dataset.label ?? '';
                        if (!entry) return i18n.global.t('chart.tooltipNoData', { label });
                        const total = entry.rx + entry.tx;
                        if (mode === 'cumulative') {
                            return i18n.global.t('chart.yoy.cumulativeTip', {
                                label,
                                total: formatBytes(context.parsed.y ?? 0).formatted,
                                current: formatBytes(total).formatted,
                            });
                        }
                        return i18n.global.t('chart.yoy.breakdownTip', {
                            label,
                            total: formatBytes(total).formatted,
                            rx: formatBytes(entry.rx).formatted,
                            tx: formatBytes(entry.tx).formatted,
                        });
                    },
                    footer(tooltipItems: TooltipItem<'bar'>[]) {
                        const lines: string[] = [];
                        const monthIdx = tooltipItems[0]?.dataIndex;
                        if (monthIdx === undefined) return lines;
                        const withVal = tooltipItems.filter(
                            (i) => i.parsed.y != null && model.byYear[i.datasetIndex]?.[monthIdx] != null,
                        );
                        if (withVal.length >= 2) {
                            const cur = withVal[withVal.length - 1]!;
                            const prev = withVal[withVal.length - 2]!;
                            if ((prev.parsed.y ?? 0) > 0) {
                                const pct = (((cur.parsed.y ?? 0) - (prev.parsed.y ?? 0)) / (prev.parsed.y ?? 1)) * 100;
                                lines.push(
                                    i18n.global.t('chart.yoy.changeTip', {
                                        year: model.years[prev.datasetIndex],
                                        percent: `${pct >= 0 ? '+' : ''}${formatDecimal(pct, 1)}%`,
                                    }),
                                );
                            }
                        }
                        if (
                            model.inProgress &&
                            model.inProgress[1] === monthIdx &&
                            withVal.some((i) => i.datasetIndex === model.inProgress![0])
                        ) {
                            lines.push(i18n.global.t('chart.yoy.inProgress'));
                        }
                        return lines;
                    },
                },
            },
        },
    };

    return options;
}

// ── Year cards ──

export interface YearCard {
    year: number;
    /** The current year (data is still accumulating) */
    inProgress: boolean;
    /** Year total (bytes) */
    total: number;
    /** Receive share 0-1 */
    rxShare: number;
    /** Monthly average (based on the number of months with data) */
    monthlyAvg: number;
    monthsWithData: number;
    peakMonth: { label: string; value: number } | null;
    /**
     * Windowed year-over-year: the current year is aligned to the same window of the previous year
     * using "the last month with data"; a complete year is compared with a complete year.
     * null when the previous year has no data.
     */
    yoyPercent: number | null;
    /** Totals of the 12 months (null where records are missing), used to draw the mini bars */
    monthly: (number | null)[];
}

/** Derive the year comparison cards from the year-over-year month-by-month model */
export function buildYearCards(model: YearOverYearModel): YearCard[] {
    const n = model.years.length;
    return model.years.map((year, yi) => {
        const months = model.byYear[yi]!;
        const monthly = months.map((v) => (v ? v.rx + v.tx : null));
        const present = monthly.filter((v): v is number => v != null);
        const total = present.reduce((s, v) => s + v, 0);
        const rxTotal = months.reduce((s, v) => s + (v?.rx ?? 0), 0);

        let peakMonth: YearCard['peakMonth'] = null;
        const monthBase = localizedDayjs().date(1);
        monthly.forEach((v, mi) => {
            if (v != null && (peakMonth == null || v > peakMonth.value)) {
                peakMonth = { label: monthBase.month(mi).format('MMM'), value: v };
            }
        });

        let yoyPercent: number | null = null;
        const prev = yi > 0 ? model.byYear[yi - 1]! : null;
        if (prev) {
            const lastIdx = yi === n - 1 ? monthly.reduce<number>((acc, v, i) => (v != null ? i : acc), -1) : 11;
            let cur = 0;
            let prevSum = 0;
            let prevAny = false;
            for (let i = 0; i <= lastIdx; i++) {
                cur += monthly[i] ?? 0;
                const pv = prev[i];
                if (pv != null) {
                    prevAny = true;
                    prevSum += pv.rx + pv.tx;
                }
            }
            if (prevAny && prevSum > 0) yoyPercent = ((cur - prevSum) / prevSum) * 100;
        }

        return {
            year,
            inProgress: model.inProgress?.[0] === yi,
            total,
            rxShare: total > 0 ? rxTotal / total : 0,
            monthlyAvg: present.length > 0 ? total / present.length : 0,
            monthsWithData: present.length,
            peakMonth,
            yoyPercent,
            monthly,
        };
    });
}
