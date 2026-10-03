import { describe, expect, it } from 'vitest';
import type { TooltipItem } from 'chart.js';

import dayjs from '@/plugins/dayjs';
import { i18n } from '@/plugins/i18n';
import { LOCALE_DAYJS } from '@/config/locales';
import {
    buildYearCards,
    buildYearOverYearChartData,
    buildYearOverYearChartOptions,
    buildYearOverYearModel,
    cumulativeYear,
    yearColor,
} from '@/composables/yearOverYear';
import { formatBytes } from '@/utils/bytes';
import type { TrafficItem } from '@/types/network';
import type { ChartTheme } from '@/types/chart';

const theme: ChartTheme = {
    textColor: '#111',
    gridColor: '#ccc',
    surfaceColor: '#fff',
    fontFamily: 'sans-serif',
};

function item(iso: string, rx: number, tx = 0): TrafficItem {
    const date = dayjs(iso);
    return {
        date: { year: date.year(), month: date.month() + 1, day: date.date() },
        id: date.unix(),
        rx,
        tx,
        timestamp: date.unix(),
    };
}

describe('buildYearOverYearModel', () => {
    it('groups by year and aligns to months 1-12, with months without records as null', () => {
        const model = buildYearOverYearModel([
            item('2025-04-01', 100, 10),
            item('2025-05-01', 200, 20),
            item('2026-01-01', 300, 30),
        ]);
        expect(model.years).toEqual([2025, 2026]);
        expect(model.byYear[0]![3]).toEqual({ rx: 100, tx: 10 });
        expect(model.byYear[0]![4]).toEqual({ rx: 200, tx: 20 });
        expect(model.byYear[0]![0]).toBeNull();
        expect(model.byYear[1]![0]).toEqual({ rx: 300, tx: 30 });
    });

    it('flags in progress when the current year and month has records', () => {
        const now = new Date();
        const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const model = buildYearOverYearModel([item(iso, 5, 5)]);
        expect(model.inProgress).toEqual([0, now.getMonth()]);

        const old = buildYearOverYearModel([item('2020-01-01', 5, 5)]);
        expect(old.inProgress).toBeNull();
    });
});

describe('buildYearOverYearChartData', () => {
    const model = buildYearOverYearModel([item('2025-01-01', 100, 20), item('2026-02-01', 300, 40)]);

    it('bar mode: one dataset per year, with totals aligned by month', () => {
        const data = buildYearOverYearChartData(model, 'bar');
        expect(data.labels).toHaveLength(12);
        expect(data.datasets).toHaveLength(2);
        expect(data.datasets[0]?.label).toBe('2025');
        expect(data.datasets[0]?.data[0]).toBe(120);
        expect(data.datasets[1]?.data[0]).toBeNull();
        expect(data.datasets[1]?.data[1]).toBe(340);
    });

    it('uses the primary color for the latest year and a lighter tone for earlier years', () => {
        expect(yearColor(0)).toContain('100%');
        expect(yearColor(1)).toContain('38%');
    });

    it('cumulative mode: a running total within the year, months without records carry the previous value and are null before the start', () => {
        expect(cumulativeYear([null, 10, null, 5])).toEqual([null, 10, 10, 15]);
        const data = buildYearOverYearChartData(model, 'cumulative');
        expect(data.datasets[0]?.data[0]).toBe(120);
        expect(data.datasets[0]?.data[1]).toBe(120);
        expect(data.datasets[1]?.data[0]).toBeNull();
        expect(data.datasets[1]?.data[1]).toBe(340);
    });

    it('area / cumulative lines bridge the gaps (months without records are null, and not bridging would make the whole line invisible)', () => {
        const area = buildYearOverYearChartData(model, 'area');
        expect(area.datasets[0]).toMatchObject({ type: 'line', spanGaps: true });
    });

    it('bar datasets explicitly override the line properties (no leftovers after the vue-chartjs shallow merge, so switching modes in place does not distort them)', () => {
        const area = buildYearOverYearChartData(model, 'area');
        const bar = buildYearOverYearChartData(model, 'bar');
        // simulate vue-chartjs setDatasets: area -> bar matched by label, then Object.assign(current, next)
        const merged = Object.assign({ ...(area.datasets[0] as object) }, bar.datasets[0]);
        expect(merged).toMatchObject({
            type: 'bar',
            fill: false,
            spanGaps: false,
            tension: 0,
            pointRadius: 0,
            borderWidth: 0,
        });
    });
});

describe('buildYearOverYearChartOptions', () => {
    const model = buildYearOverYearModel([item('2025-02-01', 100, 50), item('2026-02-01', 300, 60)]);
    const chartData = buildYearOverYearChartData(model, 'bar');

    function makeOptions() {
        return buildYearOverYearChartOptions({
            model,
            mode: 'bar',
            chartData,
            theme,
        });
    }

    it('does not stack the year-grouped bars', () => {
        const options = makeOptions();
        expect(options.scales?.x).toMatchObject({ stacked: false });
        expect(options.scales?.y).toMatchObject({ stacked: false });
    });

    it('the tooltip label includes the receive / send breakdown', () => {
        const options = makeOptions();
        const label = options.plugins?.tooltip?.callbacks?.label;
        const text = label?.call(
            {} as never,
            { datasetIndex: 1, dataIndex: 1, dataset: { label: '2026' }, parsed: { y: 360 } } as TooltipItem<'bar'>,
        );
        expect(text).toBe(
            i18n.global.t('chart.yoy.breakdownTip', {
                label: '2026',
                total: formatBytes(360).formatted,
                rx: formatBytes(300).formatted,
                tx: formatBytes(60).formatted,
            }),
        );
    });

    it('the tooltip footer gives the year-over-year figure', () => {
        const options = makeOptions();
        const footer = options.plugins?.tooltip?.callbacks?.footer;
        const lines = footer?.call(
            {} as never,
            [
                { datasetIndex: 0, dataIndex: 1, parsed: { y: 150 } },
                { datasetIndex: 1, dataIndex: 1, parsed: { y: 360 } },
            ] as TooltipItem<'bar'>[],
        ) as string[];
        expect(lines).toContain(i18n.global.t('chart.yoy.changeTip', { year: 2025, percent: '+140.0%' }));
    });
});

describe('buildYearCards', () => {
    it('aggregates the total, monthly average, peak month and windowed year-over-year', () => {
        const model = buildYearOverYearModel([
            item('2025-01-01', 100, 100),
            item('2025-02-01', 300, 100),
            item('2026-01-01', 400, 100),
            item('2026-02-01', 600, 100),
        ]);
        const cards = buildYearCards(model);
        expect(cards).toHaveLength(2);

        expect(cards[0]).toMatchObject({ year: 2025, monthsWithData: 2, total: 600, yoyPercent: null });
        // the peak month label is the localized short month name (dayjs follows the UI locale)
        const uiDayjs = dayjs().locale(LOCALE_DAYJS[i18n.global.locale.value]);
        expect(cards[0]!.peakMonth).toEqual({ label: uiDayjs.date(1).month(1).format('MMM'), value: 400 });
        expect(cards[0]!.monthlyAvg).toBe(300);

        // the latest year window aligns to February: 1200 in 2026 vs 600 in 2025 -> +100%
        expect(cards[1]!.yoyPercent).toBe(100);
        expect(cards[1]!.rxShare).toBeCloseTo(1000 / 1200, 5);
        expect(cards[1]!.monthly).toHaveLength(12);
        expect(cards[1]!.monthly[2]).toBeNull();
    });
});
