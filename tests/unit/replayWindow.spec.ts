import { describe, expect, it } from 'vitest';

import { buildReplayWindow, findNearestIndex, FIVEMINUTE_INTERVAL_SEC } from '@/composables/replayWindow';
import type { TrafficItem } from '@/types/network';

/** Build one fiveminute record (timestamp in seconds) */
function makeFm(timestamp: number, rx: number, tx: number): TrafficItem {
    return { date: { year: 2026 }, id: timestamp, rx, tx, timestamp };
}

/** Build n records at 5-minute intervals starting from base */
function makeSeries(base: number, n: number, rx = 3000, tx = 1000): TrafficItem[] {
    return Array.from({ length: n }, (_, i) => makeFm(base + i * FIVEMINUTE_INTERVAL_SEC, rx, tx));
}

describe('findNearestIndex', () => {
    it('returns -1 for an empty list', () => {
        expect(findNearestIndex([], 1000)).toBe(-1);
    });

    it('returns the index of the entry on an exact match', () => {
        const items = makeSeries(1000, 5);
        expect(findNearestIndex(items, 1000 + 2 * 300)).toBe(2);
    });

    it('returns the entry closest in time when there is no exact match', () => {
        const items = makeSeries(1000, 5);
        // 100 s before entry 2 (1600) vs 200 s after entry 1 (1300) -> entry 2
        expect(findNearestIndex(items, 1500)).toBe(2);
        // on a tie take the earlier entry
        expect(findNearestIndex(items, 1450)).toBe(1);
    });

    it('clamps to the boundary when the target is before the first or after the last entry', () => {
        const items = makeSeries(1000, 3);
        expect(findNearestIndex(items, 0)).toBe(0);
        expect(findNearestIndex(items, 99999)).toBe(2);
    });
});

describe('buildReplayWindow', () => {
    const base = 1_700_000_000;

    it('returns an empty window for empty data', () => {
        const w = buildReplayWindow([], base);
        expect(w.x).toHaveLength(0);
        expect(w.rx).toHaveLength(0);
        expect(w.centerIdx).toBe(-1);
    });

    it('slices +/- windowSec/2 around the nearest entry used as the center', () => {
        // 21 entries: base to base + 20*300 (a span of 100 minutes)
        const items = makeSeries(base, 21);
        const centerTs = base + 10 * 300;
        const w = buildReplayWindow(items, centerTs, 3600); // +/- 30 minutes -> 6 entries on each side of the center
        expect(w.x).toHaveLength(13);
        expect(w.x[0]).toBe(centerTs - 6 * 300);
        expect(w.x[12]).toBe(centerTs + 6 * 300);
        expect(w.centerIdx).toBe(6);
        expect(w.centerTs).toBe(centerTs);
    });

    it('converts the interval byte count to bytes/s by dividing by 300', () => {
        const items = [makeFm(base, 30000, 15000)];
        const w = buildReplayWindow(items, base);
        expect(w.rx[0]).toBe(100); // 30000 B / 300 s
        expect(w.tx[0]).toBe(50);
    });

    it('still aligns the window with the nearest entry when the target time falls between two entry times', () => {
        const items = makeSeries(base, 21);
        const w = buildReplayWindow(items, base + 10 * 300 + 120, 3600);
        expect(w.centerTs).toBe(base + 10 * 300);
        expect(w.x).toHaveLength(13);
    });

    it('returns only one side when the window center is close to the data boundary', () => {
        const items = makeSeries(base, 10);
        const w = buildReplayWindow(items, base, 7200); // the center is the first entry, there is no data before it
        expect(w.x[0]).toBe(base);
        expect(w.x[w.x.length - 1]).toBe(base + 9 * 300);
        expect(w.centerIdx).toBe(0);
    });

    it('treats missing rx/tx as 0', () => {
        const item = { ...makeFm(base, 0, 0), rx: undefined as unknown as number };
        const w = buildReplayWindow([item], base);
        expect(w.rx[0]).toBe(0);
    });
});
