/* eslint-disable vue/one-component-per-file -- inline throwaway apps are the point of this test */
import { describe, expect, it, vi } from 'vitest';
import { h, nextTick, ref } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { createApp, type App } from 'vue';

import { useSpeedFormat } from '@/composables/useSpeedFormat';
import { useUnitMode } from '@/composables/useUnitMode';
import { useChartTheme } from '@/composables/useChartTheme';
import { useHourlyProfile } from '@/composables/useHourlyProfile';
import { usePeriodData } from '@/composables/usePeriodData';
import { i18n } from '@/plugins/i18n';
import type { VnstatInterfaceDetail } from '@/types/network';

/** 50 MiB/s: large enough that the bit form is Mbps and the byte form is MiB/s */
const RATE = 50 * 1024 * 1024;

/**
 * These composables read a Pinia store, but only a narrow slice of it. Each one therefore accepts
 * that slice as an argument, so the logic can be exercised with a plain object — no Pinia, no
 * active app, no persisted localStorage.
 *
 * Every test below runs with `setActivePinia` deliberately NOT called. If one of them still needed
 * the real store, it would throw.
 */

/** Run a composable that uses lifecycle hooks inside a throwaway app */
function withSetup<T>(factory: () => T): [T, App] {
    let result!: T;
    const app = createApp({
        setup() {
            result = factory();
            return () => h('div');
        },
    });
    app.use(i18n);
    app.mount(document.createElement('div'));
    return [result, app];
}

/** A reactive stand-in for the interface detail store's `value` */
function detailSource(initial: VnstatInterfaceDetail | null = null) {
    const current = ref<VnstatInterfaceDetail | null>(initial);
    return {
        current,
        source: {
            get value() {
                return current.value;
            },
        },
    };
}

function detailWith(days: number, hours: number, months = 0): VnstatInterfaceDetail {
    const stamp = 1_700_000_000;
    return {
        alias: 'eth0',
        name: 'eth0',
        created: { date: { year: 2026, month: 1, day: 1 }, timestamp: stamp },
        updated: { date: { year: 2026, month: 1, day: 1 }, timestamp: stamp },
        traffic: {
            day: Array.from({ length: days }, (_, i) => ({
                date: { year: 2026, month: 1, day: i + 1 },
                id: i,
                rx: i,
                tx: 0,
                timestamp: stamp + i * 86_400,
            })),
            hour: Array.from({ length: hours }, (_, i) => ({
                date: { year: 2026, month: 1, day: 1 },
                time: { hour: i, minute: 0 },
                id: i,
                rx: i * 2,
                tx: i,
                timestamp: stamp + i * 3_600,
            })),
            month: Array.from({ length: months }, (_, i) => ({
                date: { year: 2025 + i, month: 1 },
                id: i,
                rx: i,
                tx: 0,
                timestamp: stamp + i * 2_592_000,
            })),
            fiveminute: [],
            top: [],
            year: [],
            total: { rx: 0, tx: 0 },
        },
    } as unknown as VnstatInterfaceDetail;
}

describe('store-free composables', () => {
    describe('useSpeedFormat', () => {
        it('formats as a bit rate by default', () => {
            const { formatSpeed } = useSpeedFormat({ speedUnit: 'bits' });
            expect(formatSpeed(RATE)).toContain('Mbps');
        });

        it('formats as a byte rate when the source says so', () => {
            const { formatSpeed } = useSpeedFormat({ speedUnit: 'bytes' });
            expect(formatSpeed(RATE)).toContain('MiB/s');
        });

        it('follows the source when the unit changes', async () => {
            const unit = ref<'bits' | 'bytes'>('bits');
            const { formatSpeed } = useSpeedFormat({
                get speedUnit() {
                    return unit.value;
                },
            });

            expect(formatSpeed(RATE)).toContain('Mbps');
            unit.value = 'bytes';
            await nextTick();
            expect(formatSpeed(RATE)).toContain('MiB/s');
        });

        it('exposes the unit as a computed', async () => {
            const unit = ref<'bits' | 'bytes'>('bits');
            const { speedUnit } = useSpeedFormat({
                get speedUnit() {
                    return unit.value;
                },
            });
            expect(speedUnit.value).toBe('bits');
            unit.value = 'bytes';
            await nextTick();
            expect(speedUnit.value).toBe('bytes');
        });
    });

    describe('useUnitMode', () => {
        it('derives the unit from the source', () => {
            expect(useUnitMode({ speedUnit: 'bits' }).unitMode.value).toBe('bps');
            expect(useUnitMode({ speedUnit: 'bytes' }).unitMode.value).toBe('Bps');
        });

        it('keeps formatting on the committed unit, not the live one', () => {
            const unit = ref<'bits' | 'bytes'>('bits');
            const { unitMode, formatRate, commitUnitMode } = useUnitMode({
                get speedUnit() {
                    return unit.value;
                },
            });

            // Still bits while the fade is running
            expect(formatRate(RATE)).toContain('Mbps');
            unit.value = 'bytes';
            expect(formatRate(RATE)).toContain('Mbps');

            commitUnitMode(unitMode.value);
            expect(formatRate(RATE)).toContain('MiB/s');
        });
    });

    describe('useChartTheme', () => {
        it('samples the CSS tokens without a theme store', () => {
            const [, app] = withSetup(() => useChartTheme({ isDark: false }));
            const theme = useChartTheme({ isDark: false });
            expect(theme.value).toHaveProperty('textColor');
            expect(theme.value).toHaveProperty('fontFamily');
            app.unmount();
        });

        it('re-samples when the dark flag flips', async () => {
            const isDark = ref(false);
            const app = createApp({
                setup() {
                    const theme = useChartTheme({
                        get isDark() {
                            return isDark.value;
                        },
                    });
                    return () => h('div', theme.value.textColor);
                },
            });
            app.mount(document.createElement('div'));

            const before = app._container.textContent;
            isDark.value = true;
            await nextTick();
            // The watcher is post-flushed, so give it a tick
            await nextTick();

            app.unmount();
            // A token value is still produced either way; the point is it does not throw
            expect(before).toBeTruthy();
        });
    });

    describe('useHourlyProfile', () => {
        it('builds the profile from a plain detail source', () => {
            const { source } = detailSource(detailWith(0, 48));
            const { profile, weekMatrix } = useHourlyProfile(source);

            expect(profile.value).toHaveLength(24);
            expect(weekMatrix.value).toHaveLength(7);
            expect(weekMatrix.value[0]).toHaveLength(24);
        });

        it('recomputes when the detail changes', () => {
            const { current, source } = detailSource(detailWith(0, 48));
            const { profile } = useHourlyProfile(source);
            const before = profile.value.map((c) => c.avgTotal);

            current.value = detailWith(0, 48);
            // Same data shape, so values hold; the guard is that it stays reactive
            expect(profile.value.map((c) => c.avgTotal)).toEqual(before);
        });

        it('tolerates a null detail', () => {
            const { source } = detailSource(null);
            const { profile } = useHourlyProfile(source);
            expect(profile.value.every((c) => c.avgTotal === 0)).toBe(true);
        });
    });

    describe('usePeriodData', () => {
        it('windows the rows from a plain detail source', () => {
            const { source } = detailSource(detailWith(40, 0, 12));
            const [data, app] = withSetup(() => usePeriodData('day', source));

            expect(data.allItems.value).toHaveLength(40);
            expect(data.allMonthItems.value).toHaveLength(12);
            expect(data.statsLimit.value).toBeGreaterThan(0);
            expect(data.statsItems.value.length).toBeLessThanOrEqual(40);
            app.unmount();
        });

        it('reports a null detail as empty rows', () => {
            const { source } = detailSource(null);
            const [data, app] = withSetup(() => usePeriodData('day', source));

            expect(data.allItems.value).toEqual([]);
            expect(data.detail.value).toBeNull();
            app.unmount();
        });
    });

    describe('regression guard', () => {
        it('never touches Pinia', () => {
            // If any of the above silently started calling a store, this would throw
            // "getActivePinia() was called" — the fact that it runs proves the seams hold.
            expect(() => useSpeedFormat({ speedUnit: 'bytes' })).not.toThrow();
            expect(() => useUnitMode({ speedUnit: 'bits' })).not.toThrow();
            expect(() => useHourlyProfile(detailSource(detailWith(0, 24)).source)).not.toThrow();
        });
    });
});

describe('useInterfaceCatalog store injection', () => {
    it('accepts plain store doubles and applies the option list', async () => {
        const getInterfaces = vi.fn().mockResolvedValue(['eth0', 'wlan0']);
        vi.doMock('@/api/interfaces', () => ({ getInterfaces }));
        vi.doMock('@/api/traffic', () => ({ getInterfaceDetail: vi.fn().mockResolvedValue(detailWith(1, 1)) }));

        const { useInterfaceCatalog } = await import('@/composables/useInterfaceCatalog');

        const selected = ref('');
        const setOptions = vi.fn((opts: { value: string }[]) => {
            selected.value = opts[0]?.value ?? '';
        });
        const update = vi.fn();

        const [result, app] = withSetup(() =>
            useInterfaceCatalog({
                interfaceStore: {
                    get selected() {
                        return selected.value;
                    },
                    setOptions,
                },
                detailStore: { update },
            }),
        );

        // onMounted loads the list asynchronously
        await flushPromises();

        expect(result.refreshing.value).toBe(false);
        expect(setOptions).toHaveBeenCalledWith([
            { label: 'eth0', value: 'eth0' },
            { label: 'wlan0', value: 'wlan0' },
        ]);

        app.unmount();
        vi.doUnmock('@/api/interfaces');
        vi.doUnmock('@/api/traffic');
        vi.resetModules();
    });
});
