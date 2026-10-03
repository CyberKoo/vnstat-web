/**
 * Presentation-layer contracts shared by chart/stat view models and the components that render
 * them.
 *
 * These types live in `types/` rather than next to their producers on purpose: the option builders
 * in `utils/` and `composables/` and the `.vue` components that render the result are peers that
 * depend on the same contract, so neither side should import from the other. Keeping them here
 * leaves both sides pointing downward at a zero-dependency module.
 */

/**
 * Canvas-rendered theme colours, sampled from the CSS custom properties in `theme-s2.css`.
 *
 * Chart.js paints onto a `<canvas>`, so it cannot participate in the CSS cascade. This interface
 * is the bridge: the values are defined once as tokens and read back here, which keeps the
 * stylesheet the single source of truth for light and dark.
 */
export interface ChartTheme {
    /** Axis tick and legend label colour */
    textColor: string;
    /** Grid line colour */
    gridColor: string;
    /** Opaque background for canvas-drawn chips (e.g. the mean-line label) */
    surfaceColor: string;
    /** Font stack used for canvas-drawn text */
    fontFamily: string;
}

/**
 * Stat metric item configuration.
 */
export interface TrafficStatItem {
    /** Display value */
    value: string | number;
    /** Main label text (plain text; never interpreted as HTML) */
    label: string;
    /** Optional trailing note rendered after `subSep` in the muted sub style (plain text) */
    sub?: string;
    /** Separator placed between label and sub (defaults to a single space) */
    subSep?: string;
    /** Keep label and sub on one line (short values like "4.73 GiB" must not split from their unit) */
    subNoWrap?: boolean;
    /** Optional color value (CSS color string, e.g. '#2d8cf0', 'var(--rx)') */
    color?: string;
    /** Optional mini trend chart data (a numeric series ascending by time, only rendered with 2 or more points) */
    sparkline?: number[];
}
