import { describe, expect, it } from 'vitest';

import { buildHourlyProfile, buildWeekHourMatrix } from '@/composables/useHourlyProfile';
import type { TrafficItem } from '@/types/network';

/** Build one hourly traffic record */
function makeHour(hour: number, rx: number, tx: number, dayOffset = 0): TrafficItem {
    // baseline: 2024-01-01 is a Monday (the timestamp is the local hour)
    const base = new Date(2024, 0, 1 + dayOffset, hour, 0, 0);
    return {
        date: { year: base.getFullYear(), month: base.getMonth() + 1, day: base.getDate() },
        id: dayOffset * 100 + hour,
        rx,
        tx,
        timestamp: Math.floor(base.getTime() / 1000),
        time: { hour, minute: 0 },
    };
}

/** Build an hourly record without a time field (falls back to the timestamp) */
function makeHourNoTime(timestamp: number, rx: number, tx: number): TrafficItem {
    return { date: { year: 2024 }, id: 0, rx, tx, timestamp };
}

describe('buildHourlyProfile', () => {
    it('returns 24 zero-valued cells for empty data', () => {
        const profile = buildHourlyProfile([]);
        expect(profile).toHaveLength(24);
        for (const cell of profile) {
            expect(cell.avgTotal).toBe(0);
            expect(cell.samples).toBe(0);
            expect(cell.recentTotal).toBeNull();
        }
    });

    it('aggregates the multi-day average by hour (rx/tx/total)', () => {
        // two days: only 09:00 and 10:00 have records each day
        const items = [
            makeHour(9, 1000, 500, 0),
            makeHour(10, 2000, 1000, 0),
            makeHour(9, 3000, 1500, 1),
            makeHour(10, 4000, 2000, 1),
        ];
        const profile = buildHourlyProfile(items);
        expect(profile[9].samples).toBe(2);
        expect(profile[9].avgRx).toBe(2000);
        expect(profile[9].avgTx).toBe(1000);
        expect(profile[9].avgTotal).toBe(3000);
        expect(profile[10].avgTotal).toBe(4500);
        // hours without samples stay at 0
        expect(profile[0].avgTotal).toBe(0);
        expect(profile[0].samples).toBe(0);
    });

    it('takes the last 24 entries for the recent 24h values, with the later one overwriting the earlier', () => {
        // 25 entries: hour 0 appears twice (the first entry and the last one), the later hour overwrites
        const items: TrafficItem[] = [];
        for (let i = 0; i < 24; i++) items.push(makeHour(i, 100, 0, 0));
        items.push(makeHour(0, 999, 1, 1));
        const profile = buildHourlyProfile(items);
        // the last 24 entries = hours 2 to 24 + 00:00 of the next day
        expect(profile[0].recentRx).toBe(999);
        expect(profile[0].recentTx).toBe(1);
        expect(profile[0].recentTotal).toBe(1000);
        expect(profile[1].recentRx).toBe(100);
        expect(profile[23].recentRx).toBe(100);
        // the average still uses all 25 samples
        expect(profile[0].samples).toBe(2);
    });

    it('falls back to deriving the hour from timestamp when time.hour is missing', () => {
        const ts = Math.floor(new Date(2024, 0, 1, 13, 0, 0).getTime() / 1000);
        const profile = buildHourlyProfile([makeHourNoTime(ts, 500, 500)]);
        expect(profile[13].samples).toBe(1);
        expect(profile[13].avgTotal).toBe(1000);
        expect(profile[13].recentTotal).toBe(1000);
    });

    it('treats missing rx/tx as 0', () => {
        const item = { ...makeHour(5, 0, 0), rx: undefined as unknown as number };
        const profile = buildHourlyProfile([item]);
        expect(profile[5].avgRx).toBe(0);
        expect(profile[5].samples).toBe(1);
    });
});

describe('buildWeekHourMatrix', () => {
    it('returns a 7x24 matrix with rows ordered Monday to Sunday', () => {
        const matrix = buildWeekHourMatrix([]);
        expect(matrix).toHaveLength(7);
        for (const row of matrix) expect(row).toHaveLength(24);
    });

    it('aggregates the average by weekday x hour', () => {
        // 2024-01-01 is a Monday: two records at Monday 09:00, one at Tuesday 09:00
        const items = [makeHour(9, 1000, 0, 0), makeHour(9, 3000, 0, 7), makeHour(9, 2000, 0, 1)];
        const matrix = buildWeekHourMatrix(items);
        expect(matrix[0][9]).toBe(2000); // Monday = row 0
        expect(matrix[1][9]).toBe(2000); // Tuesday = row 1
        expect(matrix[2][9]).toBe(0); // Wednesday has no data
    });

    it('puts Sunday on the last row (Date.getDay 0=Sunday -> row 6)', () => {
        // 2024-01-07 is a Sunday
        const items = [makeHour(15, 500, 500, 6)];
        const matrix = buildWeekHourMatrix(items);
        expect(matrix[6][15]).toBe(1000);
        expect(matrix[0][15]).toBe(0);
    });
});
