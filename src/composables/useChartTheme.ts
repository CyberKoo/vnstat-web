import { ref, watch } from 'vue';

import { useThemeStore } from '@/stores/theme';
import type { ChartTheme } from '@/types/chart';

/** Used when the document is unavailable (SSR / unit tests) or a token is missing. */
const FALLBACK: ChartTheme = {
    textColor: '#000000',
    gridColor: 'rgb(194, 194, 194)',
    surfaceColor: '#ffffff',
    fontFamily:
        "'Inter', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif",
};

/** Read one custom property, falling back when it is undefined or blank. */
function token(styles: CSSStyleDeclaration, name: string, fallback: string): string {
    return styles.getPropertyValue(name).trim() || fallback;
}

/** Sample the chart tokens off `<html>`, where both `:root` and `:root.dark` are defined. */
function readChartTheme(): ChartTheme {
    if (typeof window === 'undefined') return FALLBACK;
    const styles = getComputedStyle(document.documentElement);
    return {
        textColor: token(styles, '--s2-chart-text', FALLBACK.textColor),
        gridColor: token(styles, '--s2-chart-grid', FALLBACK.gridColor),
        surfaceColor: token(styles, '--s2-chart-surface', FALLBACK.surfaceColor),
        fontFamily: token(styles, '--font-sans', FALLBACK.fontFamily),
    };
}

/**
 * Theme colours for canvas-rendered charts, re-sampled whenever the app switches light/dark.
 *
 * The watcher is `post`-flushed on purpose: the theme store applies the `.dark` class in a
 * pre-flush effect, so a post-flush read is guaranteed to observe the updated class rather than
 * the outgoing one.
 *
 * @example
 * ```ts
 * const chartTheme = useChartTheme();
 * const options = computed(() => buildOptions({ theme: chartTheme.value }));
 * ```
 */
/**
 * The slice of the theme store this composable reads, narrowed to the one field so callers (and
 * tests) can pass a plain object instead of standing up Pinia.
 */
export type ChartThemeSource = Pick<ReturnType<typeof useThemeStore>, 'isDark'>;

/**
 * @param themeStore Source of the dark-mode flag; defaults to the global theme store
 */
export function useChartTheme(themeStore: ChartThemeSource = useThemeStore()) {
    const theme = ref<ChartTheme>(readChartTheme());

    watch(
        () => themeStore.isDark,
        () => {
            theme.value = readChartTheme();
        },
        { flush: 'post' },
    );

    return theme;
}
