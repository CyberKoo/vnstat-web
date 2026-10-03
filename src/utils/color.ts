/**
 * Converts a hexadecimal color to an rgba string.
 *
 * @param hex Hexadecimal color value; both the #rgb and #rrggbb forms are supported
 * @param alpha Opacity, from 0 to 1
 * @returns The rgba color string; when the input cannot be parsed it is spliced into rgba() as-is
 * and the given opacity is kept
 */
export function hexToRgba(hex: string, alpha: number): string {
    let h = hex.trim().replace(/^#/, '');
    if (h.length === 3) {
        h = h
            .split('')
            .map((c) => c + c)
            .join('');
    }
    const num = parseInt(h, 16);
    if (Number.isNaN(num) || h.length !== 6) {
        return `rgba(${hex}, ${alpha})`;
    }
    const r = (num >> 16) & 0xff;
    const g = (num >> 8) & 0xff;
    const b = num & 0xff;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
