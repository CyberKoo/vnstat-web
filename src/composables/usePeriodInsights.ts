import dayjs from '@/plugins/dayjs';
import { i18n } from '@/plugins/i18n';

import { buildHourlyProfile } from '@/composables/useHourlyProfile';
import { projectMonthEnd } from '@/composables/useMonthlyQuota';
import { computeTotalBytes, findPeak } from '@/composables/useTrafficStats';
import { formatBytes } from '@/utils/bytes';
import { formatDecimal, formatNumber } from '@/utils/numbers';
import type { TrafficItem } from '@/types/network';
import type { PeriodType } from '@/config/trafficPeriods';

/** Rate formatter signature (same as useSpeedFormat, so it can be injected) */
export type SpeedFormatter = (bytesPerSec: number, decimals?: 0 | 1 | 2) => string;

/**
 * Input for insight generation.
 */
export interface PeriodInsightInput {
    /** Period type */
    period: PeriodType;
    /** Data of the window currently displayed (ascending by time) */
    items: TrafficItem[];
    /** Full data (ascending by time, unfiltered), used to take the equally long previous window */
    allItems: TrafficItem[];
    /** Rate formatting (follows the global unit preference); when omitted, the insights do not output
     * rate text */
    formatSpeed?: SpeedFormatter;
}

/** Upper limit on the number of insight texts (1~2 per page) */
const MAX_INSIGHTS = 2;

/** Comparison window of the latest N days (same scope as the period-over-period one) */
const DAY_COMPARE_WINDOW = 7;

/** Threshold for the hourly peak band: the ratio of a given hour's average to the average of the peak hour */
const PEAK_BAND_RATIO = 0.7;

/** Hours per day (size of the most-recent-24h window) */
const HOURS_PER_DAY = 24;

/** Minimum number of hourly samples required to judge the most recent 24h */
const RECENT_MIN_SAMPLES = 12;

/**
 * Take the equally long window immediately preceding the current one within the full data.
 *
 * @param allItems Full data (ascending by time)
 * @param current Current window data (ascending, must be a contiguous segment of allItems)
 * @returns The equally long previous window; null when there is not enough data
 */
function previousWindow(allItems: TrafficItem[], current: TrafficItem[]): TrafficItem[] | null {
    if (!current.length) return null;
    const firstTs = current[0].timestamp;
    const startIdx = allItems.findIndex((i) => i.timestamp === firstTs);
    if (startIdx <= 0) return null;
    const prev = allItems.slice(Math.max(0, startIdx - current.length), startIdx);
    return prev.length === current.length ? prev : null;
}

/**
 * Day page insights: daily average over the latest 7 days compared + the highest day.
 */
function buildDayInsights(items: TrafficItem[], allItems: TrafficItem[]): string[] {
    const out: string[] = [];
    const recent = items.slice(-DAY_COMPARE_WINDOW);
    if (recent.length) {
        const avg = computeTotalBytes(recent) / recent.length;
        const prev = recent.length >= DAY_COMPARE_WINDOW ? previousWindow(allItems, recent) : null;
        const prevAvg = prev ? computeTotalBytes(prev) / prev.length : null;
        if (prevAvg !== null && prevAvg > 0) {
            const pct = ((avg - prevAvg) / prevAvg) * 100;
            const change = `${pct >= 0 ? '+' : ''}${formatDecimal(pct, 1)}`;
            out.push(
                i18n.global.t(
                    'period.insights.day.avgWithCompare',
                    { days: formatNumber(recent.length), avg: formatBytes(avg, 1).formatted, change },
                    recent.length,
                ),
            );
        } else {
            out.push(
                i18n.global.t(
                    'period.insights.day.avgOnly',
                    { days: formatNumber(recent.length), avg: formatBytes(avg, 1).formatted },
                    recent.length,
                ),
            );
        }
    }
    const peak = findPeak(items);
    if (peak.item) {
        out.push(
            i18n.global.t('period.insights.day.peak', {
                date: dayjs.unix(peak.item.timestamp).format(i18n.global.t('common.format.date')),
                size: formatBytes(peak.value, 1).formatted,
            }),
        );
    }
    return out.slice(0, MAX_INSIGHTS);
}

/**
 * Hourly page insights: peak hour distribution + the activity of the most recent 24h (compared with
 * the full historical average).
 */
function buildHourInsights(items: TrafficItem[], allItems: TrafficItem[], formatSpeed?: SpeedFormatter): string[] {
    const out: string[] = [];
    const profile = buildHourlyProfile(items);
    // The historical baseline uses the full data, so the recent window is compared against the
    // historical average rather than against itself
    const histAvg = buildHourlyProfile(allItems).reduce((s, c) => s + c.avgTotal, 0);
    const totalAvg = profile.reduce((s, c) => s + c.avgTotal, 0);
    const maxAvg = profile.reduce((m, c) => Math.max(m, c.avgTotal), 0);

    if (totalAvg > 0 && maxAvg > 0) {
        // Peak band: a contiguous run of hours whose average is >= 70% of the peak; the run with the
        // largest total traffic is taken
        const threshold = maxAvg * PEAK_BAND_RATIO;
        const bands: number[][] = [];
        let band: number[] = [];
        for (const cell of profile) {
            if (cell.avgTotal > 0 && cell.avgTotal >= threshold) {
                band.push(cell.hour);
            } else if (band.length) {
                bands.push(band);
                band = [];
            }
        }
        if (band.length) bands.push(band);
        bands.sort((a, b) => {
            const sumA = a.reduce((s, h) => s + profile[h].avgTotal, 0);
            const sumB = b.reduce((s, h) => s + profile[h].avgTotal, 0);
            return sumB - sumA;
        });
        const top = bands[0];
        if (top) {
            const bandTotal = top.reduce((s, h) => s + profile[h].avgTotal, 0);
            const share = (bandTotal / totalAvg) * 100;
            if (top.length === 1) {
                out.push(
                    i18n.global.t('period.insights.hour.peakSingle', {
                        start: `${top[0]}:00`,
                        share: formatDecimal(share, 0),
                    }),
                );
            } else {
                out.push(
                    i18n.global.t('period.insights.hour.peakBand', {
                        start: `${top[0]}:00`,
                        end: `${top[top.length - 1]}:00`,
                        share: formatDecimal(share, 0),
                    }),
                );
            }
        }
    }

    // The most recent 24h window comes straight from the records: the profile's per-hour values
    // are anchored to today (00:00 local), which is a different window
    const recent = items.slice(-HOURS_PER_DAY);
    const recentTotal = computeTotalBytes(recent);
    if (recent.length >= RECENT_MIN_SAMPLES && histAvg > 0 && recentTotal > 0) {
        const ratio = recentTotal / histAvg;
        const avgSpeed = formatSpeed?.(recentTotal / (recent.length * 3600), 2);
        if (avgSpeed) {
            out.push(
                i18n.global.t('period.insights.hour.recentWithSpeed', {
                    total: formatBytes(recentTotal, 1).formatted,
                    speed: avgSpeed,
                    ratio: formatDecimal(ratio, 1),
                }),
            );
        } else {
            out.push(
                i18n.global.t('period.insights.hour.recent', {
                    total: formatBytes(recentTotal, 1).formatted,
                    ratio: formatDecimal(ratio, 1),
                }),
            );
        }
    }
    return out.slice(0, MAX_INSIGHTS);
}

/**
 * Month page insights: pace projection for the current month + the peak month.
 */
function buildMonthInsights(items: TrafficItem[]): string[] {
    const out: string[] = [];
    const cur = items[items.length - 1];
    if (!cur) return out;

    const monthStart = dayjs.unix(cur.timestamp);
    const total = (cur.rx ?? 0) + (cur.tx ?? 0);
    // Current month: scale the daily average by the elapsed days and project the month-end total from
    // the number of days in the month (same scope as the quota page)
    const projection = projectMonthEnd(cur.timestamp, total);
    if (projection) {
        out.push(
            i18n.global.t('period.insights.month.projection', {
                avg: formatBytes(projection.dailyAvgBytes, 1).formatted,
                projected: formatBytes(projection.projectedBytes, 1).formatted,
            }),
        );
    } else {
        out.push(
            i18n.global.t('period.insights.month.pastTotal', {
                month: monthStart.format(i18n.global.t('period.format.month')),
                total: formatBytes(total, 1).formatted,
            }),
        );
    }

    if (items.length > 1) {
        const peak = findPeak(items);
        if (peak.item) {
            out.push(
                i18n.global.t('period.insights.month.peak', {
                    month: dayjs.unix(peak.item.timestamp).format(i18n.global.t('period.format.month')),
                    size: formatBytes(peak.value, 1).formatted,
                }),
            );
        }
    }
    return out.slice(0, MAX_INSIGHTS);
}

/**
 * Year page insights: a neutral note when the data is sparse, otherwise a comparison with the previous year.
 */
function buildYearInsights(items: TrafficItem[]): string[] {
    if (items.length < 2 || computeTotalBytes(items) === 0) {
        return [i18n.global.t('period.insights.year.insufficient')];
    }
    const cur = items[items.length - 1];
    const prev = items[items.length - 2];
    const curTotal = (cur.rx ?? 0) + (cur.tx ?? 0);
    const prevTotal = (prev.rx ?? 0) + (prev.tx ?? 0);
    const curYear = dayjs.unix(cur.timestamp).format('YYYY');
    if (prevTotal > 0) {
        const pct = ((curTotal - prevTotal) / prevTotal) * 100;
        const change = `${pct >= 0 ? '+' : ''}${formatDecimal(pct, 1)}`;
        return [
            i18n.global.t('period.insights.year.compare', {
                year: curYear,
                total: formatBytes(curTotal, 1).formatted,
                change,
            }),
        ];
    }
    return [
        i18n.global.t('period.insights.year.recorded', {
            year: curYear,
            total: formatBytes(curTotal, 1).formatted,
        }),
    ];
}

/**
 * Generate the automatic insights of the period pages (1~2 conclusions in plain language).
 *
 * Pure function: every text is computed from the input data, traffic with formatBytes and rates with
 * the injected formatSpeed.
 *
 * @param input Insight input
 * @returns An array of insight texts (0~2 entries)
 */
export function buildPeriodInsights(input: PeriodInsightInput): string[] {
    const { period, items, allItems, formatSpeed } = input;
    switch (period) {
        case 'day':
            return buildDayInsights(items, allItems);
        case 'hour':
            return buildHourInsights(items, allItems, formatSpeed);
        case 'month':
            return buildMonthInsights(items);
        case 'year':
            return buildYearInsights(items);
        default:
            return [];
    }
}
