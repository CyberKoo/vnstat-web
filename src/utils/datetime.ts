import type { Dayjs, UnitType } from 'dayjs';

import dayjs from '@/plugins/dayjs';
import { MS_IN_SECOND } from '@/constants';
import type { TrafficItem } from '@/types/network';

/**
 * Computes the length of the interval between a given timestamp and the current time (or a given
 * nowArg) in a given time unit.
 *
 * 1. If nowArg and timestamp are not in the same period (unit), returns the total length of the
 *    target period (in outputUnit).
 * 2. If they are in the same period, returns the length elapsed from the start of the period to
 *    nowArg (or the current time) (in outputUnit).
 *
 * @param timestamp - Target time; may be a timestamp, string, Date, or Dayjs instance
 * @param unit - Unit of the computed interval, e.g. 'day', 'week', 'month', 'year'
 * @param outputUnit - Output unit, default 'second'
 * @param nowArg - Current time used for comparison, optional, defaults to now
 * @returns number - The interval length in outputUnit
 * @throws Error - If the input date is invalid
 *
 * @example
 * computeInterval('2024-09-16', 'day') // If today is 2024-09-16, returns the seconds from 00:00 to now
 * computeInterval('2024-09-15', 'day') // If nowArg is not on the same day, returns the total seconds in a day
 */
export function computeInterval(
    timestamp: number | string | Date | Dayjs,
    unit: UnitType,
    outputUnit: UnitType = 'second',
    nowArg?: number | string | Date | Dayjs,
): number {
    // Get the dayjs instance of the current time, defaulting to now
    const now = nowArg ? dayjs(nowArg) : dayjs();

    // Get the dayjs instance of the target time
    const target = dayjs(timestamp);

    // Validate the input
    if (!now.isValid() || !target.isValid()) {
        throw new Error('Invalid date input for nowArg or timestamp');
    }

    /**
     * When now and target are not in the same period (e.g. a different day/week/month/year),
     * returns the total length of the target period (e.g. the total seconds in a day)
     */
    if (!now.isSame(target, unit)) {
        // Get the start and the end of the target period
        const start = target.startOf(unit);
        const end = target.endOf(unit);

        // endOf returns the last millisecond of the period, and +1 makes it an inclusive length
        // e.g. for a day, the length from 00:00:00.000 to 23:59:59.999
        return end.add(1, 'millisecond').diff(start, outputUnit, false);
    }

    /**
     * When they are in the same period,
     * returns the length elapsed from the start of the period to the current time
     */
    const startOfUnit = now.startOf(unit);
    return now.diff(startOfUnit, outputUnit, false);
}

/**
 * Formats a unix timestamp (seconds) with a dayjs format string.
 *
 * @param ts - Unix timestamp in seconds
 * @param fmt - dayjs format string, e.g. 'YYYY-MM-DD'
 * @returns The formatted date string
 */
export function formatTimestamp(ts: number, fmt: string): string {
    return dayjs.unix(ts).format(fmt);
}

/**
 * Date key of a traffic item (YYYY-MM-DD, local time zone).
 *
 * Prefers the date field provided by vnStat; when month/day are missing it falls back to deriving them
 * from the timestamp.
 *
 * @param item Traffic data item
 * @returns The date key (e.g. "2026-09-28")
 */
export function dayKeyOf(item: TrafficItem): string {
    if (item.date && typeof item.date.month === 'number' && typeof item.date.day === 'number') {
        const m = String(item.date.month).padStart(2, '0');
        const d = String(item.date.day).padStart(2, '0');
        return `${item.date.year}-${m}-${d}`;
    }
    const local = new Date(item.timestamp * MS_IN_SECOND);
    const m = String(local.getMonth() + 1).padStart(2, '0');
    const d = String(local.getDate()).padStart(2, '0');
    return `${local.getFullYear()}-${m}-${d}`;
}
