/**
 * Responsive breakpoint constants.
 *
 * Sync with `@custom-media` CSS definitions (see `custom-media.css`).
 * There is no tablet middle state: < 1024px always uses mobile mode (including iPad in
 * portrait), >= 1024px uses desktop mode.
 */
export const BREAKPOINTS = {
    /** Mobile max width (exclusive) */
    MOBILE_MAX: 1023,
} as const;
