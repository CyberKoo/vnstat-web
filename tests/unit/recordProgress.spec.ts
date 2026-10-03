import { describe, expect, it } from 'vitest';

import { buildRecordProgress } from '@/composables/useRecordProgress';

describe('buildRecordProgress', () => {
    const tops = [
        { rx: 400, tx: 100 }, // 500
        { rx: 2000, tx: 500 }, // 2500 (record)
        { rx: 300, tx: 200 }, // 500
    ];

    it('computes the percentage of the record reached today and the gap', () => {
        const progress = buildRecordProgress(625, tops);
        expect(progress).not.toBeNull();
        expect(progress!.recordBytes).toBe(2500);
        expect(progress!.percent).toBe(25);
        expect(progress!.reached).toBe(false);
        expect(progress!.remainingBytes).toBe(1875);
    });

    it('matching the record today: percent is capped at 100 and remaining is 0', () => {
        const progress = buildRecordProgress(3000, tops)!;
        expect(progress.percent).toBe(100);
        expect(progress.reached).toBe(true);
        expect(progress.remainingBytes).toBe(0);
    });

    it('treats missing rx / tx as 0', () => {
        const progress = buildRecordProgress(100, [{ rx: undefined as unknown as number, tx: 800 }]);
        expect(progress!.recordBytes).toBe(800);
        expect(progress!.percent).toBe(12.5);
    });

    it('returns null when there is no top record', () => {
        expect(buildRecordProgress(625, [])).toBeNull();
    });

    it('returns null when all top records are 0', () => {
        expect(buildRecordProgress(625, [{ rx: 0, tx: 0 }])).toBeNull();
    });
});
