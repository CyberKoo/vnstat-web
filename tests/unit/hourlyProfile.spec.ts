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
    // 2024-01-03 12:00 local: "today" is Jan 3
    const NOW = new Date(2024, 0, 3, 12, 0, 0);

    it('returns 24 zero-valued cells for empty data', () => {
        const profile = buildHourlyProfile([], NOW);
        expect(profile).toHaveLength(24);
        for (const cell of profile) {
            expect(cell.avgTotal).toBe(0);
            expect(cell.samples).toBe(0);
            expect(cell.todayTotal).toBeNull();
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
        const profile = buildHourlyProfile(items, NOW);
        expect(profile[9].samples).toBe(2);
        expect(profile[9].avgRx).toBe(2000);
        expect(profile[9].avgTx).toBe(1000);
        expect(profile[9].avgTotal).toBe(3000);
        expect(profile[10].avgTotal).toBe(4500);
        // hours without samples stay at 0
        expect(profile[0].avgTotal).toBe(0);
        expect(profile[0].samples).toBe(0);
    });

    it('anchors actual values to today: hours not yet reached today stay null instead of showing yesterday', () => {
        const items = [
            makeHour(8, 100, 0, 1), // yesterday 08:00 -> not today
            makeHour(8, 200, 0, 2), // today 08:00
            makeHour(9, 999, 1, 2), // today 09:00, superseded by the next record
            makeHour(9, 50, 0, 2), // today 09:00 (the later one wins)
            makeHour(15, 300, 0, 1), // yesterday 15:00 -> hour 15 has not happened today
        ];
        const profile = buildHourlyProfile(items, NOW);
        expect(profile[8].todayRx).toBe(200);
        expect(profile[8].todayTotal).toBe(200);
        expect(profile[9].todayTotal).toBe(50);
        expect(profile[15].todayTotal).toBeNull();
        // the average still uses every record
        expect(profile[8].samples).toBe(2);
        expect(profile[8].avgTotal).toBe(150);
        expect(profile[15].avgTotal).toBe(300);
    });

    it('falls back to deriving the hour from timestamp when time.hour is missing', () => {
        const ts = Math.floor(new Date(2024, 0, 3, 8, 0, 0).getTime() / 1000);
        const profile = buildHourlyProfile([makeHourNoTime(ts, 500, 500)], NOW);
        expect(profile[8].samples).toBe(1);
        expect(profile[8].avgTotal).toBe(1000);
        expect(profile[8].todayTotal).toBe(1000);
    });

    it('treats missing rx/tx as 0', () => {
        const item = { ...makeHour(5, 0, 0), rx: undefined as unknown as number };
        const profile = buildHourlyProfile([item], NOW);
        expect(profile[5].avgRx).toBe(0);
        expect(profile[5].samples).toBe(1);
    });
});

describe('buildWeekHourMatrix', () => {
    // 2024-01-03 is a Wednesday: the current week runs from Monday 2024-01-01 00:00 up to now
    const NOW = new Date(2024, 0, 3, 12, 0, 0);

    it('returns a 7x24 matrix with rows ordered Monday to Sunday', () => {
        const matrix = buildWeekHourMatrix([], NOW);
        expect(matrix).toHaveLength(7);
        for (const row of matrix) expect(row).toHaveLength(24);
    });

    it('keeps only current-week records: previous weeks and future records are dropped', () => {
        const items = [
            makeHour(9, 1000, 0, -7), // last week's Monday 09:00 → dropped
            makeHour(9, 3000, 0, 0), // this week's Monday 09:00 → kept
            makeHour(9, 2000, 0, 1), // this week's Tuesday 09:00 → kept
            makeHour(10, 8000, 0, 5), // this week's Saturday 10:00, but after NOW → dropped
        ];
        const matrix = buildWeekHourMatrix(items, NOW);
        expect(matrix[0][9]).toBe(3000); // Monday = row 0: only this week's record, not the average
        expect(matrix[1][9]).toBe(2000); // Tuesday = row 1
        expect(matrix[2][9]).toBe(0); // Wednesday 09:00 has no data
        expect(matrix[5][10]).toBe(0); // Saturday has not happened yet at NOW
    });

    it('puts Sunday on the last row (Date.getDay 0=Sunday -> row 6)', () => {
        // 2024-01-07 is a Sunday; evaluate at that Sunday
        const sunday = new Date(2024, 0, 7, 23, 0, 0);
        const items = [makeHour(15, 500, 500, 6)];
        const matrix = buildWeekHourMatrix(items, sunday);
        expect(matrix[6][15]).toBe(1000);
        expect(matrix[0][15]).toBe(0);
    });
});
