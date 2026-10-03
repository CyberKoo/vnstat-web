import { describe, expect, it } from 'vitest';

import dayjs from '@/plugins/dayjs';
import { i18n } from '@/plugins/i18n';
import { PERIOD_CONFIGS } from '@/config/trafficPeriods';
import { buildGhostSeries } from '@/composables/usePeriodCompare';
import {
    AVG_LINE_LABEL,
    GHOST_LABEL,
    LAST_WEEK_LABEL,
    MOVING_AVERAGE_LABEL,
    WEEK_WINDOW,
    buildPeriodChartData,
} from '@/composables/periodChartData';
import type { TrafficItem } from '@/types/network';

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

function labelsOf(data: ReturnType<typeof buildPeriodChartData>): string[] {
    return data.datasets.map((dataset) => dataset.label ?? '');
}

describe('buildPeriodChartData', () => {
    const hours = Array.from({ length: 8 }, (_, i) =>
        item(`2026-09-28T${String(i).padStart(2, '0')}:00:00`, (i + 1) * 10),
    );

    it('bar mode contains only receive and send', () => {
        const data = buildPeriodChartData({
            items: hours.slice(-2),
            allFieldItems: hours,
            allDayItems: [],
            config: PERIOD_CONFIGS.month,
            mode: 'bar',
            chartDisplayLimit: 12,
        });
        expect(labelsOf(data)).toEqual([i18n.global.t('common.rx'), i18n.global.t('common.tx')]);
        expect(data.datasets[0]?.data).toEqual([70, 80]);
    });

    it('area mode uses a filled line', () => {
        const data = buildPeriodChartData({
            items: hours.slice(-1),
            allFieldItems: hours,
            allDayItems: [],
            config: PERIOD_CONFIGS.year,
            mode: 'area',
            chartDisplayLimit: 0,
        });
        expect(data.datasets[0]).toMatchObject({ type: 'line', label: i18n.global.t('common.rx'), fill: true });
    });

    it('bar datasets explicitly override the line properties (no leftovers after the vue-chartjs shallow merge, so switching modes in place does not distort them)', () => {
        const area = buildPeriodChartData({
            items: hours.slice(-2),
            allFieldItems: hours,
            allDayItems: [],
            config: PERIOD_CONFIGS.hour,
            mode: 'area',
            chartDisplayLimit: 4,
        });
        const bar = buildPeriodChartData({
            items: hours.slice(-2),
            allFieldItems: hours,
            allDayItems: [],
            config: PERIOD_CONFIGS.hour,
            mode: 'bar',
            chartDisplayLimit: 4,
        });
        // simulate vue-chartjs setDatasets: area -> bar matched by label, then Object.assign(current, next)
        const merged = Object.assign({ ...(area.datasets[0] as object) }, bar.datasets[0]);
        expect(merged).toMatchObject({ type: 'bar', fill: false, tension: 0, pointRadius: 0, borderWidth: 0 });
    });

    it('cumulative mode returns a running total and does not overlay the average line', () => {
        const data = buildPeriodChartData({
            items: [item('2026-09-01T00:00:00', 1, 4), item('2026-09-01T01:00:00', 2, 5)],
            allFieldItems: hours,
            allDayItems: [],
            config: PERIOD_CONFIGS.hour,
            mode: 'cumulative',
            chartDisplayLimit: 4,
        });
        expect(labelsOf(data)).toEqual([i18n.global.t('chart.rxCumulative'), i18n.global.t('chart.txCumulative')]);
        expect(data.datasets[0]?.data).toEqual([1, 3]);
        expect(data.datasets[1]?.data).toEqual([4, 9]);
    });

    it('the hourly average line looks back over the full array using idx + d * limit', () => {
        const data = buildPeriodChartData({
            items: hours.slice(-4),
            allFieldItems: hours,
            allDayItems: [],
            config: PERIOD_CONFIGS.hour,
            mode: 'bar',
            chartDisplayLimit: 4,
        });
        const avg = data.datasets.find((dataset) => dataset.label === i18n.global.t(AVG_LINE_LABEL));
        // pastCount = 2: indices 0..3 take full-array indices 4..7, totals 50/60/70/80
        expect(avg?.data).toEqual([50, 60, 70, 80]);
    });

    it('draws no average line when there is less than two windows of history', () => {
        const data = buildPeriodChartData({
            items: hours.slice(0, 4),
            allFieldItems: hours.slice(0, 4),
            allDayItems: [],
            config: PERIOD_CONFIGS.hour,
            mode: 'bar',
            chartDisplayLimit: 4,
        });
        expect(labelsOf(data)).toEqual([i18n.global.t('common.rx'), i18n.global.t('common.tx')]);
    });

    it('the day view overlays the moving average, last week and the ghost line', () => {
        const days = Array.from({ length: 10 }, (_, i) => item(`2026-09-${String(i + 1).padStart(2, '0')}`, i + 1));
        const window = days.slice(-3);
        const data = buildPeriodChartData({
            items: window,
            allFieldItems: days,
            allDayItems: days,
            config: PERIOD_CONFIGS.day,
            mode: 'bar',
            chartDisplayLimit: 30,
        });
        expect(labelsOf(data)).toEqual([
            i18n.global.t('common.rx'),
            i18n.global.t('common.tx'),
            i18n.global.t(MOVING_AVERAGE_LABEL, { days: WEEK_WINDOW }),
            i18n.global.t(LAST_WEEK_LABEL),
            i18n.global.t(GHOST_LABEL),
        ]);
        const moving = data.datasets.find(
            (dataset) => dataset.label === i18n.global.t(MOVING_AVERAGE_LABEL, { days: WEEK_WINDOW }),
        );
        expect(moving?.data).toEqual([8, 8.5, 9]);
        const lastWeek = data.datasets.find((dataset) => dataset.label === i18n.global.t(LAST_WEEK_LABEL));
        expect(lastWeek?.data).toEqual([1, 2, 3]);
        const ghost = data.datasets.find((dataset) => dataset.label === i18n.global.t(GHOST_LABEL));
        expect(ghost?.data).toEqual(buildGhostSeries(days, window));
    });
});
