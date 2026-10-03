import { describe, expect, it } from 'vitest';

import dayjs from '@/plugins/dayjs';
import {
    buildCompareWindows,
    buildCumulativeSeries,
    buildGhostSeries,
    computePeriodCompare,
    formatComparePercent,
    COMPARE_WINDOW_SIZE,
} from '@/composables/usePeriodCompare';
import type { TrafficItem } from '@/types/network';

/** Build one traffic record for the given date (local midnight) */
function makeDay(date: string, total: number): TrafficItem {
    return {
        date: { year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)), day: Number(date.slice(8, 10)) },
        id: 1,
        rx: total,
        tx: 0,
        timestamp: dayjs(date).unix(),
    };
}

/** N consecutive days of data with a fixed total per day (ending at endDate) */
function makeDays(endDate: string, count: number, total: number): TrafficItem[] {
    return Array.from({ length: count }, (_, i) =>
        makeDay(
            dayjs(endDate)
                .subtract(count - 1 - i, 'day')
                .format('YYYY-MM-DD'),
            total,
        ),
    );
}

describe('buildCompareWindows', () => {
    it('with no explicit window takes the trailing window of all data, with the previous window right before the current one', () => {
        const all = [...makeDays('2026-09-21', 7, 100), ...makeDays('2026-09-28', 7, 200)];
        const win = buildCompareWindows(all, null, 7);
        expect(win).not.toBeNull();
        expect(win!.current).toHaveLength(7);
        expect(win!.previous).toHaveLength(7);
        expect(dayjs.unix(win!.current[0].timestamp).format('YYYY-MM-DD')).toBe('2026-09-22');
        expect(dayjs.unix(win!.previous[0].timestamp).format('YYYY-MM-DD')).toBe('2026-09-15');
    });

    it('uses the passed slice as the current window', () => {
        const all = [...makeDays('2026-09-21', 7, 100), ...makeDays('2026-09-28', 7, 200)];
        const filtered = all.slice(-3); // the current window can be a trailing slice of the full data
        const win = buildCompareWindows(all, filtered, 7);
        expect(win).not.toBeNull();
        expect(win!.current).toHaveLength(3);
        expect(win!.previous).toHaveLength(3);
        expect(dayjs.unix(win!.previous[2].timestamp).format('YYYY-MM-DD')).toBe('2026-09-25');
    });

    it('returns null when there is not enough data (the previous window is short)', () => {
        const all = makeDays('2026-09-28', 10, 100);
        expect(buildCompareWindows(all, null, 7)).toBeNull();
    });

    it('returns null for empty data or an invalid window size', () => {
        expect(buildCompareWindows([], null, 7)).toBeNull();
        const all = makeDays('2026-09-28', 14, 100);
        expect(buildCompareWindows(all, null, 0)).toBeNull();
    });

    it('COMPARE_WINDOW_SIZE values: hour 24 / day 7 / month 1 / year 1', () => {
        expect(COMPARE_WINDOW_SIZE).toEqual({ hour: 24, day: 7, month: 1, year: 1 });
    });
});

describe('computePeriodCompare', () => {
    it('computes a signed percentage', () => {
        const cur = makeDays('2026-09-28', 2, 150);
        const prev = makeDays('2026-09-26', 2, 100);
        const result = computePeriodCompare(cur, prev);
        expect(result.currentTotal).toBe(300);
        expect(result.previousTotal).toBe(200);
        expect(result.percent).toBe(50);
    });

    it('returns null when the two sides have different entry counts', () => {
        const cur = makeDays('2026-09-28', 2, 150);
        const prev = makeDays('2026-09-27', 1, 100);
        expect(computePeriodCompare(cur, prev).percent).toBeNull();
    });

    it('returns null when the previous window total is 0', () => {
        const cur = makeDays('2026-09-28', 2, 150);
        const prev = makeDays('2026-09-26', 2, 0);
        expect(computePeriodCompare(cur, prev).percent).toBeNull();
    });
});

describe('formatComparePercent', () => {
    it('displays - for null', () => {
        expect(formatComparePercent(null)).toBe('-');
    });

    it('marks increases and decreases with an arrow and a sign', () => {
        expect(formatComparePercent(8.2)).toBe('↑ +8.2%');
        expect(formatComparePercent(-12)).toBe('↓ -12.0%');
        expect(formatComparePercent(0)).toBe('→ 0.0%');
    });
});

describe('buildGhostSeries', () => {
    it('ghost[i] corresponds to the data one window length before entry i of the current window', () => {
        const prev = makeDays('2026-09-15', 3, 100); // 09-13 ~ 09-15
        const cur = makeDays('2026-09-18', 3, 200); // 09-16 ~ 09-18
        const all = [...prev, ...cur];
        const ghost = buildGhostSeries(all, cur);
        expect(ghost).toEqual([100, 100, 100]);
    });

    it('fills null where the previous data is insufficient (right aligned)', () => {
        const prev = makeDays('2026-09-15', 2, 100); // only 2 entries in the previous window
        const cur = makeDays('2026-09-18', 3, 200);
        const all = [...prev, ...cur];
        const ghost = buildGhostSeries(all, cur);
        expect(ghost).toEqual([null, 100, 100]);
    });

    it('returns an empty array when the current window is empty', () => {
        expect(buildGhostSeries([], [])).toEqual([]);
    });
});

describe('buildCumulativeSeries', () => {
    it('returns an empty array for empty input', () => {
        expect(buildCumulativeSeries([])).toEqual([]);
    });

    it('accumulates item by item (running total)', () => {
        expect(buildCumulativeSeries([1, 2, 3])).toEqual([1, 3, 6]);
    });

    it('handles 0 and floating point values', () => {
        expect(buildCumulativeSeries([0, 0.5, 0.5, 0])).toEqual([0, 0.5, 1, 1]);
    });
});
