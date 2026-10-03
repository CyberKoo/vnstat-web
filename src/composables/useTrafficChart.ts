import type { ChartData, TooltipItem } from 'chart.js';
import { palette } from '@/config/colors';
import { i18n } from '@/plugins/i18n';
import type { TrafficItem } from '@/types/network';
import { formatBytes } from '@/utils/bytes';

/**
 * Shared doughnut chart configuration.
 *
 * The configuration is exactly the same on all traffic pages (Hourly, Daily, Monthly, Yearly):
 * - responsive
 * - 80% cutout
 * - no legend
 * - custom tooltip display format
 */
export const donutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '78%',
    plugins: {
        legend: { display: false },
        tooltip: {
            callbacks: {
                label: (ctx: TooltipItem<'doughnut'>) => `${ctx.label}: ${formatBytes(ctx.parsed).formatted}`,
            },
        },
    },
};

/**
 * Build the doughnut chart data from traffic data.
 *
 * Computes the RX (receive) and TX (send) totals over all items and produces the data format the
 * doughnut chart needs.
 *
 * @param items List of traffic data items
 * @returns The ChartData<'doughnut'> of the doughnut chart
 *
 * @example
 * ```ts
 * const data = buildDonutData(hourlyItems);
 * ```
 */
export function buildDonutData(items: TrafficItem[]): ChartData<'doughnut'> {
    const rx = items.reduce((s, d) => s + (d.rx ?? 0), 0);
    const tx = items.reduce((s, d) => s + (d.tx ?? 0), 0);
    return {
        labels: [i18n.global.t('common.rx'), i18n.global.t('common.tx')],
        datasets: [
            {
                data: [rx, tx],
                backgroundColor: [palette.rx, palette.tx],
                borderWidth: 0,
            },
        ],
    };
}
