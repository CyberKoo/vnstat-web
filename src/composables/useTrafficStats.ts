import { computed, type Ref } from 'vue';
import { palette } from '@/config/colors';
import type { TrafficItem } from '@/types/network';
import { formatDecimal } from '@/utils/numbers';

/**
 * Trend calculation result.
 */
export interface TrendResult {
    trendPercent: string;
    trendIcon: string;
    trendType: 'default' | 'success' | 'error';
}

/**
 * Compute the trend (current vs previous period).
 *
 * @param currentTotal Total of the current period
 * @param previousTotal Total of the previous period
 * @returns TrendResult containing the percentage, the arrow icon and the type
 *
 * @example
 * ```ts
 * const trend = computeTrend(500, 1000);
 * // { trendPercent: '-50.0%', trendIcon: '↓', trendType: 'success' }
 * ```
 */
export function computeTrend(currentTotal: number, previousTotal: number): TrendResult {
    if (previousTotal > 0) {
        const diff = ((currentTotal - previousTotal) / previousTotal) * 100;
        return {
            trendPercent: `${diff >= 0 ? '+' : ''}${formatDecimal(diff, 1)}%`,
            trendIcon: diff >= 0 ? '↑' : '↓',
            trendType: diff > 5 ? 'error' : diff < -5 ? 'success' : 'default',
        };
    }
    if (currentTotal > 0) {
        return { trendPercent: '+100%', trendIcon: '↑', trendType: 'error' };
    }
    return { trendPercent: '-', trendIcon: '', trendType: 'default' };
}

/**
 * Reactive computation of the trend color.
 *
 * Returns the semantic color matching trendType:
 * - error → palette.danger (rose too much)
 * - success → neutral muted (fell too much; traffic up/down is neither good nor bad, so no data color is borrowed)
 * - default → palette.accent (normal range)
 *
 * @param trendType Reactive reference to the trend type
 * @returns The computed color value
 */
export function useTrendColor(trendType: Ref<TrendResult['trendType']>) {
    return computed(() => {
        if (trendType.value === 'error') return palette.danger;
        if (trendType.value === 'success') return 'var(--s2-text-muted)';
        return palette.accent;
    });
}

/**
 * Find the peak traffic item.
 *
 * @param items List of traffic data items
 * @returns The peak value and the corresponding item
 *
 * @example
 * ```ts
 * const peak = findPeak(trafficItems);
 * console.log(peak.value, peak.item?.timestamp);
 * ```
 */
export function findPeak(items: TrafficItem[]): {
    value: number;
    item: TrafficItem | null;
} {
    return items.reduce(
        (max, item) => {
            const t = (item.rx ?? 0) + (item.tx ?? 0);
            return t > max.value ? { value: t, item } : max;
        },
        { value: 0, item: null as TrafficItem | null },
    );
}

/**
 * Compute the total bytes (rx + tx).
 *
 * @param items List of traffic data items
 * @returns The total bytes
 */
export function computeTotalBytes(items: TrafficItem[]): number {
    return items.reduce((s, d) => s + (d.rx ?? 0) + (d.tx ?? 0), 0);
}

/**
 * Compute the receive (rx) and send (tx) sums and the combined total separately.
 *
 * @param items List of traffic data items
 * @returns An object containing totalRx, totalTx and total
 */
export function computeRxTxTotals(items: TrafficItem[]): {
    totalRx: number;
    totalTx: number;
    total: number;
} {
    const totalRx = items.reduce((s, d) => s + (d.rx ?? 0), 0);
    const totalTx = items.reduce((s, d) => s + (d.tx ?? 0), 0);
    return { totalRx, totalTx, total: totalRx + totalTx };
}

/**
 * Compute the barPercentage and categoryPercentage of the bar chart.
 *
 * Adjusts the bar width automatically based on the number of data points, to avoid being too crowded
 * or too sparse.
 *
 * @param n Number of data points
 * @returns An object containing barPercentage and categoryPercentage
 */
export function buildBarBase(n: number): {
    barPercentage: number;
    categoryPercentage: number;
} {
    return {
        barPercentage: Math.min(0.95, Math.max(0.4, 36 / (n || 1))),
        categoryPercentage: Math.min(0.9, Math.max(0.6, 42 / (n || 1))),
    };
}
