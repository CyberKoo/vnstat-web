import { computed } from 'vue';

import { useInterfaceDetailStore } from '@/stores/interfaceDetail';
import type { TrafficItem } from '@/types/network';
import { MS_IN_SECOND } from '@/constants';

/**
 * Hour-of-day profile data for a single hour (0-23).
 */
export interface HourlyProfileCell {
    /** Hour (0-23) */
    hour: number;
    /** Historical average received bytes */
    avgRx: number;
    /** Historical average sent bytes */
    avgTx: number;
    /** Historical average total bytes */
    avgTotal: number;
    /** Number of sample days included in the average */
    samples: number;
    /** Actual received bytes for that hour within the most recent 24h (null when there is no sample) */
    recentRx: number | null;
    /** Actual sent bytes for that hour within the most recent 24h (null when there is no sample) */
    recentTx: number | null;
    /** Actual total bytes for that hour within the most recent 24h (null when there is no sample) */
    recentTotal: number | null;
}

/** Hours per day */
const HOURS_PER_DAY = 24;

/** Days per week */
const DAYS_PER_WEEK = 7;

/**
 * Get the hour (0-23) that a data item belongs to.
 *
 * Prefers the time.hour provided by vnStat, falling back to deriving it from the timestamp.
 *
 * @param item Traffic data item
 * @returns The hour (0-23)
 */
function itemHour(item: TrafficItem): number {
    if (item.time && typeof item.time.hour === 'number') return item.time.hour;
    return new Date(item.timestamp * MS_IN_SECOND).getHours();
}

/**
 * Get the weekday (0=Sunday … 6=Saturday) that a data item belongs to.
 *
 * @param item Traffic data item
 * @returns The weekday (0-6)
 */
function itemWeekday(item: TrafficItem): number {
    return new Date(item.timestamp * MS_IN_SECOND).getDay();
}

/**
 * Aggregate the hour-of-day profile for hours 0-23 from historical hourly traffic.
 *
 * For each hour it computes:
 * - the historical average (rx / tx / total) and the number of sample days
 * - the actual value of that hour among the most recent 24 hourly records (a cross-day window, where
 *   later records override earlier ones)
 *
 * @param items List of hourly traffic data items (ascending by time)
 * @returns Profile data for the 24 hours (always 24 entries, ascending by hour)
 *
 * @example
 * ```ts
 * const profile = buildHourlyProfile(hourItems);
 * console.log(profile[9].avgTotal); // historical average traffic at 9 AM
 * ```
 */
export function buildHourlyProfile(items: TrafficItem[]): HourlyProfileCell[] {
    const sumRx = new Array<number>(HOURS_PER_DAY).fill(0);
    const sumTx = new Array<number>(HOURS_PER_DAY).fill(0);
    const counts = new Array<number>(HOURS_PER_DAY).fill(0);

    for (const item of items) {
        const h = itemHour(item);
        if (h < 0 || h >= HOURS_PER_DAY) continue;
        sumRx[h] += item.rx ?? 0;
        sumTx[h] += item.tx ?? 0;
        counts[h] += 1;
    }

    // Actual value per hour among the most recent 24 records (the latest one is kept for a repeated hour)
    const recentRx = new Array<number | null>(HOURS_PER_DAY).fill(null);
    const recentTx = new Array<number | null>(HOURS_PER_DAY).fill(null);
    for (const item of items.slice(-HOURS_PER_DAY)) {
        const h = itemHour(item);
        if (h < 0 || h >= HOURS_PER_DAY) continue;
        recentRx[h] = item.rx ?? 0;
        recentTx[h] = item.tx ?? 0;
    }

    return Array.from({ length: HOURS_PER_DAY }, (_, hour) => {
        const samples = counts[hour];
        const avgRx = samples > 0 ? sumRx[hour] / samples : 0;
        const avgTx = samples > 0 ? sumTx[hour] / samples : 0;
        return {
            hour,
            avgRx,
            avgTx,
            avgTotal: avgRx + avgTx,
            samples,
            recentRx: recentRx[hour],
            recentTx: recentTx[hour],
            recentTotal: recentRx[hour] !== null ? (recentRx[hour] ?? 0) + (recentTx[hour] ?? 0) : null,
        };
    });
}

/**
 * Aggregate the weekday × hour traffic matrix for the current week.
 *
 * Only records from the current week (Monday 00:00 local time up to `now`) are counted: on a
 * Monday the Tuesday–Sunday rows stay empty instead of showing last week's data. Each cell can
 * have at most one sample per week, so the "average" of a cell is simply its actual total.
 *
 * The matrix is ordered "Monday first, Sunday last" (row index 0=Monday … 6=Sunday),
 * with 24 columns per row (hours 0-23).
 *
 * @param items List of hourly traffic data items (ascending by time)
 * @param now Reference time for "current week" (injectable for tests)
 * @returns A 7×24 matrix of total traffic (rows: Monday~Sunday, columns: hours 0-23)
 *
 * @example
 * ```ts
 * const matrix = buildWeekHourMatrix(hourItems);
 * console.log(matrix[0][9]); // this week's traffic on Monday at 9 AM
 * ```
 */
export function buildWeekHourMatrix(items: TrafficItem[], now: Date = new Date()): number[][] {
    const sums = Array.from({ length: DAYS_PER_WEEK }, () => new Array<number>(HOURS_PER_DAY).fill(0));
    const counts = Array.from({ length: DAYS_PER_WEEK }, () => new Array<number>(HOURS_PER_DAY).fill(0));

    // Current week starting Monday 00:00 local (Date.getDay: 0=Sunday → 6 days back, 1=Monday → 0)
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % DAYS_PER_WEEK));
    const fromSec = weekStart.getTime() / MS_IN_SECOND;
    const toSec = now.getTime() / MS_IN_SECOND;

    for (const item of items) {
        // Out-of-window records are other weeks (or clock-skewed future ones): leave them out
        if (item.timestamp < fromSec || item.timestamp > toSec) continue;
        const weekday = itemWeekday(item);
        const hour = itemHour(item);
        if (hour < 0 || hour >= HOURS_PER_DAY) continue;
        sums[weekday][hour] += (item.rx ?? 0) + (item.tx ?? 0);
        counts[weekday][hour] += 1;
    }

    // Date.getDay: 0=Sunday → moved to the last row, so that 0=Monday
    return Array.from({ length: DAYS_PER_WEEK }, (_row, rowIdx) => {
        const weekday = (rowIdx + 1) % DAYS_PER_WEEK;
        return Array.from({ length: HOURS_PER_DAY }, (_col, hour) =>
            counts[weekday][hour] > 0 ? sums[weekday][hour] / counts[weekday][hour] : 0,
        );
    });
}

/**
 * The slice of the interface detail store this composable reads, narrowed to the one field so
 * callers (and tests) can pass a plain object instead of standing up Pinia.
 */
export type InterfaceDetailSource = Pick<ReturnType<typeof useInterfaceDetailStore>, 'value'>;

/**
 * Composable for the hourly traffic profile.
 *
 * Aggregated from traffic.hour of the interface detail:
 * - `profile`: historical average traffic per hour 0-23 + the actual values of the most recent 24h
 * - `weekMatrix`: 7×24 weekday × hour matrix of the current week's traffic (rows: Monday~Sunday)
 *
 * @param detail Source of the interface detail; defaults to the global store
 * @returns The reactive hour-of-day profile and weekday × hour matrix
 */
export function useHourlyProfile(detail: InterfaceDetailSource = useInterfaceDetailStore()) {
    const interfaceDetailStore = detail;

    /** All hourly traffic data */
    const hourItems = computed<TrafficItem[]>(() => interfaceDetailStore.value?.traffic?.hour ?? []);

    /** Hour-of-day profile for hours 0-23 */
    const profile = computed<HourlyProfileCell[]>(() => buildHourlyProfile(hourItems.value));

    /** 7×24 weekday × hour matrix of the current week's traffic (rows: Monday~Sunday) */
    const weekMatrix = computed<number[][]>(() => buildWeekHourMatrix(hourItems.value));

    return { profile, weekMatrix };
}
