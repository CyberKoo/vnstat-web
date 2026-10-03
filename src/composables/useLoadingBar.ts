import { ref } from 'vue';

/**
 * Global top loading bar service.
 *
 * Module scope so the router guards in `useRouteChrome` and the refresh flow can drive it without
 * threading a component instance through. `<LoadingBarHost>` in `App.vue` renders the state.
 */

export type LoadingBarState = 'idle' | 'loading' | 'error';

const state = ref<LoadingBarState>('idle');

/** Runs after the bar has been shown for a moment, to avoid a flash on instant transitions */
const MIN_VISIBLE_MS = 200;
let shownAt = 0;
let settleTimer: ReturnType<typeof setTimeout> | null = null;

function clearSettle() {
    if (settleTimer) {
        clearTimeout(settleTimer);
        settleTimer = null;
    }
}

/**
 * Imperative loading-bar API.
 *
 * @example
 * ```ts
 * const bar = useLoadingBar();
 * bar.start();
 * try { await load(); bar.finish(); }
 * catch { bar.error(); }
 * ```
 */
export function useLoadingBar() {
    function start() {
        clearSettle();
        state.value = 'loading';
        shownAt = Date.now();
    }

    /** Hide after a minimum on-screen time so a fast transition does not flash the bar */
    function settle(next: LoadingBarState) {
        const elapsed = Date.now() - shownAt;
        const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
        clearSettle();
        settleTimer = setTimeout(() => {
            state.value = next;
            settleTimer = null;
        }, wait);
    }

    return {
        /** Current bar state, rendered by `<LoadingBarHost>` */
        state,
        start,
        finish: () => settle('idle'),
        error: () => settle('error'),
    };
}
