import { describe, expect, it } from 'vitest';

import { computeDailyAverage, computeTodayRing, extractTodayProgress } from '@/composables/useTodayProgress';
import type { TrafficItem } from '@/types/network';

/** Build one daily traffic record */
function makeDay(year: number, month: number, day: number, rx: number, tx: number): TrafficItem {
    return {
        date: { year, month, day },
        id: year * 10000 + month * 100 + day,
        rx,
        tx,
        timestamp: Math.floor(new Date(year, month - 1, day, 12, 0, 0).getTime() / 1000),
    };
}

/** Today's date key used by the tests */
const TODAY = '2026-09-28';

describe('computeDailyAverage', () => {
    it('returns 0 for an empty list (no history)', () => {
        expect(computeDailyAverage([], TODAY)).toBe(0);
    });

    it('returns 0 when only today has records (today is not counted in the average)', () => {
        const items = [makeDay(2026, 9, 28, 100, 100)];
        expect(computeDailyAverage(items, TODAY)).toBe(0);
    });

    it('takes the arithmetic mean of (rx+tx) over the records in the window', () => {
        const items = [
            makeDay(2026, 9, 26, 100, 100), // total 200
            makeDay(2026, 9, 27, 300, 100), // total 400
            makeDay(2026, 9, 28, 999, 999), // today, not counted
        ];
        expect(computeDailyAverage(items, TODAY)).toBe(300);
    });

    it('excludes records before the window start (the window is [today-30, today))', () => {
        const items = [
            makeDay(2026, 8, 28, 1000, 0), // exactly 31 days ago, outside the window
            makeDay(2026, 8, 29, 100, 0), // 30 days ago, inside the window
            makeDay(2026, 9, 27, 300, 0),
        ];
        // (100 + 300) / 2 = 200
        expect(computeDailyAverage(items, TODAY)).toBe(200);
    });
});

describe('computeTodayRing', () => {
    it('sets percent to null when the daily average is invalid (<= 0 or not finite) (the UI shows "-")', () => {
        expect(computeTodayRing(100, 0).percent).toBeNull();
        expect(computeTodayRing(100, -5).percent).toBeNull();
        expect(computeTodayRing(100, Number.NaN).percent).toBeNull();
    });

    it('shows 0% when today is 0 and the daily average is valid', () => {
        expect(computeTodayRing(0, 100)).toEqual({ percent: 0, ratio: 0, over: false });
    });

    it('rounds to the actual ratio when below 100%', () => {
        expect(computeTodayRing(50, 100)).toEqual({ percent: 50, ratio: 0.5, over: false });
    });

    it('fills the ring but does not count as over the daily average when exactly equal', () => {
        expect(computeTodayRing(100, 100)).toEqual({ percent: 100, ratio: 1, over: false });
    });

    it('truncates to a full ring and flags over when above 100%', () => {
        expect(computeTodayRing(250, 100)).toEqual({ percent: 100, ratio: 2.5, over: true });
    });
});

describe('extractTodayProgress', () => {
    it('returns null for an empty list', () => {
        expect(extractTodayProgress([], TODAY)).toBeNull();
    });

    it('only today has records: todayBytes takes today value and the average is 0', () => {
        expect(extractTodayProgress([makeDay(2026, 9, 28, 100, 50)], TODAY)).toEqual({
            todayBytes: 150,
            avgBytes: 0,
        });
    });

    it('sets todayBytes to 0 and takes the historical average when today has no records', () => {
        const items = [makeDay(2026, 9, 26, 100, 100), makeDay(2026, 9, 27, 300, 100)];
        expect(extractTodayProgress(items, TODAY)).toEqual({ todayBytes: 0, avgBytes: 300 });
    });

    it('computes both values when today and history coexist', () => {
        const items = [
            makeDay(2026, 9, 27, 100, 100), // history, total 200
            makeDay(2026, 9, 28, 600, 400), // today, total 1000
        ];
        expect(extractTodayProgress(items, TODAY)).toEqual({ todayBytes: 1000, avgBytes: 200 });
    });
});
