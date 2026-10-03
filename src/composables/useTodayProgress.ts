import { dayKeyOf } from '@/composables/useAggregateTrend';
import type { TrafficItem } from '@/types/network';

/** Statistics window in days for the daily average behind today's share ring */
export const TODAY_RING_WINDOW_DAYS = 30;

/** Shift a date key (YYYY-MM-DD) by a number of days and return the new date key */
function shiftDayKey(key: string, days: number): string {
    const date = new Date(`${key}T00:00:00`);
    date.setDate(date.getDate() + days);
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${m}-${d}`;
}

/** Result of the share ring for today's usage relative to the daily average of the latest 30 days */
export interface TodayRingResult {
    /** Today's usage as a percentage of the daily average (rounded to 0-100); null when there is no
     * historical average (the UI shows "-") */
    percent: number | null;
    /** The raw ratio of today's usage to the daily average usage (null when there is no historical average) */
    ratio: number | null;
    /** Whether it exceeds the daily average usage (when it does, the progress is capped at a full ring
     * and the accent color hints that it is above the daily average) */
    over: boolean;
}

/**
 * Compute the average daily usage over the latest windowDays days (excluding today).
 *
 * The window is the calendar window [today - windowDays, today): only the day records whose date key
 * falls inside it are counted, and the arithmetic mean of each day's (rx+tx) is taken; 0 is returned
 * when there are no samples (a new interface, not enough history).
 *
 * @param items List of daily traffic data items (ascending by time)
 * @param todayKey Today's date key (YYYY-MM-DD)
 * @param windowDays Window size in days (defaults to 30)
 * @returns The average bytes per day (0 when there are no samples)
 */
export function computeDailyAverage(
    items: TrafficItem[],
    todayKey: string,
    windowDays: number = TODAY_RING_WINDOW_DAYS,
): number {
    const beginKey = shiftDayKey(todayKey, -windowDays);
    let sum = 0;
    let count = 0;
    for (const item of items) {
        const key = dayKeyOf(item);
        if (key >= todayKey || key < beginKey) continue;
        sum += (item.rx ?? 0) + (item.tx ?? 0);
        count += 1;
    }
    return count > 0 ? sum / count : 0;
}

/**
 * Compute the share ring from today's usage and the daily average usage.
 *
 * When the percentage exceeds 100% it is capped at a full ring and over is set;
 * percent is null when the daily average is invalid (≤ 0 or not a finite number, i.e. no history).
 *
 * @param todayBytes Bytes used today
 * @param avgBytes Average bytes per day
 * @returns The share ring result
 */
export function computeTodayRing(todayBytes: number, avgBytes: number): TodayRingResult {
    if (!Number.isFinite(avgBytes) || avgBytes <= 0 || !Number.isFinite(todayBytes) || todayBytes < 0) {
        return { percent: null, ratio: null, over: false };
    }
    const ratio = todayBytes / avgBytes;
    return {
        percent: Math.min(100, Math.round(ratio * 100)),
        ratio,
        over: ratio > 1,
    };
}

/** Raw data for today's progress of an interface */
export interface TodayProgress {
    /** Bytes used today (rx+tx) */
    todayBytes: number;
    /** Average bytes per day over the latest 30 days (0 when there is no history) */
    avgBytes: number;
}

/**
 * Extract the two values needed for today's progress from the daily traffic data.
 *
 * Today's usage takes the records whose date key equals todayKey (usually the last one, since vnStat
 * writes one record per day; 0 when there is no record for today yet); the daily average is computed
 * from the remaining historical records.
 *
 * @param items List of daily traffic data items (ascending by time)
 * @param todayKey Today's date key (YYYY-MM-DD)
 * @param windowDays Window size in days for the daily average (defaults to 30)
 * @returns Today's progress data; null when items is empty
 */
export function extractTodayProgress(
    items: TrafficItem[],
    todayKey: string,
    windowDays: number = TODAY_RING_WINDOW_DAYS,
): TodayProgress | null {
    if (!items.length) return null;
    let todayBytes = 0;
    for (const item of items) {
        if (dayKeyOf(item) === todayKey) todayBytes += (item.rx ?? 0) + (item.tx ?? 0);
    }
    return { todayBytes, avgBytes: computeDailyAverage(items, todayKey, windowDays) };
}
