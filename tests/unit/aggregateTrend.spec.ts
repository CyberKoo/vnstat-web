import { describe, expect, it } from 'vitest';

import { buildAggregateDailySeries, dayKeyOf } from '@/composables/useAggregateTrend';
import type { TrafficItem, VnstatInterfaceDetail } from '@/types/network';

/** Build one daily traffic record (with a complete date field) */
function makeDay(year: number, month: number, day: number, rx: number, tx: number): TrafficItem {
    return {
        date: { year, month, day },
        id: year * 10000 + month * 100 + day,
        rx,
        tx,
        timestamp: Math.floor(new Date(year, month - 1, day, 12, 0, 0).getTime() / 1000),
    };
}

/** Build an interface detail that only has daily traffic records */
function makeDetail(name: string, days: TrafficItem[]): VnstatInterfaceDetail {
    return {
        alias: name,
        created: { date: { year: 2024 }, timestamp: 0 },
        name,
        traffic: {
            day: days,
            fiveminute: [],
            hour: [],
            month: [],
            top: [],
            total: { rx: 0, tx: 0 },
            year: [],
        },
        updated: { date: { year: 2024 }, timestamp: 0 },
    };
}

describe('dayKeyOf', () => {
    it('prefers building the date key from the date field', () => {
        expect(dayKeyOf(makeDay(2026, 9, 28, 0, 0))).toBe('2026-09-28');
        expect(dayKeyOf(makeDay(2026, 1, 5, 0, 0))).toBe('2026-01-05');
    });

    it('falls back to deriving the date from timestamp when month/day are missing (local time zone)', () => {
        // 2024-03-15 14:00 local time
        const ts = Math.floor(new Date(2024, 2, 15, 14, 0, 0).getTime() / 1000);
        expect(dayKeyOf({ date: { year: 2024 }, id: 0, rx: 0, tx: 0, timestamp: ts })).toBe('2024-03-15');
    });
});

describe('buildAggregateDailySeries', () => {
    it('returns an empty series for an empty detail list', () => {
        expect(buildAggregateDailySeries([])).toEqual({ keys: [], rx: [], tx: [], totals: [] });
    });

    it('degenerates to the interface own daily series for a single interface (calendar window, days without records are filled with 0)', () => {
        const detail = makeDetail('eno1', [makeDay(2026, 9, 27, 100, 50), makeDay(2026, 9, 28, 300, 100)]);
        const series = buildAggregateDailySeries([detail]);
        // the window ends at the latest data day (09-28) and spans the previous 30 consecutive calendar days
        expect(series.keys).toHaveLength(30);
        expect(series.keys[0]).toBe('2026-08-30');
        expect(series.keys[29]).toBe('2026-09-28');
        expect(series.rx[27]).toBe(0); // 09-26 has no record
        expect(series.rx[28]).toBe(100); // 09-27
        expect(series.tx[28]).toBe(50);
        expect(series.rx[29]).toBe(300); // 09-28
        expect(series.totals[29]).toBe(400);
    });

    it('aligns on the union of dates and sums when interfaces are not aligned, counting gaps as 0', () => {
        const a = makeDetail('a', [makeDay(2026, 9, 26, 10, 1), makeDay(2026, 9, 28, 30, 3)]);
        const b = makeDetail('b', [makeDay(2026, 9, 27, 20, 2), makeDay(2026, 9, 28, 40, 4)]);
        const series = buildAggregateDailySeries([a, b]);
        expect(series.keys).toHaveLength(30);
        expect(series.keys[0]).toBe('2026-08-30');
        const at = (key: string) => series.keys.indexOf(key);
        expect(series.rx[at('2026-09-26')]).toBe(10);
        expect(series.tx[at('2026-09-26')]).toBe(1);
        expect(series.rx[at('2026-09-27')]).toBe(20);
        expect(series.tx[at('2026-09-27')]).toBe(2);
        expect(series.rx[at('2026-09-28')]).toBe(70);
        expect(series.tx[at('2026-09-28')]).toBe(7);
        expect(series.totals[at('2026-09-28')]).toBe(77);
    });

    it('sums rx and tx separately, with totals being the sum of both', () => {
        const a = makeDetail('a', [makeDay(2026, 9, 28, 100, 200)]);
        const b = makeDetail('b', [makeDay(2026, 9, 28, 300, 400)]);
        const series = buildAggregateDailySeries([a, b]);
        expect(series.rx[29]).toBe(400);
        expect(series.tx[29]).toBe(600);
        expect(series.totals[29]).toBe(1000);
    });

    it('fills days without records in the window with 0 so the x axis stays continuous (gaps caused by the machine being off)', () => {
        // only 09-01 and 09-03 have data; 09-02 and the remaining days in the window are filled with 0
        const detail = makeDetail('eno1', [makeDay(2026, 9, 1, 50, 0), makeDay(2026, 9, 3, 70, 0)]);
        const series = buildAggregateDailySeries([detail]);
        const at = (key: string) => series.keys.indexOf(key);
        expect(series.keys[0]).toBe('2026-08-05');
        expect(series.keys[29]).toBe('2026-09-03');
        expect(series.rx[at('2026-09-01')]).toBe(50);
        expect(series.rx[at('2026-09-02')]).toBe(0);
        expect(series.rx[at('2026-09-03')]).toBe(70);
    });

    it('truncates days beyond the window, keeping only the most recent windowDays calendar days', () => {
        const days: TrafficItem[] = [];
        // 35 consecutive days starting from 2024-01-01
        for (let i = 0; i < 35; i++) {
            const d = new Date(2024, 0, 1 + i, 12, 0, 0);
            days.push(makeDay(d.getFullYear(), d.getMonth() + 1, d.getDate(), 100, 0));
        }
        const series = buildAggregateDailySeries([makeDetail('eno1', days)]);
        expect(series.keys).toHaveLength(30);
        expect(series.keys[0]).toBe('2024-01-06');
        expect(series.keys[29]).toBe('2024-02-04');
        expect(series.rx[29]).toBe(100);
    });

    it('treats missing rx/tx as 0', () => {
        const broken = { ...makeDay(2026, 9, 28, 0, 0), rx: undefined as unknown as number };
        const series = buildAggregateDailySeries([makeDetail('eno1', [broken])]);
        expect(series.rx[29]).toBe(0);
        expect(series.totals[29]).toBe(0);
    });
});
