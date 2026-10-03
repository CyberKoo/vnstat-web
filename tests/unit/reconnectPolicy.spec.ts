import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ReconnectPolicy } from '@/utils/reconnectPolicy';

describe('ReconnectPolicy', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        // The policy warns on the console when it refuses to retry
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    describe('delay', () => {
        it('uses the fixed delay when exponential backoff is off', () => {
            const policy = new ReconnectPolicy({ reconnectDelayMs: 2500 });
            expect(policy.computeDelay()).toBe(2500);
            // A fixed delay does not grow
            expect(policy.computeDelay()).toBe(2500);
        });

        it('falls back to the backoff initial delay when no fixed delay is given', () => {
            const policy = new ReconnectPolicy({ backoff: { initial: 700 } });
            expect(policy.computeDelay()).toBe(700);
        });

        it('grows exponentially when enabled, and resets after a successful connect', () => {
            const policy = new ReconnectPolicy({ useExponentialBackoff: true, backoff: { initial: 1000 } });
            expect(policy.computeDelay()).toBe(1000);
            expect(policy.computeDelay()).toBe(2000);
            expect(policy.computeDelay()).toBe(4000);

            policy.onConnected();
            expect(policy.computeDelay()).toBe(1000);
        });
    });

    describe('scheduling', () => {
        it('runs the retry once the delay elapses', () => {
            const policy = new ReconnectPolicy({ reconnectDelayMs: 1000 });
            const retry = vi.fn();

            expect(policy.onError(retry)).toBe(1000);
            expect(retry).not.toHaveBeenCalled();

            vi.advanceTimersByTime(999);
            expect(retry).not.toHaveBeenCalled();

            vi.advanceTimersByTime(1);
            expect(retry).toHaveBeenCalledTimes(1);
        });

        it('replaces a pending retry rather than stacking timers', () => {
            const policy = new ReconnectPolicy({ reconnectDelayMs: 1000 });
            const first = vi.fn();
            const second = vi.fn();

            policy.onError(first);
            policy.onError(second);
            vi.advanceTimersByTime(1000);

            expect(first).not.toHaveBeenCalled();
            expect(second).toHaveBeenCalledTimes(1);
        });

        it('reports a pending retry', () => {
            const policy = new ReconnectPolicy({ reconnectDelayMs: 1000 });
            expect(policy.pending).toBe(false);
            policy.onError(() => {});
            expect(policy.pending).toBe(true);
            vi.advanceTimersByTime(1000);
            expect(policy.pending).toBe(false);
        });

        it('cancels a pending retry when the connection opens', () => {
            const policy = new ReconnectPolicy({ reconnectDelayMs: 1000 });
            const retry = vi.fn();
            policy.onError(retry);

            policy.onConnected();
            vi.advanceTimersByTime(5000);

            expect(retry).not.toHaveBeenCalled();
        });
    });

    describe('gating', () => {
        it('does not retry after a deliberate stop, even for an error that follows', () => {
            const policy = new ReconnectPolicy({ reconnectDelayMs: 1000 });
            const retry = vi.fn();

            policy.stop();
            expect(policy.onError(retry)).toBeNull();
            vi.advanceTimersByTime(5000);

            expect(retry).not.toHaveBeenCalled();
            expect(policy.enabled).toBe(false);
        });

        it('does not retry when auto-reconnect is disabled', () => {
            const policy = new ReconnectPolicy({ autoReconnect: false, reconnectDelayMs: 1000 });
            const retry = vi.fn();

            expect(policy.onError(retry)).toBeNull();
            vi.advanceTimersByTime(5000);
            expect(retry).not.toHaveBeenCalled();
        });

        it('retries again after resume()', () => {
            const policy = new ReconnectPolicy({ reconnectDelayMs: 1000 });
            const retry = vi.fn();

            policy.stop();
            policy.resume();
            expect(policy.enabled).toBe(true);
            expect(policy.onError(retry)).toBe(1000);

            vi.advanceTimersByTime(1000);
            expect(retry).toHaveBeenCalledTimes(1);
        });

        it('resume() re-enables retries without resetting the backoff sequence', () => {
            const policy = new ReconnectPolicy({ useExponentialBackoff: true, backoff: { initial: 1000 } });
            expect(policy.computeDelay()).toBe(1000);

            policy.resume();
            // resume() runs on every (re)open, including timer-fired retries: resetting here
            // would pin every retry to the initial delay
            expect(policy.computeDelay()).toBe(2000);
        });

        it('reset() cancels a pending retry and restarts the backoff from the initial delay', () => {
            const policy = new ReconnectPolicy({ useExponentialBackoff: true, backoff: { initial: 1000 } });
            const retry = vi.fn();

            expect(policy.computeDelay()).toBe(1000);
            policy.onError(retry);

            policy.reset();
            vi.advanceTimersByTime(10_000);

            expect(retry).not.toHaveBeenCalled();
            expect(policy.enabled).toBe(true);
            expect(policy.computeDelay()).toBe(1000);
        });

        it('stop() cancels a pending retry (a deliberate close must not be undone by a timer)', () => {
            const policy = new ReconnectPolicy({ reconnectDelayMs: 1000 });
            const retry = vi.fn();

            policy.onError(retry);
            policy.stop();
            vi.advanceTimersByTime(5000);

            expect(retry).not.toHaveBeenCalled();
        });

        it('stop() on its own leaves the backoff sequence untouched', () => {
            const policy = new ReconnectPolicy({ useExponentialBackoff: true, backoff: { initial: 1000 } });
            expect(policy.computeDelay()).toBe(1000);

            policy.stop();
            // Stopping is not a reset: the next delay continues the sequence
            policy.resume();
            expect(policy.computeDelay()).toBe(2000);
        });
    });

    describe('error recovery', () => {
        it('keeps retrying across repeated drops with a growing delay', () => {
            const policy = new ReconnectPolicy({ useExponentialBackoff: true, backoff: { initial: 1000 } });
            const retry = vi.fn();

            policy.onError(retry);
            vi.advanceTimersByTime(1000);
            expect(retry).toHaveBeenCalledTimes(1);

            policy.onError(retry);
            vi.advanceTimersByTime(2000);
            expect(retry).toHaveBeenCalledTimes(2);

            policy.onError(retry);
            vi.advanceTimersByTime(4000);
            expect(retry).toHaveBeenCalledTimes(3);
        });

        it('a stop() during the backoff sequence prevents the next drop from retrying', () => {
            const policy = new ReconnectPolicy({ reconnectDelayMs: 1000 });
            const retry = vi.fn();

            policy.onError(retry);
            policy.stop();
            policy.onError(retry);
            vi.advanceTimersByTime(5000);

            // The stop cleared the pending timer and blocked the second request
            expect(retry).not.toHaveBeenCalled();
            expect(policy.enabled).toBe(false);
        });
    });
});
