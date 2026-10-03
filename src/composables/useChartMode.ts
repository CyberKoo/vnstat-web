import { ref } from 'vue';

/** Chart mode: bar / area / cumulative (running-total area chart) */
export type ChartMode = 'bar' | 'area' | 'cumulative';

/** localStorage persistence key */
const STORAGE_KEY = 's2-chart-mode';

/** The set of valid modes (an invalid persisted value falls back to 'bar') */
const VALID_MODES: readonly string[] = ['bar', 'area', 'cumulative'];

/** Module-level singleton, so TrafficChartPanel and useTrafficPeriod share the same state */
const mode = ref<ChartMode>(readStoredMode());

/**
 * Read the chart mode persisted in localStorage.
 *
 * @returns The persisted mode; 'bar' when the value is invalid or the read fails
 */
function readStoredMode(): ChartMode {
    try {
        const stored = globalThis.localStorage?.getItem(STORAGE_KEY);
        return VALID_MODES.includes(stored ?? '') ? (stored as ChartMode) : 'bar';
    } catch {
        return 'bar';
    }
}

/**
 * Shared composable for the chart mode (bar / area / cumulative).
 *
 * The state is a module-level singleton: the switcher of TrafficChartPanel and the chartData of
 * useTrafficPeriod use the same reactive state, which is also persisted to localStorage (key
 * `s2-chart-mode`).
 * The "cumulative" option is offered on the day / month views only; the other periods fall back to
 * 'bar'.
 *
 * @returns chartMode the reactive state and the setChartMode update function
 */
export function useChartMode() {
    /**
     * Update the chart mode and persist it.
     *
     * @param next The target mode
     */
    function setChartMode(next: ChartMode) {
        if (next === mode.value) return;
        mode.value = next;
        try {
            globalThis.localStorage?.setItem(STORAGE_KEY, next);
        } catch {
            // Keep only the in-memory state when localStorage is unavailable
        }
    }

    return { chartMode: mode, setChartMode };
}
