import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { computed, defineComponent, h, nextTick, shallowRef } from 'vue';
import type { TooltipItem } from 'chart.js';

import YearCards from '@/components/charts/YearCards.vue';
import BottomCards from '@/components/live/BottomCards.vue';
import InterfaceShareBar from '@/components/overview/InterfaceShareBar.vue';
import { peakSharePercent } from '@/composables/topRanking';
import { useLiveChartOptions } from '@/composables/useLiveChartOptions';
import { formatComparePercent } from '@/composables/usePeriodCompare';
import { computeTrend } from '@/composables/useTrafficStats';
import { buildYearOverYearChartOptions, type YearCard, type YearOverYearModel } from '@/composables/yearOverYear';
import { DAYJS_KEY } from '@/composables/useDayjs';
import dayjs from '@/plugins/dayjs';
import { i18n } from '@/plugins/i18n';
import type { InterfaceSummary, TimedNetworkStats } from '@/types/network';
import { createAdaptiveBarChartOptions } from '@/utils/chartOptions';

vi.mock('@/plugins/chartjs', () => ({
    Bar: { name: 'Bar', render: () => null },
    Doughnut: { name: 'Doughnut', render: () => null },
}));
vi.mock('@/composables/useSpeedFormat', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/composables/useSpeedFormat')>();
    return { useSpeedFormat: () => actual.useSpeedFormat({ speedUnit: 'bits' }) };
});

const originalLocale = i18n.global.locale.value;
const wrappers: VueWrapper[] = [];
const global = { plugins: [i18n], provide: { [DAYJS_KEY as symbol]: dayjs }, stubs: { Bar: true, Doughnut: true } };
const theme = { textColor: '#111', gridColor: '#ccc', surfaceColor: '#fff', fontFamily: 'sans-serif' };

beforeEach(() => {
    i18n.global.locale.value = 'en-US';
});

afterEach(() => {
    wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
    i18n.global.locale.value = originalLocale;
    vi.restoreAllMocks();
});

function sample(): TimedNetworkStats {
    const direction = {
        ratestring: '1 kbit/s',
        bytespersecond: 125,
        packetspersecond: 12345.6,
        bytes: 125,
        packets: 1,
        totalbytes: 125,
        totalpackets: 1,
    };
    return {
        timestamp: 1700000000000,
        stats: { index: 1, seconds: 1, rx: direction, tx: { ...direction, packetspersecond: 2345.7 } },
    };
}

describe('localized number display', () => {
    it('invalidates computed percentages on locale changes without changing their inputs', () => {
        const totals = shallowRef({ current: 1123, previous: 1000 });
        const items = shallowRef([
            { rx: 1, tx: 0 },
            { rx: 2, tx: 0 },
        ]);
        const input = totals.value;
        const rows = items.value;
        const display = computed(() => ({
            trend: computeTrend(totals.value.current, totals.value.previous),
            increase: formatComparePercent(12.3),
            decrease: formatComparePercent(-12),
            unchanged: formatComparePercent(0),
            peak: peakSharePercent(items.value),
        }));

        expect(display.value).toMatchObject({
            trend: { trendPercent: '+12.3%', trendIcon: '↑', trendType: 'error' },
            increase: '↑ +12.3%',
            decrease: '↓ -12.0%',
            unchanged: '→ 0.0%',
            peak: '66.7%',
        });
        i18n.global.locale.value = 'de-DE';
        expect(display.value).toMatchObject({
            trend: { trendPercent: '+12,3%', trendIcon: '↑', trendType: 'error' },
            increase: '↑ +12,3%',
            decrease: '↓ -12,0%',
            unchanged: '→ 0,0%',
            peak: '66,7%',
        });
        expect(totals.value).toBe(input);
        expect(items.value).toBe(rows);
        expect(formatComparePercent(null)).toBe('-');
        expect(peakSharePercent([])).toBe('0%');
    });

    it('updates share legend and aria decimals while leaving percentage widths valid', async () => {
        const interfaces: InterfaceSummary[] = [1, 2].map((rx, index) => ({
            name: `eth${index}`,
            alias: '',
            total: { rx, tx: 0 },
            todayRx: 0,
            todayTx: 0,
            updatedTimestamp: 0,
        }));
        const wrapper = mount(InterfaceShareBar, { props: { interfaces }, global });
        wrappers.push(wrapper);
        const widths = () => wrapper.findAll('.ov-share-seg').map((seg) => (seg.element as HTMLElement).style.width);
        const before = widths();
        expect(wrapper.find('.ov-share-pct').text()).toBe('33.3%');
        expect(wrapper.find('.ov-share-bar').attributes('aria-label')).toBe('eth0 33.3%, eth1 66.7%');
        expect(before.map((width) => Number.parseFloat(width))).toEqual([(1 / 3) * 100, (2 / 3) * 100]);
        before.forEach((width) => expect(width).toMatch(/^\d+(\.\d+)?%$/));

        i18n.global.locale.value = 'de-DE';
        await nextTick();
        expect(wrapper.find('.ov-share-pct').text()).toBe('33,3%');
        expect(wrapper.find('.ov-share-bar').attributes('aria-label')).toBe('eth0 33,3%, eth1 66,7%');
        expect(widths()).toEqual(before);
        expect(wrapper.props('interfaces')).toEqual(interfaces);
    });

    it('updates year-card percentages without grouping years or localizing CSS values', async () => {
        const cards: YearCard[] = [
            {
                year: 2026,
                inProgress: false,
                total: 300,
                rxShare: 0.333,
                monthlyAvg: 150,
                monthsWithData: 2,
                peakMonth: null,
                yoyPercent: 12.3,
                monthly: [100, 200, ...Array<null>(10).fill(null)],
            },
        ];
        const wrapper = mount(YearCards, { props: { cards }, global });
        wrappers.push(wrapper);
        expect(wrapper.find('.s2-year-card-yoy').text()).toContain('+12.3%');
        expect(wrapper.find('.s2-year-card-share-label').text()).toContain('33.3%');

        i18n.global.locale.value = 'de-DE';
        await nextTick();
        expect(wrapper.find('.s2-year-card-yoy').text()).toContain('+12,3%');
        expect(wrapper.find('.s2-year-card-share-label').text()).toBe('RX 33,3 %');
        expect(wrapper.find('.s2-year-card-year').text()).toBe('2026');
        const width = (wrapper.find('.s2-year-card-share-rx').element as HTMLElement).style.width;
        expect(Number.parseFloat(width)).toBeCloseTo(33.3);
        expect(width).toMatch(/^\d+(\.\d+)?%$/);
        expect((wrapper.find('.s2-year-card-mbar').element as HTMLElement).style.height).toBe('50%');
        expect(wrapper.props('cards')).toEqual(cards);
    });

    it('formats PPS totals, legend and tooltip using app locale rather than browser locale, without a new sample', async () => {
        vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');
        const latest = shallowRef<TimedNetworkStats | null>(sample());
        const receivedSample = latest.value;
        let charts!: ReturnType<typeof useLiveChartOptions>;
        const host = defineComponent({
            setup() {
                charts = useLiveChartOptions(latest, shallowRef(null), shallowRef(null));
                return () =>
                    h(BottomCards, {
                        ppsDonutData: charts.ppsDonutData.value,
                        ppsDonutOptions: charts.ppsDonutOptions,
                        ppsTotal: charts.ppsTotal.value,
                        ppsStats: charts.ppsStats.value,
                        miniBarData: charts.s2MiniBarData.value,
                        miniBarOptions: charts.s2MiniBarOptions,
                        top5: [
                            { timestamp: 1700000000, rx: 2, tx: 1 },
                            { timestamp: 1700000001, rx: 1, tx: 0 },
                        ],
                    });
            },
        });
        const wrapper = mount(host, { global });
        wrappers.push(wrapper);
        const tooltip = () =>
            charts.ppsDonutOptions.plugins?.tooltip?.callbacks?.label?.call(
                {} as never,
                { label: 'RX', parsed: 12345.6 } as TooltipItem<'doughnut'>,
            );
        const widths = () => wrapper.findAll('.s2-top5-seg').map((seg) => (seg.element as HTMLElement).style.width);
        const before = widths();
        expect(charts.ppsTotal.value).toBe('14,691.3');
        expect(wrapper.findAll('.s2-pps-val').map((value) => value.text())).toEqual(['12,345.6', '2,345.7']);
        expect(tooltip()).toContain('12,345.6');
        expect(before.map((width) => Number.parseFloat(width))).toEqual([67, 33, 33.33, 0]);
        before.forEach((width) => expect(width).toMatch(/^\d+(\.\d+)?%$/));

        i18n.global.locale.value = 'de-DE';
        await nextTick();
        expect(new Intl.NumberFormat(navigator.language).format(12345.6)).toBe('12,345.6');
        expect(charts.ppsTotal.value).toBe('14.691,3');
        expect(wrapper.find('.s2-ring-center-val').text()).toBe('14.691,3');
        expect(wrapper.findAll('.s2-pps-val').map((value) => value.text())).toEqual(['12.345,6', '2.345,7']);
        expect(tooltip()).toContain('12.345,6');
        expect(widths()).toEqual(before);
        expect(latest.value).toBe(receivedSample);
    });

    it('localizes chart tooltip decimals with fixed precision while retaining numeric scale settings', () => {
        const options = createAdaptiveBarChartOptions({
            theme,
            data: { labels: ['test'], datasets: [{ label: 'RX', data: [1536] }] },
        });
        const tooltip = () =>
            options.plugins?.tooltip?.callbacks?.label?.call(
                {} as never,
                { dataset: { label: 'RX' }, parsed: { y: 1536 } } as TooltipItem<'bar'>,
            );
        expect(tooltip()).toBe('RX: 1.50 KiB');
        i18n.global.locale.value = 'de-DE';
        expect(tooltip()).toBe('RX: 1,50 KiB');
        expect(options.scales?.y?.ticks).toMatchObject({ stepSize: 1024 });
        expect(options.scales?.y?.ticks?.callback?.call({} as never, 2048, 0, [])).toBe('2 KiB');
    });

    it('localizes year-over-year tooltip percentages while retaining ungrouped years', () => {
        const model: YearOverYearModel = {
            years: [2025, 2026],
            byYear: [[{ rx: 1000, tx: 0 }], [{ rx: 1123, tx: 0 }]],
            inProgress: null,
        };
        const options = buildYearOverYearChartOptions({
            theme,
            model,
            mode: 'bar',
            chartData: { datasets: [] },
        });
        const tooltip = () =>
            options.plugins?.tooltip?.callbacks?.footer?.call(
                {} as never,
                [
                    { dataIndex: 0, datasetIndex: 0, parsed: { y: 1000 } },
                    { dataIndex: 0, datasetIndex: 1, parsed: { y: 1123 } },
                ] as TooltipItem<'bar'>[],
            );
        expect(tooltip()).toEqual([i18n.global.t('chart.yoy.changeTip', { year: 2025, percent: '+12.3%' })]);
        i18n.global.locale.value = 'de-DE';
        expect(tooltip()).toEqual([i18n.global.t('chart.yoy.changeTip', { year: 2025, percent: '+12,3%' })]);
        expect(String(tooltip())).toContain('2025');
        expect(String(tooltip())).not.toContain('2.025');
    });
});
