/**
 * Page visibility pause manager.
 *
 * Intended for long-lived connections such as SSE: it fires the "background expired" callback once the
 * page has been in the background for the given duration, and the "foreground" callback when the page
 * comes back. Returns setup/teardown methods for lifecycle management.
 *
 * @example
 * ```ts
 * const pause = createVisibilityPause(60000, {
 *   onBackgroundExpired: () => closeSSE(),
 *   onForeground: () => reopenSSE(),
 * });
 * pause.setup();
 * // ...
 * pause.teardown();
 * ```
 */
export function createVisibilityPause(
    delayMs: number,
    callbacks: {
        /** Fired once the page has been in the background for longer than delayMs */
        onBackgroundExpired: () => void;
        /** Fired when the page returns to the foreground */
        onForeground: () => void;
    },
) {
    let timer: ReturnType<typeof setTimeout> | null = null;

    function clearTimer() {
        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }
    }

    function onChange() {
        if (document.hidden) {
            // Switched to the background: fire the expiry callback after the given duration
            clearTimer();
            timer = setTimeout(() => {
                if (!document.hidden) return;
                callbacks.onBackgroundExpired();
            }, delayMs);
        } else {
            // Back in the foreground: cancel the pending close and fire the resume callback
            clearTimer();
            callbacks.onForeground();
        }
    }

    return {
        /** Registers the visibilitychange listener */
        setup() {
            document.addEventListener('visibilitychange', onChange);
        },

        /** Removes the visibilitychange listener and clears the timer */
        teardown() {
            document.removeEventListener('visibilitychange', onChange);
            clearTimer();
        },
    };
}
