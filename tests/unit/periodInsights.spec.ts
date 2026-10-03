import { describe, expect, it } from 'vitest';

import dayjs from '@/plugins/dayjs';
import { i18n } from '@/plugins/i18n';
import { buildPeriodInsights } from '@/composables/usePeriodInsights';
import { projectMonthEnd } from '@/composables/useMonthlyQuota';
import { formatBytes } from '@/utils/bytes';
import type { TrafficItem } from '@/types/network';

/**
 * Resolve the same i18n message key the implementation uses.
 *
 * The migration is incremental: before the new keys land in the message catalogs t() returns the
 * key itself, so asserting against t() of the same key with the same parameters holds both
 * pre-merge (key string on both sides) and post-merge (the real translated message).
 */
function msg(key: string, named?: Record<string, unknown>): string {
    return named ? i18n.global.t(key, named) : i18n.global.t(key);
}

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

/** Build one traffic record for the given hour (local time) */
function makeHour(date: string, hour: number, total: number): TrafficItem {
    const d = dayjs(date).hour(hour);
    return {
        date: { year: d.year(), month: d.month() + 1, day: d.date() },
        id: hour,
        rx: total,
        tx: 0,
        timestamp: d.unix(),
        time: { hour, minute: 0 },
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

describe('buildPeriodInsights - day', () => {
    it('compares the last 7 days and reports the highest day (7 days of data each)', () => {
        const prev = makeDays(dayjs().subtract(7, 'day').format('YYYY-MM-DD'), 7, 1000);
        const recent = makeDays(dayjs().format('YYYY-MM-DD'), 7, 2000);
        recent[recent.length - 1] = makeDay(dayjs().format('YYYY-MM-DD'), 9000);
        const all = [...prev, ...recent];
        const insights = buildPeriodInsights({ period: 'day', items: all, allItems: all });
        expect(insights.length).toBeLessThanOrEqual(2);
        // avg of the last 7 days: six days of 2000 + one day of 9000
        const avg = (6 * 2000 + 9000) / 7;
        expect(insights[0]).toBe(
            msg('period.insights.day.avgWithCompare', {
                days: 7,
                avg: formatBytes(avg, 1).formatted,
                change: '+200.0',
            }),
        );
        expect(insights[1]).toBe(
            msg('period.insights.day.peak', {
                date: dayjs().format(i18n.global.t('common.format.date')),
                size: formatBytes(9000, 1).formatted,
            }),
        );
    });

    it('gives only the daily average without a percentage when there is less than 7+7 days of data', () => {
        const all = makeDays(dayjs().format('YYYY-MM-DD'), 10, 1000);
        const insights = buildPeriodInsights({ period: 'day', items: all, allItems: all });
        expect(insights[0]).toBe(msg('period.insights.day.avgOnly', { days: 7, avg: formatBytes(1000, 1).formatted }));
        expect(insights[0]).not.toContain('%');
    });

    it('returns an empty array for empty data', () => {
        expect(buildPeriodInsights({ period: 'day', items: [], allItems: [] })).toEqual([]);
    });
});

describe('buildPeriodInsights - hour', () => {
    const today = dayjs().format('YYYY-MM-DD');

    it('reports the peak period plus the recent 24h activity (with rate formatting)', () => {
        // 24 hours: 20:00-23:00 are clearly higher than the other hours
        const items: TrafficItem[] = [];
        for (let h = 0; h < 24; h++) {
            items.push(makeHour(today, h, h >= 20 && h <= 23 ? 9000 : 100));
        }
        const formatSpeed = (bps: number) => `${bps.toFixed(0)} B/s`;
        const insights = buildPeriodInsights({ period: 'hour', items, allItems: items, formatSpeed });
        // the peak band covers 20:00-23:00 (36000 of a 38000 total -> 95%)
        const total = 20 * 100 + 4 * 9000;
        expect(insights.length).toBe(2);
        expect(insights[0]).toBe(msg('period.insights.hour.peakBand', { start: '20:00', end: '23:00', share: '95' }));
        expect(insights[1]).toBe(
            msg('period.insights.hour.recentWithSpeed', {
                total: formatBytes(total, 1).formatted,
                speed: formatSpeed(total / (24 * 3600)),
                ratio: '1.0',
            }),
        );
    });

    it('gives single-point wording when there is only one peak hour', () => {
        const items: TrafficItem[] = [];
        for (let h = 0; h < 24; h++) {
            items.push(makeHour(today, h, h === 9 ? 9000 : 100));
        }
        const insights = buildPeriodInsights({ period: 'hour', items, allItems: items });
        // one peak hour at 9:00 (9000 of a 11300 total -> 80%)
        expect(insights[0]).toBe(msg('period.insights.hour.peakSingle', { start: '9:00', share: '80' }));
    });

    it('a 24h window is compared against the full-history average', () => {
        const items: TrafficItem[] = [];
        for (let h = 0; h < 24; h++) items.push(makeHour(today, h, 2000));
        // history holds only low-traffic samples -> ratio > 1 (48000 / 25200 -> 1.9)
        const history: TrafficItem[] = [];
        for (let h = 0; h < 24; h++) history.push(makeHour(dayjs().subtract(2, 'day').format('YYYY-MM-DD'), h, 100));
        const insights = buildPeriodInsights({ period: 'hour', items, allItems: [...history, ...items] });
        expect(insights[1]).toBe(
            msg('period.insights.hour.recent', { total: formatBytes(24 * 2000, 1).formatted, ratio: '1.9' }),
        );
    });
});

describe('buildPeriodInsights - month', () => {
    it('estimates the month-end total from the days elapsed this month', () => {
        const now = dayjs();
        const curMonth = makeDay(now.startOf('month').format('YYYY-MM-DD'), 30000);
        const insights = buildPeriodInsights({ period: 'month', items: [curMonth], allItems: [curMonth] });
        const projection = projectMonthEnd(curMonth.timestamp, 30000);
        expect(projection).not.toBeNull();
        expect(insights[0]).toBe(
            msg('period.insights.month.projection', {
                avg: formatBytes(projection!.dailyAvgBytes, 1).formatted,
                projected: formatBytes(projection!.projectedBytes, 1).formatted,
            }),
        );
    });

    it('gives a monthly summary and the peak month for past months', () => {
        const prevMonth = makeDay(dayjs().subtract(2, 'month').startOf('month').format('YYYY-MM-DD'), 50000);
        const olderMonth = makeDay(dayjs().subtract(3, 'month').startOf('month').format('YYYY-MM-DD'), 30000);
        const items = [olderMonth, prevMonth];
        const insights = buildPeriodInsights({ period: 'month', items, allItems: items });
        const monthLabel = dayjs.unix(prevMonth.timestamp).format(i18n.global.t('period.format.month'));
        expect(insights[0]).toBe(
            msg('period.insights.month.pastTotal', { month: monthLabel, total: formatBytes(50000, 1).formatted }),
        );
        expect(insights[1]).toBe(
            msg('period.insights.month.peak', { month: monthLabel, size: formatBytes(50000, 1).formatted }),
        );
    });
});

describe('buildPeriodInsights - year', () => {
    it('gives a neutral hint when the data is sparse', () => {
        const onlyYear = makeDay('2026-01-01', 5000);
        const insights = buildPeriodInsights({ period: 'year', items: [onlyYear], allItems: [onlyYear] });
        expect(insights).toEqual([msg('period.insights.year.insufficient')]);
    });

    it('compares against the previous year when there are two years of data', () => {
        const y2025 = makeDay('2025-01-01', 8000);
        const y2026 = makeDay('2026-01-01', 10000);
        const insights = buildPeriodInsights({ period: 'year', items: [y2025, y2026], allItems: [y2025, y2026] });
        expect(insights[0]).toBe(
            msg('period.insights.year.compare', {
                year: '2026',
                total: formatBytes(10000, 1).formatted,
                change: '+25.0',
            }),
        );
    });
});
