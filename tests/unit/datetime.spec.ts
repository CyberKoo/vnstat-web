import { describe, expect, it } from 'vitest';

import { computeInterval } from '@/utils/datetime';

describe('computeInterval', () => {
    it('returns the full length of the target period across periods (in days)', () => {
        // 2024-01-01 and nowArg 2024-01-02 are on different days -> return the seconds in one day
        expect(computeInterval('2024-01-01', 'day', 'second', '2024-01-02')).toBe(86400);
    });

    it('returns the elapsed time within the same period', () => {
        // same day: 43200 seconds from 00:00 to 12:00:00
        expect(computeInterval('2024-01-01', 'day', 'second', '2024-01-01T12:00:00')).toBe(43200);
    });

    it('returns the full length of the month when crossing months', () => {
        // 2024-02 has 29 days (leap year)
        expect(computeInterval('2024-02-01', 'month', 'second', '2024-03-01')).toBe(29 * 86400);
        // 2023-02 has 28 days
        expect(computeInterval('2023-02-01', 'month', 'second', '2023-03-01')).toBe(28 * 86400);
    });

    it('returns the full length of the year when crossing years', () => {
        // 2024 is a leap year with 366 days
        expect(computeInterval('2024-01-01', 'year', 'second', '2025-01-01')).toBe(366 * 86400);
        // 2023 is a common year with 365 days
        expect(computeInterval('2023-01-01', 'year', 'second', '2024-01-01')).toBe(365 * 86400);
    });

    it('converts into the output unit (hours)', () => {
        expect(computeInterval('2024-01-01', 'day', 'hour', '2024-01-02')).toBe(24);
    });

    it('supports timestamp input (local time zone format)', () => {
        // dayjs(number) parses as milliseconds; a local time zone string is used here to stay stable across time zones
        expect(computeInterval('2024-01-01 00:00:00', 'day', 'second', '2024-01-01 12:00:00')).toBe(43200);
    });

    it('throws for an invalid date', () => {
        expect(() => computeInterval('invalid-date', 'day', 'second', '2024-01-02')).toThrow('Invalid date input');
    });
});
