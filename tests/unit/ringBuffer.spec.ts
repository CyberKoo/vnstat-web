import { describe, expect, it } from 'vitest';

import { RingBuffer } from '@/utils/ringBuffer';

describe('RingBuffer', () => {
    it('throws for an invalid capacity', () => {
        expect(() => new RingBuffer(0)).toThrow('capacity must be a positive finite number');
        expect(() => new RingBuffer(-1)).toThrow();
        expect(() => new RingBuffer(Number.NaN)).toThrow();
        expect(() => new RingBuffer(Number.POSITIVE_INFINITY)).toThrow();
    });

    it('push / length / peekBack', () => {
        const buf = new RingBuffer<number>(3);
        expect(buf.length).toBe(0);
        buf.push(1);
        buf.push(2);
        expect(buf.length).toBe(2);
        expect(buf.peekBack()).toBe(2);
    });

    it('peekBack returns undefined on an empty buffer', () => {
        const buf = new RingBuffer<number>(3);
        expect(buf.peekBack()).toBeUndefined();
    });

    it('overwrites the oldest element when full', () => {
        const buf = new RingBuffer<number>(3);
        buf.push(1);
        buf.push(2);
        buf.push(3);
        expect(buf.length).toBe(3);
        buf.push(4);
        expect(buf.length).toBe(3); // size stays at capacity
        expect(buf.peekBack()).toBe(4);
        buf.push(5);
        expect(buf.length).toBe(3);
        expect(buf.peekBack()).toBe(5);
    });

    it('clear empties the buffer', () => {
        const buf = new RingBuffer<number>(3);
        buf.push(1);
        buf.push(2);
        buf.clear();
        expect(buf.length).toBe(0);
        expect(buf.peekBack()).toBeUndefined();
        // usable again after being cleared
        buf.push(9);
        expect(buf.length).toBe(1);
        expect(buf.peekBack()).toBe(9);
    });
});
