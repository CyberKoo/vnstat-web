import { onActivated, onDeactivated, onMounted, onUnmounted } from 'vue';

/**
 * Options type for the usePoll polling composable
 */
export interface UsePollOptions {
    /** Polling interval (milliseconds), defaults to 60000 */
    intervalMs?: number;
    /** Whether to run once immediately on the first start, defaults to true */
    immediate?: boolean;
    /** Whether an immediate run is allowed when a keep-alive component is activated (defaults to true) */
    immediateOnActivate?: boolean;
    /** Whether overlapping task runs are allowed (defaults to false) */
    allowOverlap?: boolean;
    /** Whether AbortController request cancellation is enabled (defaults to true) */
    enableAbort?: boolean;
    /** Whether pausing on page visibility changes is enabled (defaults to false) */
    enableVisibilityPause?: boolean;
    /** Optional error callback */
    onError?: (error: unknown) => void;
}

/**
 * usePoll controller type
 */
export interface UsePollControl {
    /** Start polling */
    start: () => void;
    /** Stop polling */
    stop: () => void;
}

/**
 * Vue composable polling hook: supports keep-alive, visibility pausing, task drift protection, abort and
 * overlap control.
 *
 * @param task - Async function to run on a schedule; its ctx.signal argument is an AbortSignal so the
 *   task can support cancellation
 * @param options - Configuration options, see UsePollOptions
 * @returns The polling controller object UsePollControl
 *
 * @example
 * const poll = usePoll(async ({signal}) => {
 *   await fetch('/api', {signal});
 * }, { intervalMs: 10000 });
 * // poll.start(), poll.stop()
 */
export function usePoll(
    task: (ctx: { signal: AbortSignal | null }) => Promise<void> | void,
    options: UsePollOptions = {},
): UsePollControl {
    const {
        intervalMs = 60_000,
        immediate = true,
        immediateOnActivate = true,
        allowOverlap = false,
        enableAbort = true,
        enableVisibilityPause = false,
        onError,
    } = options;

    let timer: number | null = null;
    let running = false;
    let started = false;
    let schedulerGen = 0; // Scheduler generation, used to detect stale callbacks

    // Timestamp bookkeeping
    let lastRunAt: number | null = null; // Time the last successful run finished
    let hiddenAt: number | null = null; // Time the page was hidden (used on visibility restore)

    // Abort
    let controller: AbortController | null = null;

    /**
     * Get the current AbortSignal
     */
    function currentSignal(): AbortSignal | null {
        return enableAbort ? (controller?.signal ?? null) : null;
    }

    /**
     * Create a new AbortController, cancelling the previous task
     */
    function newController() {
        if (!enableAbort) return;
        // Cancel the previous task before each new task. The reason must be an AbortError
        // DOMException: fetch rejects with the reason verbatim, and request.ts only treats
        // DOMException AbortError as a silent cancellation.
        controller?.abort(new DOMException('poll:next-run', 'AbortError'));
        controller = new AbortController();
    }

    /**
     * Cancel all tasks
     */
    function abortAll(reason: unknown = new DOMException('poll:abort', 'AbortError')) {
        if (!enableAbort) return;
        controller?.abort(reason);
    }

    /**
     * Clear the timer
     */
    function clearTimer() {
        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }
        schedulerGen++;
    }

    /**
     * Schedule the next run
     */
    function schedule(delay: number) {
        clearTimer();
        const gen = schedulerGen;
        const due = Math.max(0, delay);
        timer = window.setTimeout(async () => {
            await runOnce();
            // Only keep scheduling while this generation is still valid, so a stale callback never
            // overrides a later schedule() call
            if (gen === schedulerGen) {
                schedule(intervalMs);
            }
        }, due);
    }

    /**
     * Schedule the next fixed interval
     */
    function scheduleNextInterval() {
        schedule(intervalMs);
    }

    /**
     * Run the task once
     */
    async function runOnce() {
        if (!allowOverlap && running) {
            return;
        }
        running = true;
        try {
            newController();
            await task({ signal: currentSignal() });
            lastRunAt = Date.now();
        } catch (e) {
            // Distinguish abort errors
            if (isAbortError(e)) {
                // Silent cancellation, not treated as a failure
            } else {
                onError?.(e);
                // Not rethrown by default, to avoid breaking the schedule; handle it in onError if needed
            }
        } finally {
            running = false;
        }
    }

    /**
     * Determine whether the error is an abort error
     */
    function isAbortError(e: unknown) {
        if (typeof e !== 'object' || e === null) return false;

        // DOMException: name === 'AbortError'
        if ('name' in e && (e as { name: unknown }).name === 'AbortError') return true;

        // In some cases the thrown value is the reason that was passed in (its message contains abort)
        if ('message' in e && typeof (e as { message: unknown }).message === 'string') {
            return (e as { message: string }).message.toLowerCase().includes('abort');
        }

        return false;
    }

    /**
     * Start polling
     */
    function start() {
        if (started) {
            return;
        }
        started = true;

        // If visibility pause is enabled and the page is currently hidden, only schedule; do not run immediately
        if (immediate && !(enableVisibilityPause && isHidden())) {
            // Run immediately, then switch to the fixed interval
            runOnce().finally(() => scheduleNextInterval());
        } else {
            scheduleNextInterval();
        }
    }

    /**
     * Stop polling
     */
    function stop() {
        started = false;
        clearTimer();
        abortAll(new DOMException('poll:stopped', 'AbortError'));
    }

    /**
     * keep-alive: deactivate
     */
    function handleDeactivated() {
        // Pause scheduling and cancel in-flight requests
        clearTimer();
        abortAll(new DOMException('poll:deactivated', 'AbortError'));
    }

    /**
     * keep-alive: activate — run the task once immediately so data is fresh when the user returns
     */
    function handleActivated() {
        if (!started) return;
        if (immediateOnActivate) {
            runOnce().finally(() => scheduleNextInterval());
        } else {
            scheduleNextInterval();
        }
    }

    /**
     * Determine whether the page is currently hidden
     */
    function isHidden() {
        return typeof document !== 'undefined' && document.hidden;
    }

    /**
     * Handle the visibility change event
     */
    function onVisibilityChange() {
        if (!enableVisibilityPause) return;
        if (!started) return;

        if (isHidden()) {
            // Page hidden: record the hidden time, pause scheduling, cancel requests
            hiddenAt = Date.now();
            clearTimer();
            abortAll(new DOMException('poll:hidden', 'AbortError'));
        } else {
            // Page visible again: based on how long it was hidden, decide between refreshing now
            // and waiting out the remaining time
            const hiddenDuration = hiddenAt != null ? Date.now() - hiddenAt : 0;
            hiddenAt = null;

            // Hidden for more than one interval → the data may be stale, refresh now
            // Hidden briefly → wait out the remaining time, to avoid frequent requests from quick tab switches
            if (hiddenDuration >= intervalMs) {
                runOnce().finally(() => scheduleNextInterval());
            } else if (lastRunAt != null) {
                const remaining = Math.max(0, intervalMs - (Date.now() - lastRunAt));
                schedule(remaining);
            } else {
                // Never ran successfully: if hidden for more than half an interval, try once now,
                // otherwise fall back to the shortened interval
                if (hiddenDuration >= intervalMs / 2) {
                    runOnce().finally(() => scheduleNextInterval());
                } else {
                    scheduleNextInterval();
                }
            }
        }
    }

    // Bind lifecycle hooks
    onMounted(() => {
        start();
        if (enableVisibilityPause && typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', onVisibilityChange);
        }
    });

    onUnmounted(() => {
        stop();
        if (enableVisibilityPause && typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', onVisibilityChange);
        }
    });

    onActivated(() => {
        handleActivated();
    });
    onDeactivated(() => {
        handleDeactivated();
    });

    return {
        start,
        stop,
    };
}
