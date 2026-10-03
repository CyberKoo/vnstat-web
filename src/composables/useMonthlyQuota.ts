import type { Dayjs } from 'dayjs';

import dayjs from '@/plugins/dayjs';

/** 1 GiB (bytes) */
const BYTES_IN_GIB = 1024 ** 3;

/**
 * Quota progress result.
 */
export interface QuotaProgress {
    /** Bytes used this month */
    usedBytes: number;
    /** Quota in bytes */
    quotaBytes: number;
    /** Percentage used (may exceed 100, kept to 1 decimal) */
    percent: number;
}

/**
 * Month-end projection result.
 */
export interface MonthEndProjection {
    /** Days elapsed this month (including today) */
    elapsedDays: number;
    /** Total number of days in the month */
    daysInMonth: number;
    /** Average bytes per day this month */
    dailyAvgBytes: number;
    /** Month-end total extrapolated at the current pace (bytes) */
    projectedBytes: number;
}

/**
 * Compute the quota progress.
 *
 * @param usedBytes Bytes used this month
 * @param quotaGiB Monthly quota (GiB); null or a non-positive value counts as not set
 * @returns The progress result; null when no quota is set
 */
export function computeQuotaProgress(usedBytes: number, quotaGiB: number | null): QuotaProgress | null {
    if (quotaGiB == null || !(quotaGiB > 0)) return null;
    const quotaBytes = quotaGiB * BYTES_IN_GIB;
    const percent = Math.round((usedBytes / quotaBytes) * 1000) / 10;
    return { usedBytes, quotaBytes, percent };
}

/**
 * Extrapolate the month-end total linearly from the amount used so far this month.
 *
 * Only valid for the "current month" (null is returned when the target month is not the same calendar
 * month as now, e.g. when viewing a past month).
 * The elapsed days include today: on the 1st of the month elapsedDays = 1.
 *
 * @param monthTimestamp Timestamp of the data item of the target month (seconds, any moment within
 *   that month)
 * @param totalBytes Total used so far this month (bytes)
 * @param now Current time (can be injected for testing)
 * @returns The month-end projection; null when it is not the current month or the total is 0
 */
export function projectMonthEnd(
    monthTimestamp: number,
    totalBytes: number,
    now: Dayjs = dayjs(),
): MonthEndProjection | null {
    const monthStart = dayjs.unix(monthTimestamp);
    if (!now.isSame(monthStart, 'month') || totalBytes <= 0) return null;
    const elapsedDays = Math.max(1, now.diff(monthStart.startOf('month'), 'day') + 1);
    const daysInMonth = monthStart.daysInMonth();
    const dailyAvgBytes = totalBytes / elapsedDays;
    return {
        elapsedDays,
        daysInMonth,
        dailyAvgBytes,
        projectedBytes: dailyAvgBytes * daysInMonth,
    };
}

/**
 * Compute the percentage of the quota taken by the month-end projection.
 *
 * @param projectedBytes Projected month-end total (bytes)
 * @param quotaGiB Monthly quota (GiB); null or a non-positive value counts as not set
 * @returns The percentage (may exceed 100, kept to 1 decimal); null when no quota is set
 */
export function computeProjectionQuotaPercent(projectedBytes: number, quotaGiB: number | null): number | null {
    if (quotaGiB == null || !(quotaGiB > 0)) return null;
    return Math.round((projectedBytes / (quotaGiB * BYTES_IN_GIB)) * 1000) / 10;
}
