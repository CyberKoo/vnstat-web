import { computed, type ComputedRef } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ChartData } from 'chart.js';

import type { PeriodDataContext } from '@/composables/usePeriodData';
import { buildDonutData } from '@/composables/useTrafficChart';
import {
    buildCompareWindows,
    computePeriodCompare,
    formatComparePercent,
    COMPARE_WINDOW_LABEL,
    COMPARE_WINDOW_SIZE,
} from '@/composables/usePeriodCompare';
import {
    computeTotalBytes,
    computeRxTxTotals,
    computeTrend,
    findPeak,
    useTrendColor,
} from '@/composables/useTrafficStats';
import { formatBytes } from '@/utils/bytes';
import { formatDecimal, formatNumber } from '@/utils/numbers';
import { formatTimestamp } from '@/utils/datetime';
import type { TrafficStatItem } from '@/types/chart';

/** The metric band, trend and side-panel figures of a period page */
export interface PeriodMetrics {
    /** Stat card configuration (for TrafficStatsHeader) */
    statsHeader: ComputedRef<TrafficStatItem[]>;
    /** Donut chart data for the side panel */
    donutData: ComputedRef<ChartData<'doughnut'>>;
    /** RX share shown at the donut center (with the percent sign, e.g. "35.6%") */
    rxPercent: ComputedRef<string>;
}

/**
 * The numbers of a period page: the stat card band, the period-over-period comparison and the donut.
 *
 * All three read the same `statsItems` window, so the total shown on a card and the donut share
 * cannot drift apart. The trend and comparison series stay internal — they exist to pick which
 * cards to show, not to be rendered directly. The side panel deliberately carries no detail rows:
 * they repeated the metric band, and the table owns the breakdown.
 *
 * @param data Shared data context from {@link usePeriodData}
 * @returns Stat cards, donut data and the RX share
 */
export function usePeriodMetrics(data: PeriodDataContext): PeriodMetrics {
    const { period, config, allItems, statsItems } = data;
    const { t } = useI18n();

    // ---- Trend ----

    const trendResult = computed(() => {
        const items = statsItems.value;
        if (items.length < 2) return { trendPercent: '-', trendIcon: '', trendType: 'default' as const };
        const cur = items[items.length - 1];
        const prev = items[items.length - 2];
        return computeTrend((cur?.rx ?? 0) + (cur?.tx ?? 0), (prev?.rx ?? 0) + (prev?.tx ?? 0));
    });
    const trendColor = useTrendColor(computed(() => trendResult.value.trendType));

    /**
     * Period-over-period result: current window vs the equally long preceding window;
     * null when there is not enough data
     */
    const compareResult = computed(() => {
        const windows = buildCompareWindows(allItems.value, null, COMPARE_WINDOW_SIZE[period]);
        if (!windows) return null;
        return computePeriodCompare(windows.current, windows.previous);
    });

    /** Stat cards for empty data */
    function buildEmptyStats(): TrafficStatItem[] {
        const totalLabel =
            config.dataField === 'hour'
                ? t('period.stats.total.hour')
                : t(`period.stats.total.${config.dataField}`, { count: formatNumber(0) }, 0);
        const cards: TrafficStatItem[] = [{ value: '0 B', label: totalLabel, color: 'var(--brand)' }];
        if (config.hasAvgCard) {
            cards.push({ value: '0 B', label: t(`periods.${period}.avg`), color: 'var(--tx)' });
        }
        if (config.hasPeakCard) {
            cards.push({
                value: '-',
                label: t(`periods.${period}.peak`),
                subSep: config.peakValueInSubSpan ? ' ' : ' · ',
                color: 'var(--accent)',
            });
        }
        cards.push({
            value: '-',
            label: t(config.trendLabelKey),
            sub: '0 B',
            subSep: ' · ',
            subNoWrap: true,
            color: trendColor.value,
        });
        // Hide the period-over-period item when the year page has fewer than 2 years; other periods show "-"
        if (period !== 'year') {
            cards.push({
                value: '-',
                label: t('period.stats.compareLabel'),
                sub: t(COMPARE_WINDOW_LABEL[period]),
                subSep: ' ',
                color: 'var(--s2-text-muted)',
            });
        }
        return cards;
    }

    const statsHeader = computed<TrafficStatItem[]>(() => {
        const items = statsItems.value;
        const count = items.length;
        if (!count) return buildEmptyStats();
        const totalBytes = computeTotalBytes(items);
        const peak = findPeak(items);
        const curTotal = (items[items.length - 1]?.rx ?? 0) + (items[items.length - 1]?.tx ?? 0);
        /** Total traffic series of the most recent ≤24 periods, shared by every card sparkline */
        const sparkline = items.slice(-24).map((i) => (i.rx ?? 0) + (i.tx ?? 0));
        const cards: TrafficStatItem[] = [];

        // Total card (the monthly one says "N months" on its own, to avoid ambiguity with "the Nth month")
        const totalLabel =
            config.dataField === 'hour'
                ? t('period.stats.total.hour')
                : t(`period.stats.total.${config.dataField}`, { count: formatNumber(count) }, count);
        cards.push({
            value: formatBytes(totalBytes).formatted,
            label: totalLabel,
            color: 'var(--brand)',
            sparkline,
        });

        // Average card (Daily / Monthly / Yearly)
        if (config.hasAvgCard) {
            cards.push({
                value: formatBytes(Math.round(totalBytes / count)).formatted,
                label: t(`periods.${period}.avg`),
                color: 'var(--tx)',
                sparkline,
            });
        }

        // Peak card (Hourly / Monthly / Yearly)
        if (config.hasPeakCard) {
            const time = peak.item ? formatTimestamp(peak.item.timestamp, t(config.chartDateFormatKey)) : '-';
            // Hourly carries the size in a sub span after a space ("Peak hour 3.2 GiB");
            // monthly / yearly join with "·" instead
            cards.push({
                value: time,
                label: t(`periods.${period}.peak`),
                sub: peak.item ? formatBytes(peak.value).formatted : undefined,
                subSep: config.peakValueInSubSpan ? ' ' : ' · ',
                subNoWrap: true,
                color: 'var(--accent)',
                sparkline,
            });
        }

        // Trend card (a ↗/↘ arrow is prefixed to the value; the color follows trendType: danger red for a
        // sharp rise, neutral muted for a sharp drop — traffic up/down is neither good nor bad)
        // For the month / year periods the trend card covers the same window as the period-over-period card
        // (this month vs last month / this year vs last year), so it is skipped when compare data exists
        const trendDuplicatesCompare = (period === 'month' || period === 'year') && compareResult.value;
        if (!trendDuplicatesCompare) {
            const trendArrow = trendResult.value.trendIcon ? (trendResult.value.trendIcon === '↑' ? '↗' : '↘') : '';
            cards.push({
                value: trendArrow ? `${trendArrow} ${trendResult.value.trendPercent}` : trendResult.value.trendPercent,
                label: t(config.trendLabelKey),
                sub: formatBytes(curTotal).formatted,
                subSep: ' · ',
                subNoWrap: true,
                color: trendColor.value,
                sparkline,
            });
        }

        // Period-over-period card (vs the previous period): traffic up or down is neither good nor bad, so a neutral color is used
        if (compareResult.value) {
            cards.push({
                value: formatComparePercent(compareResult.value.percent),
                label: t('period.stats.compareLabel'),
                sub: t(COMPARE_WINDOW_LABEL[period]),
                subSep: ' ',
                color: 'var(--s2-text-muted)',
            });
        }

        return cards;
    });

    const donutData = computed<ChartData<'doughnut'>>(() => buildDonutData(statsItems.value));

    /** RX share for the donut center (the only side-panel figure — details live in the metric band and the table) */
    const rxPercent = computed(() => {
        const { totalRx, total } = computeRxTxTotals(statsItems.value);
        return total > 0 ? formatDecimal((totalRx / total) * 100, 1) + '%' : '0%';
    });

    return { statsHeader, donutData, rxPercent };
}
