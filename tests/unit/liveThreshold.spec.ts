import { describe, expect, it } from 'vitest';

import { buildThresholdMarkers, mbpsToBytesPerSec } from '@/composables/liveThreshold';

describe('mbpsToBytesPerSec', () => {
    it('converts 1 Mbps to 125000 bytes/s (decimal megabits / 8)', () => {
        expect(mbpsToBytesPerSec(1)).toBe(125_000);
    });

    it('converts 100 Mbps to 12.5 MB/s', () => {
        expect(mbpsToBytesPerSec(100)).toBe(12_500_000);
    });

    it('works for fractional thresholds too', () => {
        expect(mbpsToBytesPerSec(0.5)).toBe(62_500);
    });
});

describe('buildThresholdMarkers', () => {
    it('keeps the original value for points above the threshold and returns null for the rest', () => {
        const markers = buildThresholdMarkers([10, 20, 30], 15);
        expect(markers).toEqual([null, 20, 30]);
    });

    it('returns all null when the threshold is off (null)', () => {
        expect(buildThresholdMarkers([10, 20], null)).toEqual([null, null]);
    });

    it('treats a non-positive threshold as off', () => {
        expect(buildThresholdMarkers([10, 20], 0)).toEqual([null, null]);
        expect(buildThresholdMarkers([10, 20], -5)).toEqual([null, null]);
    });

    it('skips null/undefined entries in the input as-is', () => {
        const markers = buildThresholdMarkers([null, 100, undefined], 50);
        expect(markers).toEqual([null, 100, null]);
    });

    it('treats a value exactly at the threshold as not exceeding it (strictly greater only)', () => {
        expect(buildThresholdMarkers([15, 16], 15)).toEqual([null, 16]);
    });
});
