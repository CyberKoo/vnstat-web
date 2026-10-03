import type { TrafficItem } from '@/types/network';

/** Maximum number of ranks displayed in the ranking bar chart */
export const CHART_TOP_N = 10;

type TrafficLike = Pick<TrafficItem, 'rx' | 'tx'>;

/** Take the top limit entries by rx+tx in descending order. Returns a new array and does not reorder the input */
export function rankByTotal<T extends TrafficLike>(items: readonly T[], limit = CHART_TOP_N): T[] {
    return items
        .slice()
        .sort((a, b) => (b.rx ?? 0) + (b.tx ?? 0) - ((a.rx ?? 0) + (a.tx ?? 0)))
        .slice(0, limit);
}

/**
 * The peak as a percentage of the total of all entries, kept to one decimal.
 * Returns "0%" for an empty list or when the total is 0.
 */
export function peakSharePercent(items: readonly TrafficLike[]): string {
    if (!items.length) return '0%';
    const totals = items.map((item) => (item.rx ?? 0) + (item.tx ?? 0));
    const total = totals.reduce((sum, value) => sum + value, 0);
    const peak = Math.max(...totals);
    return total > 0 ? ((peak / total) * 100).toFixed(1) + '%' : '0%';
}
