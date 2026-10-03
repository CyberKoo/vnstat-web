import { computed, type ComputedRef } from 'vue';

import { useInterfaceDetailStore } from '@/stores/interfaceDetail';
import { useMobile, useViewportWidth } from '@/composables/useMobile';
import { PERIOD_CONFIGS, type PeriodConfig, type PeriodType } from '@/config/trafficPeriods';
import type { TrafficItem, VnstatInterfaceDetail } from '@/types/network';

/**
 * The data window every period page is built on.
 *
 * This is the bottom of the period feature: it decides *which* rows the rest of the page is
 * allowed to see. Everything else (chart, metrics, table, extras) is a pure function of this
 * context, which is what keeps a single filtering rule for the whole page.
 */
export interface PeriodDataContext {
    /** Period type, see {@link PeriodType} */
    period: PeriodType;
    /** Resolved period configuration */
    config: PeriodConfig;
    /** Full data for the current period (unfiltered) */
    allItems: ComputedRef<TrafficItem[]>;
    /** Data for the current period (identical to allItems; kept as the slice the page renders) */
    viewItems: ComputedRef<TrafficItem[]>;
    /** Full day data (used by the previous compare window and the ghost line) */
    allDayItems: ComputedRef<TrafficItem[]>;
    /** Full month data (drives the year-over-year model) */
    allMonthItems: ComputedRef<TrafficItem[]>;
    /** Current period truncated to the stats window */
    statsItems: ComputedRef<TrafficItem[]>;
    /** Current period truncated to the chart display limit */
    chartItems: ComputedRef<TrafficItem[]>;
    /** How many columns the chart shows (0 = no limit) */
    chartDisplayLimit: ComputedRef<number>;
    /** Statistics window size (used by the stat cards / side panel / donut chart) */
    statsLimit: ComputedRef<number>;
    /** How many rows the table shows */
    tableLimit: ComputedRef<number>;
    /** Detail of the currently selected interface, for top-record comparisons */
    detail: ComputedRef<VnstatInterfaceDetail | null>;
}

/**
 * The slice of the interface detail store this composable reads, narrowed to the one field so
 * callers (and tests) can pass a plain object instead of standing up Pinia.
 */
export type InterfaceDetailSource = Pick<ReturnType<typeof useInterfaceDetailStore>, 'value'>;

/**
 * Selects and window the traffic rows for a period page.
 *
 * Owns the three display limits (chart / stats / table) and consumes the shared viewport state
 * behind them (see useMobile.ts). Consumers take the resulting {@link PeriodDataContext} rather
 * than re-deriving slices, so a limit change is applied everywhere at once.
 *
 * @param period Period type, see {@link PeriodType}
 * @param detailSource Source of the interface detail; defaults to the global store
 * @returns The shared data context for this page
 */
export function usePeriodData(
    period: PeriodType,
    detailSource: InterfaceDetailSource = useInterfaceDetailStore(),
): PeriodDataContext {
    const { isMobile } = useMobile();
    const { viewportWidth } = useViewportWidth();
    const interfaceDetailStore = detailSource;
    const config: PeriodConfig = PERIOD_CONFIGS[period];

    const chartDisplayLimit = computed(() => {
        const limits = config.chartDisplayLimit;
        // 0 = no limit (Yearly)
        if (limits.mobile === 0) return 0;
        if (isMobile.value) return limits.mobile;
        const w = viewportWidth.value;
        if (w >= 1920) return limits.wide;
        if (w >= 1440) return limits.desktop;
        return limits.default;
    });

    const statsLimit = computed(() => {
        // Fixed window takes priority (Hourly: 24)
        if (config.statsWindow > 0) return config.statsWindow;
        // Otherwise follow the chart display limit
        const limit = chartDisplayLimit.value;
        return limit > 0 ? limit : 999;
    });

    const tableLimit = computed(() => {
        const limits = config.tableLimit;
        // 0 = no limit (Yearly)
        if (limits.mobile === 0) return 999;
        return isMobile.value ? limits.mobile : limits.default;
    });

    /** Full data for the current period (for the previous compare window and the ghost line) */
    const allItems = computed<TrafficItem[]>(() => interfaceDetailStore.value?.traffic?.[config.dataField] ?? []);

    /** Data for the current period (what the page renders) */
    const viewItems = allItems;

    const allDayItems = computed<TrafficItem[]>(() => interfaceDetailStore.value?.traffic?.day ?? []);
    const allMonthItems = computed<TrafficItem[]>(() => interfaceDetailStore.value?.traffic?.month ?? []);

    /** Data for the current period, truncated to the stats window (for stats/donut/side panel) */
    const statsItems = computed<TrafficItem[]>(() => viewItems.value.slice(-statsLimit.value));

    /** Chart data (truncated to chartDisplayLimit) */
    const chartItems = computed<TrafficItem[]>(() => {
        const items = viewItems.value;
        const limit = chartDisplayLimit.value;
        return limit > 0 ? items.slice(-limit) : items;
    });

    const detail = computed<VnstatInterfaceDetail | null>(() => interfaceDetailStore.value ?? null);

    return {
        period,
        config,
        allItems,
        viewItems,
        allDayItems,
        allMonthItems,
        statsItems,
        chartItems,
        chartDisplayLimit,
        statsLimit,
        tableLimit,
        detail,
    };
}
