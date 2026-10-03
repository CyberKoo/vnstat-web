import { describe, expect, it } from 'vitest';
import type { TooltipItem } from 'chart.js';

import dayjs from '@/plugins/dayjs';
import { i18n } from '@/plugins/i18n';
import { PERIOD_CONFIGS } from '@/config/trafficPeriods';
import { GHOST_LABEL, RX_CUMULATIVE_LABEL, buildPeriodChartData } from '@/composables/periodChartData';
import { buildPeriodChartOptions } from '@/composables/periodChartOptions';
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

function optionsFor(
    period: 'hour' | 'day',
    mode: 'bar' | 'area' | 'cumulative',
    items: TrafficItem[],
    allDayItems: TrafficItem[],
) {
    const config = PERIOD_CONFIGS[period];
    const chartData = buildPeriodChartData({
        items,
        allFieldItems: items,
        allDayItems,
        config,
        mode,
        chartDisplayLimit: 12,
    });
    return buildPeriodChartOptions({
        config,
        mode,
        items,
        allDayItems,
        chartData,
        theme,
    });
}

describe('buildPeriodChartOptions', () => {
    it('triggers the tooltip per whole column', () => {
        const options = optionsFor('hour', 'bar', [item('2026-09-28T01:00:00', 10)], []);
        expect(options.interaction).toMatchObject({ mode: 'index', intersect: false });
    });

    it('attaches no click handler in the day and hour views', () => {
        expect(optionsFor('day', 'bar', [item('2026-09-20', 1)], []).onClick).toBeUndefined();
        expect(optionsFor('hour', 'bar', [item('2026-09-28T01:00:00', 1)], []).onClick).toBeUndefined();
    });

    it('cumulative mode tooltip gives both the cumulative and the current period value', () => {
        const row = item('2026-09-01', 40, 7);
        const options = optionsFor('day', 'cumulative', [row], [row]);
        const label = options.plugins?.tooltip?.callbacks?.label;
        const text = label?.call(
            {} as never,
            {
                dataIndex: 0,
                parsed: { y: 100 },
                dataset: { label: i18n.global.t(RX_CUMULATIVE_LABEL) },
            } as TooltipItem<'bar'>,
        );
        expect(text).toBe(
            i18n.global.t('chart.cumulativeTip', {
                label: i18n.global.t(RX_CUMULATIVE_LABEL),
                total: formatBytes(100).formatted,
                current: formatBytes(40).formatted,
            }),
        );
        expect(options.scales?.y1).toBeUndefined();
    });

    it('the day view legend filters out the ghost line, and the overlay lines share the left axis with the bars', () => {
        const days = [item('2026-09-19', 1), item('2026-09-20', 2)];
        const options = optionsFor('day', 'bar', days, days);
        const filter = options.plugins?.legend?.labels?.filter;
        expect(filter?.({ text: i18n.global.t(GHOST_LABEL) } as never, {} as never)).toBe(false);
        expect(filter?.({ text: i18n.global.t('common.rx') } as never, {} as never)).toBe(true);
        expect(options.scales?.y1).toBeUndefined();
    });
});
