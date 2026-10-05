import { Backoff, type BackoffOptions } from '@/utils/sse/backoff';
import { ReconnectScheduler } from '@/utils/sse/reconnectScheduler';

/** Reconnect policy configuration */
export interface ReconnectPolicyOptions {
    /** Whether to reconnect automatically, default true */
    autoReconnect?: boolean;
    /** Fixed reconnect delay in milliseconds (only used when exponential backoff is disabled) */
    reconnectDelayMs?: number;
    /** Whether to use exponential backoff, default false */
    useExponentialBackoff?: boolean;
    /** Exponential backoff options */
    backoff?: BackoffOptions;
}

/**
 * Decides *whether* and *when* a dropped SSE connection is retried.
 *
 * This owns the three pieces of retry state that used to be spread across the client: the
 * keep-alive intent (a deliberate `close()` must not be undone by a pending timer), the delay
 * calculation, and the timer itself. The client only has to report "the connection dropped" and
 * "the connection opened", and cannot accidentally schedule a retry past a deliberate close.
 *
 * @example
 * ```ts
 * const policy = new ReconnectPolicy({ useExponentialBackoff: true });
 * policy.onError();                              // schedules a retry
 * policy.onConnected();                          // cancels it and resets the backoff
 * policy.stop();                                 // a deliberate close: no further retries
 * ```
 */
export class ReconnectPolicy {
    private readonly backoff: Backoff;
    private readonly scheduler = new ReconnectScheduler();
    private readonly autoReconnect: boolean;
    private readonly reconnectDelayMs?: number;
    private readonly useExponentialBackoff: boolean;

    /** Whether reconnect stays enabled; a deliberate close clears it */
    private keepAlive = true;

    constructor(opts: ReconnectPolicyOptions = {}) {
        this.autoReconnect = opts.autoReconnect ?? true;
        this.reconnectDelayMs = opts.reconnectDelayMs;
        this.useExponentialBackoff = opts.useExponentialBackoff ?? false;
        this.backoff = new Backoff(opts.backoff);
    }

    /**
     * Computes the delay before the next reconnect.
     *
     * @returns The delay in milliseconds
     */
    computeDelay(): number {
        if (this.useExponentialBackoff) {
            return this.backoff.nextDelay();
        }
        return this.reconnectDelayMs ?? this.backoff.initial;
    }

    /**
     * Reports that the connection dropped, and schedules a retry when one is warranted.
     *
     * Does nothing when auto-reconnect is off or a deliberate close has happened.
     *
     * The delay is computed here and returned rather than exposed separately, so a caller that wants
     * to log the next attempt cannot accidentally consume an extra backoff step by asking for the
     * delay first.
     *
     * @param onReconnect Called when the timer fires and the retry is still wanted
     * @returns The scheduled delay in milliseconds, or null when no retry was scheduled
     */
    onError(onReconnect: () => void): number | null {
        if (!this.autoReconnect || !this.keepAlive) {
            console.warn('[ReconnectPolicy] Auto-reconnect stopped');
            return null;
        }
        const delay = this.computeDelay();
        this.scheduler.schedule(delay, onReconnect);
        return delay;
    }

    /**
     * Reports that the connection opened: cancels any pending retry and resets the backoff, so a
     * later drop starts from the initial delay again.
     */
    onConnected(): void {
        this.scheduler.clear();
        this.backoff.reset();
    }

    /**
     * Cancels a pending retry and stops reconnecting, leaving the delay sequence untouched.
     *
     * Used when the current connection should survive but no further retry is wanted.
     */
    stop(): void {
        this.keepAlive = false;
        this.scheduler.clear();
    }

    /**
     * Re-enables reconnecting after a deliberate stop, leaving the delay sequence untouched.
     *
     * Called on every (re)open — including timer-fired retries — so it must not reset the backoff:
     * resetting here would pin every retry to the initial delay.
     */
    resume(): void {
        this.keepAlive = true;
    }

    /**
     * Cancels a pending retry, resets the backoff to the initial delay, and re-enables
     * reconnecting. Used for an explicit restart, where the delay sequence starts fresh.
     */
    reset(): void {
        this.keepAlive = true;
        this.scheduler.clear();
        this.backoff.reset();
    }

    /** Whether a retry is still allowed */
    get enabled(): boolean {
        return this.keepAlive && this.autoReconnect;
    }

    /** Whether a retry timer is pending */
    get pending(): boolean {
        return this.scheduler.isPending();
    }
}
