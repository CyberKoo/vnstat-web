import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SseClient } from '@/utils/sseClient';

/** An EventSource stub that records instances and lets a test drive the lifecycle */
class FakeEventSource {
    static instances: FakeEventSource[] = [];
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSED = 2;

    readyState = 0;
    url: string;
    withCredentials: boolean;
    closed = false;

    onopen: ((ev: Event) => void) | null = null;
    onmessage: ((ev: MessageEvent) => void) | null = null;
    onerror: ((ev: Event) => void) | null = null;

    private listeners = new Map<string, EventListener>();

    constructor(url: string | URL, init?: EventSourceInit) {
        this.url = String(url);
        this.withCredentials = init?.withCredentials ?? false;
        FakeEventSource.instances.push(this);
    }

    addEventListener(type: string, listener: EventListener) {
        this.listeners.set(type, listener);
    }

    removeEventListener(type: string, listener: EventListener) {
        if (this.listeners.get(type) === listener) this.listeners.delete(type);
    }

    close() {
        this.closed = true;
        this.readyState = FakeEventSource.CLOSED;
    }

    /** Test helpers: drive the connection lifecycle */
    emitOpen() {
        this.readyState = FakeEventSource.OPEN;
        this.onopen?.(new Event('open'));
    }

    emitMessage(data: unknown) {
        this.onmessage?.({ data } as MessageEvent);
    }

    emitError() {
        this.onerror?.(new Event('error'));
    }

    emitCustom(type: string, ev: MessageEvent) {
        this.listeners.get(type)?.(ev);
    }

    listenerCount() {
        return this.listeners.size;
    }
}

describe('SseClient', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        FakeEventSource.instances = [];
        vi.stubGlobal('EventSource', FakeEventSource);
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    const latest = () => FakeEventSource.instances[FakeEventSource.instances.length - 1]!;

    describe('url building', () => {
        it('joins the prefix and the suffix', () => {
            const sse = new SseClient('/api/v1');
            sse.open('vnstat/interfaces/eth0');
            expect(latest().url).toBe('/api/v1/vnstat/interfaces/eth0');
        });

        it('strips a trailing slash from the prefix and a leading slash from the suffix', () => {
            const sse = new SseClient('/api/v1///');
            sse.open('/vnstat/interfaces/eth0');
            expect(latest().url).toBe('/api/v1/vnstat/interfaces/eth0');
        });

        it('refuses to open without a suffix, and remembers a suffix set beforehand', () => {
            const sse = new SseClient('/api');
            expect(() => sse.open()).toThrow(/urlSuffix is not set/);

            sse.setUrlSuffix('stream');
            expect(() => sse.open()).not.toThrow();
            expect(sse.getFullUrl()).toBe('/api/stream');
        });

        it('returns null for the full url when no suffix is set', () => {
            expect(new SseClient('/api').getFullUrl()).toBeNull();
        });
    });

    describe('connection state', () => {
        it('passes withCredentials through, defaulting to true', () => {
            new SseClient('/api').open('s');
            expect(latest().withCredentials).toBe(true);

            new SseClient('/api', { withCredentials: false }).open('s2');
            expect(latest().withCredentials).toBe(false);
        });

        it('ignores a second open() while already connecting', () => {
            const sse = new SseClient('/api');
            sse.open('s');
            sse.open('s');
            expect(FakeEventSource.instances).toHaveLength(1);
        });

        it('reports whether the connection is open', () => {
            const sse = new SseClient('/api');
            expect(sse.isOpen()).toBe(false);

            sse.open('s');
            expect(sse.isOpen()).toBe(false); // still connecting

            latest().emitOpen();
            expect(sse.isOpen()).toBe(true);
        });

        it('dispatches onMessage to the handler', () => {
            const onMessage = vi.fn();
            const sse = new SseClient('/api', { onMessage });
            sse.open('s');
            latest().emitMessage('payload');
            expect(onMessage).toHaveBeenCalledTimes(1);
        });
    });

    describe('reconnect', () => {
        it('reconnects after an error, honouring the fixed delay', () => {
            const sse = new SseClient('/api', { reconnectDelayMs: 2000 });
            sse.open('s');
            const first = latest();

            first.emitError();
            expect(FakeEventSource.instances).toHaveLength(1);

            vi.advanceTimersByTime(2000);
            expect(FakeEventSource.instances).toHaveLength(2);
        });

        it('resets the backoff after a successful open', () => {
            const sse = new SseClient('/api', { useExponentialBackoff: true, backoff: { initial: 1000 } });
            sse.open('s');
            latest().emitError();
            vi.advanceTimersByTime(1000);
            expect(FakeEventSource.instances).toHaveLength(2);

            latest().emitOpen();
            // Next drop starts from the initial delay again, not 2000
            latest().emitError();
            vi.advanceTimersByTime(1000);
            expect(FakeEventSource.instances).toHaveLength(3);
        });

        it('grows the delay across consecutive failed reconnect attempts', () => {
            const sse = new SseClient('/api', {
                useExponentialBackoff: true,
                backoff: { initial: 1000, max: 60_000 },
            });
            sse.open('s');

            // First retry after 1000 ms
            latest().emitError();
            vi.advanceTimersByTime(999);
            expect(FakeEventSource.instances).toHaveLength(1);
            vi.advanceTimersByTime(1);
            expect(FakeEventSource.instances).toHaveLength(2);

            // The retry itself went through open(): that must not reset the backoff,
            // so the second retry waits 2000 ms
            latest().emitError();
            vi.advanceTimersByTime(1999);
            expect(FakeEventSource.instances).toHaveLength(2);
            vi.advanceTimersByTime(1);
            expect(FakeEventSource.instances).toHaveLength(3);

            // Third retry waits 4000 ms
            latest().emitError();
            vi.advanceTimersByTime(3999);
            expect(FakeEventSource.instances).toHaveLength(3);
            vi.advanceTimersByTime(1);
            expect(FakeEventSource.instances).toHaveLength(4);
        });

        it('restart() cancels a pending reconnect and starts the backoff fresh', () => {
            const sse = new SseClient('/api', { useExponentialBackoff: true, backoff: { initial: 1000 } });
            sse.open('s');
            latest().emitError(); // reconnect pending in 1000 ms; next delay would be 2000

            sse.restart();
            expect(FakeEventSource.instances).toHaveLength(2);

            // The pending timer was cancelled: no extra connection appears
            vi.advanceTimersByTime(5000);
            expect(FakeEventSource.instances).toHaveLength(2);

            // A drop after the restart waits the initial delay again, not 2000
            latest().emitError();
            vi.advanceTimersByTime(1000);
            expect(FakeEventSource.instances).toHaveLength(3);
        });

        it('does not reconnect after close()', () => {
            const sse = new SseClient('/api', { reconnectDelayMs: 1000 });
            sse.open('s');
            sse.close();

            latest().emitError();
            vi.advanceTimersByTime(5000);
            expect(FakeEventSource.instances).toHaveLength(1);
        });

        it('does not reconnect when autoReconnect is off', () => {
            const sse = new SseClient('/api', { autoReconnect: false, reconnectDelayMs: 1000 });
            sse.open('s');
            latest().emitError();

            vi.advanceTimersByTime(5000);
            expect(FakeEventSource.instances).toHaveLength(1);
        });

        it('restart() reconnects immediately', () => {
            const sse = new SseClient('/api', { reconnectDelayMs: 60_000 });
            sse.open('s');
            const first = latest();

            sse.restart();

            expect(FakeEventSource.instances).toHaveLength(2);
            expect(first.closed).toBe(true);
        });
    });

    describe('custom event handlers', () => {
        it('registers a handler onto the current connection', () => {
            const onTraffic = vi.fn();
            const sse = new SseClient('/api');
            sse.open('s');
            sse.addEventHandler('traffic', onTraffic);

            latest().emitCustom('traffic', { data: '1' } as MessageEvent);
            expect(onTraffic).toHaveBeenCalledTimes(1);
        });

        it('attaches handlers registered before open()', () => {
            const onTraffic = vi.fn();
            const sse = new SseClient('/api');
            sse.addEventHandler('traffic', onTraffic);
            sse.open('s');

            latest().emitCustom('traffic', { data: '1' } as MessageEvent);
            expect(onTraffic).toHaveBeenCalledTimes(1);
        });

        it('re-registers handlers on the new connection after a reconnect', () => {
            const onTraffic = vi.fn();
            const sse = new SseClient('/api', { reconnectDelayMs: 1000 });
            sse.addEventHandler('traffic', onTraffic);
            sse.open('s');
            latest().emitError();
            vi.advanceTimersByTime(1000);

            latest().emitCustom('traffic', { data: 'after' } as MessageEvent);
            expect(onTraffic).toHaveBeenCalledTimes(1);
        });

        it('replaces a handler without leaving the old one attached', () => {
            const first = vi.fn();
            const second = vi.fn();
            const sse = new SseClient('/api');
            sse.open('s');
            sse.addEventHandler('traffic', first);
            sse.addEventHandler('traffic', second);

            latest().emitCustom('traffic', { data: '1' } as MessageEvent);

            expect(first).not.toHaveBeenCalled();
            expect(second).toHaveBeenCalledTimes(1);
        });

        it('does not leak listeners onto a closed connection', () => {
            const sse = new SseClient('/api', { reconnectDelayMs: 1000 });
            sse.open('s');
            sse.addEventHandler('traffic', () => {});
            const first = latest();
            expect(first.listenerCount()).toBe(1);

            first.emitError();
            // The dead connection is released, and the new one carries the handler
            expect(first.listenerCount()).toBe(0);
            vi.advanceTimersByTime(1000);
            expect(latest().listenerCount()).toBe(1);
        });

        it('ignores an empty name or a missing handler', () => {
            const sse = new SseClient('/api');
            sse.open('s');
            sse.addEventHandler('', () => {});
            sse.addEventHandler('ok');
            expect(latest().listenerCount()).toBe(0);
        });
    });

    describe('close', () => {
        it('closes the connection and detaches custom listeners', () => {
            const sse = new SseClient('/api');
            sse.open('s');
            sse.addEventHandler('traffic', () => {});
            const es = latest();

            sse.close();

            expect(es.closed).toBe(true);
            expect(sse.isOpen()).toBe(false);
            expect(es.listenerCount()).toBe(0);
        });

        it('is safe to call without an open connection', () => {
            expect(() => new SseClient('/api').close()).not.toThrow();
        });

        it('reopens after close()', () => {
            const sse = new SseClient('/api', { reconnectDelayMs: 1000 });
            sse.open('s');
            sse.close();
            sse.open('s');
            expect(FakeEventSource.instances).toHaveLength(2);
        });
    });
});
