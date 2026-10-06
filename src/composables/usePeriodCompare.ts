import { computeTotalBytes } from '@/composables/useTrafficStats';
import { formatDecimal } from '@/utils/numbers';
import type { TrafficItem } from '@/types/network';
import type { PeriodType } from '@/config/trafficPeriods';

/** Period-over-period window size per period (number of records): hour = the latest 24, day = the latest 7, month / year = 1 */
export const COMPARE_WINDOW_SIZE: Record<PeriodType, number> = { hour: 24, day: 7, month: 1, year: 1 };

/**
 * Sub-label of the period-over-period card (explains the window scope).
 *
 * Values are i18n message keys (`period.compare.window.*`), not display text:
 * resolve them with t() where they are rendered so they follow the UI locale.
 */
export const COMPARE_WINDOW_LABEL: Record<PeriodType, string> = {
    hour: 'period.compare.window.hour',
    day: 'period.compare.window.day',
    month: 'period.compare.window.month',
    year: 'period.compare.window.year',
};

/**
 * Period-over-period comparison windows.
 */
export interface CompareWindows {
    /** Current window data (ascending by time) */
    current: TrafficItem[];
    /** Equally long previous window data (ascending by time, immediately before current) */
    previous: TrafficItem[];
}

/**
 * Period-over-period computation result.
 */
export interface PeriodCompareResult {
    /** Total bytes of the current window (rx + tx) */
    currentTotal: number;
    /** Total bytes of the previous window (rx + tx) */
    previousTotal: number;
    /**
     * Change percentage (signed, e.g. 8.2 / -12.0).
     * null when there is not enough data (missing records in a window, or a previous window total of 0).
     */
    percent: number | null;
}

/**
 * Locate the start index of the current window within the full data.
 *
 * @param allItems Full data (ascending by time)
 * @param current Current window data (must be a contiguous segment of allItems)
 * @returns The start index; -1 when not found
 */
function findWindowStart(allItems: TrafficItem[], current: TrafficItem[]): number {
    if (!current.length) return -1;
    const firstTs = current[0].timestamp;
    return allItems.findIndex((i) => i.timestamp === firstTs);
}

/**
 * Build the period-over-period comparison windows: the current window + an equally long previous one.
 *
 * - when currentItems is null, take the last compareWindow records of the full data (the default
 *   scope)
 * - previous window = an equally long segment taken before the position of the first currentItems
 *   record within the full data
 * - returns null when either side has insufficient data (the previous window length differs from the
 *   current one)
 *
 * @param allItems Full data (ascending by time, unfiltered)
 * @param currentItems Data of the window currently displayed (ascending by time); null means unfiltered
 * @param compareWindow Window size (number of records), see COMPARE_WINDOW_SIZE
 * @returns The comparison windows; null when there is not enough data
 */
export function buildCompareWindows(
    allItems: TrafficItem[],
    currentItems: TrafficItem[] | null,
    compareWindow: number,
): CompareWindows | null {
    const current = currentItems ?? allItems.slice(-compareWindow);
    const size = current.length;
    if (size === 0 || compareWindow <= 0) return null;

    const startIdx = findWindowStart(allItems, current);
    if (startIdx <= 0) return null;
    const previous = allItems.slice(Math.max(0, startIdx - size), startIdx);
    if (previous.length !== size) return null;
    return { current, previous };
}

/**
 * Compute the period-over-period result: total of the current window vs total of the equally long
 * previous window.
 *
 * Traffic going up or down carries no good/bad meaning, so only a neutral percentage is returned;
 * null on division by zero (the previous window total is 0).
 *
 * @param current Current window data
 * @param previous Previous window data
 * @returns The period-over-period result
 */
export function computePeriodCompare(current: TrafficItem[], previous: TrafficItem[]): PeriodCompareResult {
    const currentTotal = computeTotalBytes(current);
    const previousTotal = computeTotalBytes(previous);
    if (!current.length || previous.length !== current.length || previousTotal <= 0) {
        return { currentTotal, previousTotal, percent: null };
    }
    const percent = ((currentTotal - previousTotal) / previousTotal) * 100;
    return { currentTotal, previousTotal, percent: Math.round(percent * 10) / 10 };
}

/**
 * Format the period-over-period percentage as display text (with an arrow).
 *
 * @param percent Change percentage; null means there is not enough data
 * @returns e.g. "↑ +8.2%", "↓ -12.0%", "→ 0.0%"; "-" when there is not enough data
 */
export function formatComparePercent(percent: number | null): string {
    if (percent === null) return '-';
    if (percent > 0) return `↑ +${formatDecimal(percent, 1)}%`;
    if (percent < 0) return `↓ ${formatDecimal(percent, 1)}%`;
    return `→ ${formatDecimal(0, 1)}%`;
}

/**
 * Build the ghost comparison series (overlay line on the day view chart).
 *
 * ghost[i] = the total of the data exactly one window length (= size) before the i-th record of the
 * current window; positions without enough earlier data are filled with null (right aligned).
 *
 * @param allItems Full data (ascending by time, unfiltered)
 * @param currentItems Data of the window currently displayed (ascending by time)
 * @returns A (number | null) series of the same length as currentItems
 */
export function buildGhostSeries(allItems: TrafficItem[], currentItems: TrafficItem[]): (number | null)[] {
    const size = currentItems.length;
    if (!size) return [];
    const startIdx = findWindowStart(allItems, currentItems);
    const series: (number | null)[] = new Array<number | null>(size).fill(null);
    if (startIdx <= 0) return series;
    for (let i = 0; i < size; i++) {
        const prevIdx = startIdx + i - size;
        if (prevIdx >= 0) {
            const item = allItems[prevIdx];
            series[i] = (item.rx ?? 0) + (item.tx ?? 0);
        }
    }
    return series;
}

/**
 * Build a cumulative (running-total) series.
 *
 * out[i] = sum(values[0..i]); an empty input returns an empty array.
 *
 * @param values Series of period values (e.g. the rx + tx total of each period)
 * @returns A cumulative series of the same length as the input
 */
export function buildCumulativeSeries(values: number[]): number[] {
    const out: number[] = [];
    let sum = 0;
    for (const v of values) {
        sum += v;
        out.push(sum);
    }
    return out;
}
