import { computed, type ComputedRef } from 'vue';
import { useI18n } from 'vue-i18n';

import type { PeriodDataContext } from '@/composables/usePeriodData';
import { useDayjs } from '@/composables/useDayjs';
import { useSpeedFormat } from '@/composables/useSpeedFormat';
import { useSettingsStore } from '@/stores/settings';
import { buildPeriodInsights } from '@/composables/usePeriodInsights';
import { buildRecordProgress } from '@/composables/useRecordProgress';
import { computeProjectionQuotaPercent, computeQuotaProgress, projectMonthEnd } from '@/composables/useMonthlyQuota';
import { formatBytes } from '@/utils/bytes';
import { formatTimestamp } from '@/utils/datetime';
import type { TrafficItem } from '@/types/network';

/**
 * The slice of the settings store this composable reads, narrowed to the one field so callers (and
 * tests) can pass a plain object instead of standing up Pinia.
 */
export type PeriodQuotaSettings = Pick<ReturnType<typeof useSettingsStore>, 'monthlyQuotaGiB'>;

/** Monthly quota block (month view only) */
export interface PeriodQuotaBlock {
    monthLabel: string;
    used: number;
    isCurrentMonth: boolean;
    projection: ReturnType<typeof projectMonthEnd>;
    quotaSet: boolean;
    progress: ReturnType<typeof computeQuotaProgress>;
    projPercent: number | null;
}

/** Today-vs-all-time-record progress (day view only) */
export type PeriodRecordProgress = ReturnType<typeof buildRecordProgress>;

/** The period-specific extras: insights, quota, record progress and the peak strip */
export interface PeriodExtras {
    /** Auto insights (the single line below the stat band) */
    insights: ComputedRef<ReturnType<typeof buildPeriodInsights>>;
    /** Monthly quota block, month view only */
    quotaBlock: ComputedRef<PeriodQuotaBlock | null>;
    /** Today-vs-record progress, day view only */
    recordProgress: ComputedRef<PeriodRecordProgress | null>;
    /** Peak period strip, hourly view only */
    peakPeriods: ComputedRef<{ time: string; total: string }[]>;
}

/**
 * The per-period extras that hang off the bottom of a period page.
 *
 * Each one is gated on a single period, so they are grouped by *where they render* rather than by
 * period: the page layout stays fixed and each block simply resolves to null when the current period
 * does not use it. A block that used to be inline could never be read without first checking which
 * period it belonged to.
 *
 * @param data Shared data context from {@link usePeriodData}
 * @param settings Source of the quota preference; defaults to the global settings store
 * @returns Insights, quota block, record progress and the peak strip
 */
export function usePeriodExtras(
    data: PeriodDataContext,
    settings: PeriodQuotaSettings = useSettingsStore(),
): PeriodExtras {
    const { period, config, allItems, allDayItems, viewItems, statsItems, detail } = data;
    const { t } = useI18n();
    const dayjs = useDayjs();
    const { formatSpeed } = useSpeedFormat();
    const settingsStore = settings;

    const insights = computed(() =>
        buildPeriodInsights({
            period,
            items: statsItems.value,
            allItems: allItems.value,
            formatSpeed,
        }),
    );

    // Monthly quota block (month view only): quota progress + month-end projection (the projection
    // covers the current month only and is hidden when viewing a past month)
    const quotaBlock = computed<PeriodQuotaBlock | null>(() => {
        if (period !== 'month') return null;
        const cur = allItems.value[allItems.value.length - 1];
        if (!cur) return null;
        const used = (cur.rx ?? 0) + (cur.tx ?? 0);
        const isCurrentMonth = dayjs().isSame(dayjs.unix(cur.timestamp), 'month');
        const projection = isCurrentMonth ? projectMonthEnd(cur.timestamp, used) : null;
        return {
            monthLabel: formatTimestamp(cur.timestamp, t('period.format.month')),
            used,
            isCurrentMonth,
            projection,
            quotaSet: settingsStore.monthlyQuotaGiB != null && settingsStore.monthlyQuotaGiB > 0,
            progress: computeQuotaProgress(used, settingsStore.monthlyQuotaGiB),
            projPercent: projection
                ? computeProjectionQuotaPercent(projection.projectedBytes, settingsStore.monthlyQuotaGiB)
                : null,
        };
    });

    // Today vs all-time record progress (day view only): shown when the latest day record is today
    // and today has traffic
    const recordProgress = computed<PeriodRecordProgress | null>(() => {
        if (period !== 'day') return null;
        const topItems = detail.value?.traffic?.top ?? [];
        const today = allDayItems.value[allDayItems.value.length - 1];
        if (!today || !dayjs().isSame(dayjs.unix(today.timestamp), 'day')) return null;
        const todayTotal = (today.rx ?? 0) + (today.tx ?? 0);
        if (todayTotal <= 0) return null;
        return buildRecordProgress(todayTotal, topItems);
    });

    // Peak period strip (hourly view only)
    const peakPeriods = computed(() => {
        if (!config.hasPeakStrip) return [];
        const last24: TrafficItem[] = viewItems.value.slice(-24);
        if (!last24.length) return [];
        const sorted = [...last24].sort((a, b) => (b.rx ?? 0) + (b.tx ?? 0) - ((a.rx ?? 0) + (a.tx ?? 0)));
        return sorted.slice(0, 3).map((h) => ({
            time: formatTimestamp(h.timestamp, 'HH:00'),
            total: formatBytes((h.rx ?? 0) + (h.tx ?? 0)).formatted,
        }));
    });

    return { insights, quotaBlock, recordProgress, peakPeriods };
}
