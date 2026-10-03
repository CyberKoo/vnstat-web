/**
 * Exponential backoff configuration.
 */
export interface BackoffOptions {
    /** Initial reconnect delay in milliseconds, default 1000 */
    initial?: number;
    /** Maximum reconnect delay in milliseconds, default 30000 */
    max?: number;
    /** Exponential factor, default 2 */
    factor?: number;
}

/**
 * Exponential backoff calculator.
 *
 * Each call to `nextDelay()` returns the current delay and multiplies the internal counter by the
 * factor until the maximum is reached. `reset()` restores the initial value.
 *
 * @example
 * ```ts
 * const backoff = new Backoff({ initial: 1000, max: 60000, factor: 2 });
 * backoff.nextDelay(); // 1000
 * backoff.nextDelay(); // 2000
 * backoff.nextDelay(); // 4000
 * backoff.reset();
 * backoff.nextDelay(); // 1000
 * ```
 */
export class Backoff {
    private current: number;

    /** Initial backoff delay */
    readonly initial: number;
    /** Maximum backoff delay */
    readonly max: number;
    /** Backoff factor */
    readonly factor: number;

    constructor(opts: BackoffOptions = {}) {
        this.initial = opts.initial ?? 1000;
        this.max = opts.max ?? 30000;
        this.factor = opts.factor ?? 2;
        this.current = this.initial;
    }

    /**
     * Returns the current delay and increments the internal counter.
     */
    nextDelay(): number {
        const d = this.current;
        this.current = Math.min(this.current * this.factor, this.max);
        return d;
    }

    /**
     * Resets the delay to the initial value.
     */
    reset(): void {
        this.current = this.initial;
    }
}
