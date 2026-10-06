/**
 * Traffic period types and their configuration.
 *
 * Extracts the differences between the Hourly / Daily / Monthly / Yearly pages into
 * configuration, so the generic TrafficByPeriod.vue page can drive all four.
 *
 * UI copy is deliberately NOT part of this config: display labels live in the
 * message catalogs under `periods.<type>.*` (see `src/locales/zh-CN.ts`) and
 * are fetched with `t()` at render time, so the config only carries behavior.
 * The same goes for the display date/time formats: the config holds the
 * message key (`periods.<type>.format.*`), the format string lives in the
 * catalog so it follows the UI language.
 */

export type PeriodType = 'hour' | 'day' | 'month' | 'year';

/**
 * Message keys of the per-period display date/time formats in the catalogs
 * (see `periods.<type>.format.*`). The format strings themselves live in the
 * message catalogs so they follow the UI language; the config only points at
 * the right key per period.
 */
type PeriodFormatKey = `periods.${PeriodType}.format.${'tooltip' | 'chart' | 'tablePeriod' | 'tableDateLabel'}`;

/**
 * Configuration for a single period.
 */
export interface PeriodConfig {
    /** Name of the pinia store data field */
    dataField: 'hour' | 'day' | 'month' | 'year';

    // ---- chart ----
    /** Tooltip time format message key (`periods.<type>.format.tooltip`) */
    tooltipDateFormatKey: PeriodFormatKey;
    /** Chart label date format message key (`periods.<type>.format.chart`) */
    chartDateFormatKey: PeriodFormatKey;
    /** computeInterval unit */
    intervalUnit: string;

    // ---- display density ----
    chartDisplayLimit: { mobile: number; default: number; desktop: number; wide: number };
    tableLimit: { mobile: number; default: number };

    // ---- stats window (used by the stat cards / side panel / ring chart) ----
    /** Fixed stats window size, 0 = follow chartDisplayLimit */
    statsWindow: number;

    // ---- table ----
    /** Table period column format message key (`periods.<type>.format.tablePeriod`) */
    tablePeriodFormatKey: PeriodFormatKey;
    /** Table date group label format message key (`periods.<type>.format.tableDateLabel`, null = not shown) */
    tableDateLabelFormatKey: PeriodFormatKey | null;

    // ---- feature flags ----
    /** Whether to show the peak period strip */
    hasPeakStrip: boolean;
    /** Whether to show the historical average line (multi-day / multi-period) */
    hasAvgLine: boolean;
    /** Whether to show the week-over-week line (Daily week-over-week only) */
    hasWeekOverWeek: boolean;

    // ---- stat cards ----
    statsColumns: 3 | 4;
    /** Whether there is a "peak" card (label: `periods.<type>.peak`) */
    hasPeakCard: boolean;
    /** Whether the peak card shows its value in a sub-span (Hourly only) */
    peakValueInSubSpan: boolean;
    /** Whether there is an "average" card (label: `periods.<type>.avg`) */
    hasAvgCard: boolean;
    /**
     * Trend card label (current vs previous hour / today vs yesterday / this month vs last
     * month / this year vs last year; key: `periods.<type>.trend`)
     */
    trendLabelKey: 'periods.hour.trend' | 'periods.day.trend' | 'periods.month.trend' | 'periods.year.trend';
}

/**
 * Config map for the four periods.
 */
export const PERIOD_CONFIGS: Record<PeriodType, PeriodConfig> = {
    hour: {
        dataField: 'hour',
        tooltipDateFormatKey: 'periods.hour.format.tooltip',
        chartDateFormatKey: 'periods.hour.format.chart',
        intervalUnit: 'hour',
        chartDisplayLimit: { mobile: 12, default: 24, desktop: 36, wide: 48 },
        statsWindow: 24,
        tableLimit: { mobile: 12, default: 24 },
        tablePeriodFormatKey: 'periods.hour.format.tablePeriod',
        tableDateLabelFormatKey: 'periods.hour.format.tableDateLabel',
        hasPeakStrip: true,
        hasAvgLine: true,
        hasWeekOverWeek: false,
        statsColumns: 3,
        hasPeakCard: true,
        peakValueInSubSpan: true,
        hasAvgCard: false,
        trendLabelKey: 'periods.hour.trend',
    },
    day: {
        dataField: 'day',
        tooltipDateFormatKey: 'periods.day.format.tooltip',
        chartDateFormatKey: 'periods.day.format.chart',
        intervalUnit: 'day',
        chartDisplayLimit: { mobile: 14, default: 30, desktop: 45, wide: 60 },
        statsWindow: 0,
        tableLimit: { mobile: 14, default: 30 },
        tablePeriodFormatKey: 'periods.day.format.tablePeriod',
        tableDateLabelFormatKey: 'periods.day.format.tableDateLabel',
        hasPeakStrip: false,
        hasAvgLine: false,
        hasWeekOverWeek: true,
        statsColumns: 3,
        hasPeakCard: false,
        peakValueInSubSpan: false,
        hasAvgCard: true,
        trendLabelKey: 'periods.day.trend',
    },
    month: {
        dataField: 'month',
        tooltipDateFormatKey: 'periods.month.format.tooltip',
        chartDateFormatKey: 'periods.month.format.chart',
        intervalUnit: 'month',
        chartDisplayLimit: { mobile: 6, default: 12, desktop: 18, wide: 24 },
        statsWindow: 0,
        tableLimit: { mobile: 6, default: 12 },
        tablePeriodFormatKey: 'periods.month.format.tablePeriod',
        tableDateLabelFormatKey: 'periods.month.format.tableDateLabel',
        hasPeakStrip: false,
        hasAvgLine: false,
        hasWeekOverWeek: false,
        statsColumns: 4,
        hasPeakCard: true,
        peakValueInSubSpan: false,
        hasAvgCard: true,
        trendLabelKey: 'periods.month.trend',
    },
    year: {
        dataField: 'year',
        tooltipDateFormatKey: 'periods.year.format.tooltip',
        chartDateFormatKey: 'periods.year.format.chart',
        intervalUnit: 'year',
        chartDisplayLimit: { mobile: 0, default: 0, desktop: 0, wide: 0 }, // 0 = no limit
        statsWindow: 0,
        tableLimit: { mobile: 0, default: 0 }, // 0 = no limit (show everything)
        tablePeriodFormatKey: 'periods.year.format.tablePeriod',
        tableDateLabelFormatKey: null, // no date grouping needed
        hasPeakStrip: false,
        hasAvgLine: false,
        hasWeekOverWeek: false,
        statsColumns: 4,
        hasPeakCard: true,
        peakValueInSubSpan: false,
        hasAvgCard: true,
        trendLabelKey: 'periods.year.trend',
    },
};
