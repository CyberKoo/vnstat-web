import { describe, expect, it } from 'vitest';

import dayjs from '@/plugins/dayjs';
import { computeProjectionQuotaPercent, computeQuotaProgress, projectMonthEnd } from '@/composables/useMonthlyQuota';

const GIB = 1024 ** 3;

describe('computeQuotaProgress', () => {
    it('computes the used percentage against a GiB quota', () => {
        const progress = computeQuotaProgress(25 * GIB, 50);
        expect(progress).not.toBeNull();
        expect(progress!.quotaBytes).toBe(50 * GIB);
        expect(progress!.percent).toBe(50);
    });

    it('allows the usage to exceed 100%', () => {
        expect(computeQuotaProgress(120 * GIB, 100)!.percent).toBe(120);
    });

    it('returns null when the quota is unset or non-positive', () => {
        expect(computeQuotaProgress(25 * GIB, null)).toBeNull();
        expect(computeQuotaProgress(25 * GIB, 0)).toBeNull();
        expect(computeQuotaProgress(25 * GIB, -5)).toBeNull();
    });
});

describe('projectMonthEnd', () => {
    it('current month: extrapolates the month-end total from the days elapsed so far', () => {
        const now = dayjs();
        const monthTs = now.startOf('month').unix();
        const total = 30 * GIB;
        const projection = projectMonthEnd(monthTs, total, now);
        expect(projection).not.toBeNull();
        const elapsed = now.diff(now.startOf('month'), 'day') + 1;
        expect(projection!.elapsedDays).toBe(elapsed);
        expect(projection!.daysInMonth).toBe(now.daysInMonth());
        expect(projection!.dailyAvgBytes).toBeCloseTo(total / elapsed, 5);
        expect(projection!.projectedBytes).toBeCloseTo((total / elapsed) * now.daysInMonth(), 5);
    });

    it('returns null for a past month (no projection)', () => {
        const pastMonth = dayjs().subtract(2, 'month').startOf('month').unix();
        expect(projectMonthEnd(pastMonth, 30 * GIB)).toBeNull();
    });

    it('returns null when the total is 0', () => {
        const monthTs = dayjs().startOf('month').unix();
        expect(projectMonthEnd(monthTs, 0)).toBeNull();
    });
});

describe('computeProjectionQuotaPercent', () => {
    it('computes the projected percentage of the quota (may exceed 100)', () => {
        expect(computeProjectionQuotaPercent(60 * GIB, 50)).toBe(120);
        expect(computeProjectionQuotaPercent(25 * GIB, 50)).toBe(50);
    });

    it('returns null when the quota is unset', () => {
        expect(computeProjectionQuotaPercent(60 * GIB, null)).toBeNull();
    });
});
