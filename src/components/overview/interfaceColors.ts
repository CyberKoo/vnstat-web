/**
 * Interface category colors — the unified color assignment convention for multi-interface comparison
 * scenarios (total share bars, in-row sparklines).
 *
 * The first 6 interfaces use palette category colors in order; from the 7th on they are derived by mixing tokens
 * (color-mix on the CSS side, the equivalent linear hex blend on the canvas side), with no new color values hardcoded.
 */
import { palette } from '@/config/colors';

/** Base category colors (blue/green/orange/purple/cyan/pink, used in interface order; red is reserved for alert semantics and is not a category color) */
const BASE_COLORS = [palette.rx, palette.tx, palette.accent, palette.purple, palette.cyan, palette.pink] as const;

/** Token mapping for mixed derived colors (the CSS variable forms mirror the palette one to one, see theme-s2.css) */
const TOKENS = [
    { css: 'var(--rx)', hex: palette.rx },
    { css: 'var(--tx)', hex: palette.tx },
    { css: 'var(--accent)', hex: palette.accent },
    { css: 'var(--purple)', hex: palette.purple },
    { css: 'var(--cyan)', hex: palette.cyan },
    { css: 'var(--pink)', hex: palette.pink },
] as const;

/** Token combinations for derived colors (cycled from the 7th interface on, all taken from existing tokens) */
const MIX_COMBOS: ReadonlyArray<readonly [number, number]> = [
    [0, 1],
    [1, 2],
    [2, 3],
    [4, 5],
    [0, 4],
    [1, 5],
    [2, 4],
    [3, 5],
];

/** Mix weight: decreases 15% per cycle with a 30% floor, so derived colors do not clash with each other when there are many interfaces */
function mixWeight(round: number): number {
    return Math.max(30, 60 - round * 15);
}

/** Shared parameters for color derivation: extra is the part of the interface index beyond the base color count */
function mixSpec(extra: number): { weight: number; combo: readonly [number, number] } {
    return {
        weight: mixWeight(Math.floor(extra / MIX_COMBOS.length)),
        combo: MIX_COMBOS[extra % MIX_COMBOS.length],
    };
}

/**
 * Interface category color (CSS color string).
 * The first 4 are taken directly from the palette; the rest are token mixes, e.g. `color-mix(in srgb, var(--rx) 60%, var(--tx))`.
 *
 * @param index Position of the interface in the list (0-based)
 */
export function interfaceCategoryColor(index: number): string {
    if (index < BASE_COLORS.length) return BASE_COLORS[index];
    const { weight, combo } = mixSpec(index - BASE_COLORS.length);
    return `color-mix(in srgb, ${TOKENS[combo[0]].css} ${weight}%, ${TOKENS[combo[1]].css})`;
}

/**
 * Interface category color (hex).
 * Uses the same derivation logic as interfaceCategoryColor, for color scenarios that cannot parse
 * CSS color-mix, such as canvas/uPlot strokes; all values are derived from the palette, with no new colors hardcoded.
 *
 * @param index Position of the interface in the list (0-based)
 */
export function interfaceCategoryHex(index: number): string {
    if (index < BASE_COLORS.length) return BASE_COLORS[index];
    const { weight, combo } = mixSpec(index - BASE_COLORS.length);
    return mixHex(TOKENS[combo[0]].hex, TOKENS[combo[1]].hex, weight);
}

/**
 * Linearly blend two hex colors by weight (equivalent to CSS color-mix(in srgb, a w%, b)).
 *
 * @param a Primary color (hex)
 * @param b Secondary color (hex)
 * @param weight Weight of the primary color (0-100)
 */
function mixHex(a: string, b: string, weight: number): string {
    const pa = parseInt(a.slice(1), 16);
    const pb = parseInt(b.slice(1), 16);
    const w = Math.min(100, Math.max(0, weight)) / 100;
    const chan = (shift: number) => Math.round(((pa >> shift) & 255) * w + ((pb >> shift) & 255) * (1 - w));
    return `#${((chan(16) << 16) | (chan(8) << 8) | chan(0)).toString(16).padStart(6, '0')}`;
}
