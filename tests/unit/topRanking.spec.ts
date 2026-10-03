import { describe, expect, it } from 'vitest';

import { CHART_TOP_N, peakSharePercent, rankByTotal } from '@/composables/topRanking';
import type { TrafficItem } from '@/types/network';

function item(rx: number, tx = 0): TrafficItem {
    return { date: { year: 2026 }, id: rx + tx, rx, tx, timestamp: rx };
}

describe('rankByTotal', () => {
    it('takes the top N by rx+tx in descending order without mutating the input array', () => {
        const items = [item(1, 1), item(10, 0), item(3, 3), item(0, 9)];
        const ranked = rankByTotal(items, 2);
        expect(ranked.map((row) => (row.rx ?? 0) + (row.tx ?? 0))).toEqual([10, 9]);
        expect(items.map((row) => row.rx)).toEqual([1, 10, 3, 0]);
    });

    it('keeps only the chart rank limit by default', () => {
        const items = Array.from({ length: CHART_TOP_N + 3 }, (_, i) => item(i));
        expect(rankByTotal(items)).toHaveLength(CHART_TOP_N);
        expect(rankByTotal(items)[0]?.rx).toBe(CHART_TOP_N + 2);
    });
});

describe('peakSharePercent', () => {
    it('is 0% for an empty list or when the total is 0', () => {
        expect(peakSharePercent([])).toBe('0%');
        expect(peakSharePercent([item(0, 0)])).toBe('0%');
    });

    it('keeps one decimal place for the peak share of the total', () => {
        expect(peakSharePercent([item(50), item(100)])).toBe('66.7%');
    });
});
