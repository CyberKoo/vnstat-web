import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import type uPlot from 'uplot';

import { buildOpts, getColors, rxShare, sideSpan, sideTicks } from '@/composables/uplotConfig';
import type { UplotOverlay } from '@/composables/uplotConfig';

/**
 * sideSpan picks the display span for one direction of the mirrored live chart: the data max plus
 * headroom, rounded up so the span is an exact multiple of a "nice" tick step (m × 10^n,
 * m ∈ {1, 2, 2.5, 5}).
 */
describe('sideSpan', () => {
    it('returns a zero span for empty input', () => {
        expect(sideSpan(0)).toEqual({ span: 0, step: 0 });
        expect(sideSpan(-5)).toEqual({ span: 0, step: 0 });
    });

    it('rounds the span up to a multiple of the step', () => {
        // raw span = 90 / 0.9 = 100 → step = niceCeil(100/3) = 50 → span = 2 × 50
        expect(sideSpan(90)).toEqual({ span: 100, step: 50 });
        // raw = 111.1 → step 50 → span = 3 × 50
        expect(sideSpan(100)).toEqual({ span: 150, step: 50 });
        // raw = 50 → step 20 → span = 3 × 20
        expect(sideSpan(45)).toEqual({ span: 60, step: 20 });
        // sub-unit rates keep nice fractional steps
        expect(sideSpan(0.9)).toEqual({ span: 1, step: 0.5 });
    });

    it('always covers the data max plus headroom with a nice step', () => {
        for (const maxValue of [1, 7, 33, 250, 999, 12_500_000, 0.13]) {
            const { span, step } = sideSpan(maxValue);
            expect(span).toBeGreaterThanOrEqual(maxValue / 0.9 - 1e-9);
            // span is an exact multiple of the step (within float tolerance)
            expect(Math.round(span / step)).toBeCloseTo(span / step, 9);
            // step is m × 10^n with m ∈ {1, 2, 2.5, 5}
            const ratio = step / 10 ** Math.floor(Math.log10(step));
            expect([1, 2, 2.5, 5].some((m) => Math.abs(ratio - m) < 1e-9)).toBe(true);
        }
    });
});

describe('rxShare', () => {
    it('splits evenly when there is no traffic or traffic is equal', () => {
        expect(rxShare(0, 0)).toBe(0.5);
        expect(rxShare(100, 100)).toBe(0.5);
    });

    it('slides with the traffic ratio between the clamps', () => {
        expect(rxShare(60, 40)).toBeCloseTo(0.6);
        expect(rxShare(40, 60)).toBeCloseTo(0.4);
    });

    it('clamps a dominant direction to 3/4 and the quiet one to 1/4', () => {
        expect(rxShare(1000, 1)).toBe(0.75);
        expect(rxShare(1, 1000)).toBe(0.25);
    });

    it('treats the clamp boundaries as inclusive', () => {
        expect(rxShare(300, 100)).toBe(0.75);
        expect(rxShare(100, 300)).toBe(0.25);
    });
});

describe('sideTicks', () => {
    it('returns just the zero line when the span or step is zero', () => {
        expect(sideTicks(0, 0)).toEqual([0]);
        expect(sideTicks(100, 0)).toEqual([0]);
        expect(sideTicks(0, 5)).toEqual([0]);
    });

    it('enumerates every step multiple including both endpoints', () => {
        expect(sideTicks(100, 50)).toEqual([0, 50, 100]);
        expect(sideTicks(150, 50)).toEqual([0, 50, 100, 150]);
        expect(sideTicks(1, 0.5)).toEqual([0, 0.5, 1]);
    });

    it('stops at the last multiple inside the span', () => {
        expect(sideTicks(100, 30)).toEqual([0, 30, 60, 90]);
    });

    it('ends exactly on the span for spans produced by sideSpan', () => {
        for (const maxValue of [1, 45, 90, 100, 250, 12_500_000]) {
            const { span, step } = sideSpan(maxValue);
            const ticks = sideTicks(span, step);
            expect(ticks[0]).toBe(0);
            expect(ticks[ticks.length - 1]).toBeCloseTo(span, 9);
            // sideSpan lands on 2-3 subdivisions, so 3-4 ticks including the zero line
            expect(ticks.length).toBeGreaterThanOrEqual(3);
            expect(ticks.length).toBeLessThanOrEqual(4);
        }
    });
});

describe('touch listener lifecycle', () => {
    const overlay = (): UplotOverlay => ({
        thresholdBps: null,
        replayTs: null,
        replayRx: null,
        replayTx: null,
        rxSpan: 100,
        rxTicks: [0, 100],
        txSpan: 50,
        txTicks: [0, 50],
        yShare: 2 / 3,
    });

    function makeOpts() {
        return buildOpts({
            width: 600,
            height: 300,
            isMobile: false,
            isDark: false,
            colors: getColors(ref(undefined), false),
            formatRate: (v) => `${v}`,
            containerRef: ref(document.createElement('div')),
            windowMs: 60_000,
            getOverlay: overlay,
        });
    }

    /** Minimal stand-in for a uPlot instance: only what the ready/destroy hooks touch. */
    function makeSelf() {
        const root = document.createElement('div');
        const over = document.createElement('div');
        root.appendChild(over);
        return {
            root,
            self: {
                root,
                over,
                setCursor: vi.fn(),
                hooks: {} as Record<string, unknown>,
            } as unknown as uPlot,
        };
    }

    type Hooks = {
        ready?: Array<(self: uPlot) => void>;
        destroy?: Array<() => void>;
    };
    const hooksOf = (opts: uPlot.Options) => opts.hooks as unknown as Hooks;

    /** A touch landing outside the chart: the document itself is not inside the instance root. */
    function touchOutside() {
        document.dispatchEvent(new Event('touchstart'));
    }

    it('parks the cursor on an outside touch and stops listening after destroy', () => {
        const opts = makeOpts();
        const { self } = makeSelf();
        hooksOf(opts).ready!.forEach((h) => h(self));

        touchOutside();
        expect(self.setCursor).toHaveBeenCalledTimes(1);
        expect(self.setCursor).toHaveBeenCalledWith({ left: -10, top: -10 });

        hooksOf(opts).destroy!.forEach((h) => h());
        touchOutside();
        expect(self.setCursor).toHaveBeenCalledTimes(1);
    });

    it('registers no listener when destroy runs before the deferred ready (same-tick double startPlot)', () => {
        const addSpy = vi.spyOn(document, 'addEventListener');
        const removeSpy = vi.spyOn(document, 'removeEventListener');
        try {
            // First startPlot creates B; a second startPlot in the same tick destroys B and creates
            // C; uPlot runs B's ready from a queued microtask only after both calls have finished
            const optsB = makeOpts();
            const { self: selfB } = makeSelf();
            hooksOf(optsB).destroy!.forEach((h) => h()); // B destroyed before its ready fires
            hooksOf(optsB).ready!.forEach((h) => h(selfB)); // B's late ready

            const optsC = makeOpts();
            const { self: selfC } = makeSelf();
            hooksOf(optsC).ready!.forEach((h) => h(selfC));
            hooksOf(optsC).destroy!.forEach((h) => h());

            const touchAdds = addSpy.mock.calls.filter(([type]) => type === 'touchstart').length;
            const touchRemoves = removeSpy.mock.calls.filter(([type]) => type === 'touchstart').length;
            expect(touchAdds).toBe(1); // only the surviving instance C registers
            expect(touchRemoves).toBe(1);

            touchOutside();
            expect(selfB.setCursor).not.toHaveBeenCalled();
            expect(selfC.setCursor).not.toHaveBeenCalled();
        } finally {
            addSpy.mockRestore();
            removeSpy.mockRestore();
        }
    });
});
