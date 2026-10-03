import { describe, expect, it } from 'vitest';

import { minMax } from '@/utils/minMax';

describe('minMax', () => {
    it('returns undefined for an empty array', () => {
        expect(minMax([], (a, b) => a - b)).toEqual({ min: undefined, max: undefined });
    });

    it('returns the same min and max for a single-element array', () => {
        const r = minMax([5], (a, b) => a - b);
        expect(r.min).toBe(5);
        expect(r.max).toBe(5);
    });

    it('handles an array of numbers', () => {
        const r = minMax([4, 1, 8, 5, 2], (a, b) => a - b);
        expect(r.min).toBe(1);
        expect(r.max).toBe(8);
    });

    it('handles an unsorted array', () => {
        const r = minMax([3, 9, 1, 7, 2, 8], (a, b) => a - b);
        expect(r.min).toBe(1);
        expect(r.max).toBe(9);
    });

    it('handles an array of objects with a custom comparator', () => {
        const objs = [{ v: 2 }, { v: 5 }, { v: 1 }];
        const r = minMax(objs, (a, b) => a.v - b.v);
        expect(r.min).toEqual({ v: 1 });
        expect(r.max).toEqual({ v: 5 });
    });

    it('handles negative numbers', () => {
        const r = minMax([-5, 0, -1, 3], (a, b) => a - b);
        expect(r.min).toBe(-5);
        expect(r.max).toBe(3);
    });
});
