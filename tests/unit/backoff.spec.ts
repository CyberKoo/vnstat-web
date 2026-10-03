import { describe, expect, it } from 'vitest';

import { Backoff } from '@/utils/backoff';

describe('Backoff', () => {
    it('defaults to initial 1000, factor 2 and max 30000', () => {
        const b = new Backoff();
        expect(b.initial).toBe(1000);
        expect(b.max).toBe(30000);
        expect(b.factor).toBe(2);
    });

    it('increases nextDelay by the factor', () => {
        const b = new Backoff({ initial: 100, max: 1000, factor: 2 });
        expect(b.nextDelay()).toBe(100);
        expect(b.nextDelay()).toBe(200);
        expect(b.nextDelay()).toBe(400);
        expect(b.nextDelay()).toBe(800);
    });

    it('caps at the max once it is reached', () => {
        const b = new Backoff({ initial: 100, max: 1000, factor: 2 });
        b.nextDelay(); // 100
        b.nextDelay(); // 200
        b.nextDelay(); // 400
        b.nextDelay(); // 800
        expect(b.nextDelay()).toBe(1000); // capped
        expect(b.nextDelay()).toBe(1000);
    });

    it('reset restores the initial value', () => {
        const b = new Backoff({ initial: 100, max: 1000, factor: 2 });
        b.nextDelay();
        b.nextDelay();
        b.reset();
        expect(b.nextDelay()).toBe(100);
    });

    it('applies custom parameters', () => {
        const b = new Backoff({ initial: 5000, max: 10000, factor: 3 });
        expect(b.nextDelay()).toBe(5000);
        expect(b.nextDelay()).toBe(10000); // 15000 is capped to 10000
    });
});
