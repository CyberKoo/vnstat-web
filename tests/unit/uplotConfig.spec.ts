import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import type uPlot from 'uplot';

import RealTimeLine from '@/components/live/RealTimeLine.vue';
import * as uplotConfig from '@/composables/uplotConfig';
import { i18n } from '@/plugins/i18n';
import type { ReplayWindow } from '@/composables/replayWindow';
import type { TimedNetworkStats } from '@/types/network';

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

describe('localized chart times with unchanged data', () => {
    const originalLocale = i18n.global.locale.value;
    let wrapper: VueWrapper | undefined;

    afterEach(() => {
        wrapper?.unmount();
        wrapper = undefined;
        i18n.global.locale.value = originalLocale;
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it.each([false, true])(
        'refreshes real uPlot axis caches and a pinned tooltip (replay = %s)',
        async (replayMode) => {
            i18n.global.locale.value = 'zh-CN';
            // Keep the real uPlot lifecycle/axis cache; stub only the unavailable canvas drawing APIs.
            const fillText = vi.fn();
            const noop = () => {};
            const ctx = new Proxy(
                {
                    fillText,
                    measureText: (text: string) => ({ width: text.length * 6 }),
                    createLinearGradient: () => ({ addColorStop: noop }),
                },
                { get: (target, key) => Reflect.get(target, key) ?? noop },
            );
            vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
                ctx as unknown as CanvasRenderingContext2D,
            );
            vi.stubGlobal(
                'Path2D',
                class {
                    constructor() {
                        return new Proxy(this, { get: () => noop });
                    }
                },
            );
            // No animation callbacks or new samples are needed for the language refresh.
            const requestFrame = vi.fn(() => 1);
            vi.stubGlobal('requestAnimationFrame', requestFrame);
            vi.stubGlobal('cancelAnimationFrame', vi.fn());
            vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
                x: 0,
                y: 0,
                top: 0,
                left: 0,
                bottom: 300,
                right: 600,
                width: 600,
                height: 300,
                toJSON: () => ({}),
            });

            let plot!: uPlot;
            const realBuildOpts = uplotConfig.buildOpts;
            const buildSpy = vi.spyOn(uplotConfig, 'buildOpts').mockImplementation((params) => {
                const opts = realBuildOpts(params);
                opts.hooks!.ready!.push((self) => {
                    plot = self;
                });
                return opts;
            });
            const ts = new Date(2026, 9, 5, 13, 2, 3).getTime() / 1e3;
            const replay: ReplayWindow = {
                x: [ts - 60, ts, ts + 60],
                rx: [100, 100, 100],
                tx: [50, 50, 50],
                centerIdx: 1,
                centerTs: ts,
            };
            wrapper = mount(RealTimeLine, {
                props: { latestTraffic: null, isDark: false, replay: replayMode ? replay : null },
                global: { plugins: [i18n, createTestingPinia({ createSpy: vi.fn })] },
            });
            await nextTick();
            await Promise.resolve();
            expect(plot).toBeDefined();
            const timestamp = replayMode ? ts : Date.now() / 1e3;
            await wrapper.setProps({
                latestTraffic: {
                    timestamp: timestamp * 1e3,
                    stats: { rx: { bytespersecond: 100 }, tx: { bytespersecond: 50 } },
                } as TimedNetworkStats,
            });
            await Promise.resolve();
            plot.setCursor({ left: plot.valToPos(timestamp, 'x'), top: 30 });
            const tooltip = () => plot.over.querySelector('.u-tt-time')!.textContent;
            const axisValues = () => (plot.axes[0] as uPlot.Axis & { _values: string[] })._values;

            if (replayMode) {
                expect(axisValues()).toEqual(['13:01', '13:01', '13:02', '13:03']);
                expect(tooltip()).toBe('13:02:03');
            } else {
                expect(axisValues()).toContain('现在');
            }
            const data = plot.data;
            const dataSnapshot = data.map((series) => Array.from(series));
            const min = plot.scales.x.min;
            const max = plot.scales.x.max;
            const setData = vi.spyOn(plot, 'setData');
            const destroy = vi.spyOn(plot, 'destroy');
            const oldTooltip = tooltip();
            fillText.mockClear();

            i18n.global.locale.value = 'en-US';
            await nextTick();
            await Promise.resolve();
            if (replayMode) {
                expect(axisValues()).toEqual(['1:01 PM', '1:01 PM', '1:02 PM', '1:03 PM']);
                expect(tooltip()).toBe('1:02:03 PM');
                expect(fillText).toHaveBeenCalledWith('1:02 PM', expect.any(Number), expect.any(Number));
            } else {
                expect(axisValues()).toContain('now');
                expect(tooltip()).not.toBe(oldTooltip);
                expect(tooltip()).toMatch(/ (AM|PM)$/);
            }
            expect(plot.over.querySelector('.u-axis-label.rx')!.textContent).toBe('RX');
            expect(plot.over.querySelector('.u-axis-label.tx')!.textContent).toBe('TX');
            expect(plot.data).toBe(data);
            expect(plot.data.map((series) => Array.from(series))).toEqual(dataSnapshot);
            expect(plot.scales.x.min).toBe(min);
            expect(plot.scales.x.max).toBe(max);
            expect(setData).not.toHaveBeenCalled();
            expect(destroy).not.toHaveBeenCalled();
            expect(buildSpy).toHaveBeenCalledTimes(1);
            expect(requestFrame).toHaveBeenCalledTimes(1);

            if (replayMode) {
                // SSE received during replay remains buffered and available after the locale switch.
                await wrapper.setProps({ replay: null });
                await Promise.resolve();
                expect(plot.data[0][0]).toBe(timestamp);
                expect(axisValues()).toContain('now');
            }
        },
    );
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
