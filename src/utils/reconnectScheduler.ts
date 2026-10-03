/**
 * Reconnect timer scheduler.
 *
 * Wraps setTimeout management (create, clear, state query)
 * so callers avoid touching the native timer API directly.
 *
 * @example
 * ```ts
 * const scheduler = new ReconnectScheduler();
 * scheduler.schedule(2000, () => openConnection());
 * // ...
 * scheduler.clear(); // Cancel a reconnect that has not run yet
 * ```
 */
export class ReconnectScheduler {
    private timer: ReturnType<typeof setTimeout> | null = null;

    /**
     * Schedules a delayed execution.
     *
     * Any already pending timer is cleared automatically.
     *
     * @param delay Delay in milliseconds
     * @param fn Callback function
     */
    schedule(delay: number, fn: () => void): void {
        this.clear();
        this.timer = setTimeout(() => {
            this.timer = null;
            fn();
        }, delay);
    }

    /**
     * Clears the currently pending timer, if there is one.
     */
    clear(): void {
        if (this.timer !== null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    /**
     * Whether a timer is pending.
     */
    isPending(): boolean {
        return this.timer !== null;
    }
}
