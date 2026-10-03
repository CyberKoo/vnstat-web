/**
 * The vnstat-web design palette - the single source of truth for colors.
 *
 * Every component, chart and view must reference this file;
 * multiple files maintaining their own hard-coded color values are not allowed.
 */
export const palette = {
    /** Brand primary color - interactive elements such as buttons, active states, links and
     * sliders (kept decoupled from the data colors) */
    brand: '#7c5cff',
    brandHover: '#9178ff',
    brandPressed: '#6a4ae8',
    brandBg: 'rgba(124, 92, 255, 0.10)',
    brandSoft: 'rgba(124, 92, 255, 0.06)',

    /** Received traffic (RX) */
    rx: '#4c6fff',
    rxBg: 'rgba(76, 111, 255, 0.10)',
    rxSoft: 'rgba(76, 111, 255, 0.06)',

    /** Sent traffic (TX) */
    tx: '#0c9450',
    txBg: 'rgba(12, 148, 80, 0.10)',
    txSoft: 'rgba(12, 148, 80, 0.06)',

    /** Accent color - trend lines, comparison lines, peak markers */
    accent: '#b46900',
    accentBg: 'rgba(180, 105, 0, 0.10)',

    /** Semantic colors */
    danger: '#f04438',
    success: '#0c9450',

    /** Extended categorical colors - multi-interface comparison, donut charts, heatmap scales */
    purple: '#8b5cf6',
    cyan: '#06b6d4',
    pink: '#ec4899',

    /** Sparkline - uses the RX data color */
    sparkline: '#4c6fff',
    sparklineBg: 'rgba(76, 111, 255, 0.10)',
} as const;

export type PaletteColor = keyof typeof palette;
