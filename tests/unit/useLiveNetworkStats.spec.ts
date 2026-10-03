import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, h, type App, type Ref, ref } from 'vue';

import { useLiveNetworkStats } from '@/composables/useLiveNetworkStats';
import type { NetworkStats } from '@/types/network';

/**
 * jsdom/happy-dom have no EventSource, and this composable's behavior we care about sits
 * entirely in how it drives the SseClient it creates. Mock the class, keep the constructor
 * options (so the captured onMessage handler can be poked directly), and record instances.
 */
const { sseInstances, MockSseClient } = vi.hoisted(() => {
    type MockOpts = {
        onOpen?: (ev: Event) => void;
        onMessage?: (ev: MessageEvent) => void;
        onError?: (ev: Event) => void;
    };

    class MockSseClient {
        static instances: MockSseClient[] = [];
        readonly opts: MockOpts;
        readonly open = vi.fn();
        readonly close = vi.fn();
        readonly restart = vi.fn();
        readonly stopKeepAlive = vi.fn();
        readonly addEventHandler = vi.fn();
        readonly isOpen = vi.fn(() => false);

        constructor(
            readonly prefix: string,
            opts: MockOpts,
        ) {
            this.opts = opts;
            MockSseClient.instances.push(this);
        }
    }

    return { sseInstances: MockSseClient.instances, MockSseClient };
});

vi.mock('@/utils/sseClient', () => ({ SseClient: MockSseClient }));

/** Minimal valid frame payload */
function validStats(): NetworkStats {
    const side = {
        ratestring: '128 B/s',
        bytespersecond: 128,
        packetspersecond: 1,
        bytes: 128,
        packets: 1,
        totalbytes: 128,
        totalpackets: 1,
    };
    return { index: 1, seconds: 1, rx: { ...side }, tx: { ...side } };
}

/** The handler only reads `data` and `lastEventId`, so a plain object is enough */
function sseMessage(data: string, lastEventId?: string): MessageEvent {
    return { data, lastEventId } as unknown as MessageEvent;
}

const mountedApps: App[] = [];

/** Mount the composable inside a throwaway component so lifecycle hooks register */
function mountComposable(selected: Ref<string> = ref('eth0')) {
    let stats!: ReturnType<typeof useLiveNetworkStats>;
    const app = createApp({
        setup() {
            stats = useLiveNetworkStats(selected, 60);
            return () => h('div');
        },
    });
    app.mount(document.createElement('div'));
    mountedApps.push(app);
    return { stats, app };
}

beforeEach(() => {
    sseInstances.length = 0;
});

afterEach(() => {
    while (mountedApps.length) mountedApps.pop()!.unmount();
    vi.restoreAllMocks();
});

describe('useLiveNetworkStats', () => {
    it('opens an SseClient for the selected interface on mount', () => {
        mountComposable();

        expect(sseInstances).toHaveLength(1);
        expect(sseInstances[0].open).toHaveBeenCalledWith('/interfaces/eth0/live');
    });

    it('close() still calls SseClient.close() when the connection reports not open (P0 3.1 regression)', () => {
        const { stats } = mountComposable();
        const client = sseInstances[0];
        expect(client).toBeDefined();

        // After an error the real client is already closed (isOpen() === false) while the
        // reconnect timer and listeners are still alive — close() must tear those down
        // regardless, so it must never be gated on isOpen().
        client.isOpen.mockReturnValue(false);
        client.close.mockClear();

        stats.close();

        expect(client.close).toHaveBeenCalled();
    });

    it('skips non-JSON frames without throwing and without touching latest', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { stats } = mountComposable();
        const client = sseInstances[0];

        expect(() => client.opts.onMessage?.(sseMessage('not json'))).not.toThrow();
        expect(stats.latest.value).toBeNull();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('[useLiveNetworkStats]'));

        // A subsequent valid frame is still processed — the guard only skips the bad one
        client.opts.onMessage?.(sseMessage(JSON.stringify(validStats()), '1700000000'));
        expect(stats.latest.value?.timestamp).toBe(1_700_000_000);
    });

    it('falls back to Date.now() for an empty lastEventId and honors a real id', () => {
        const { stats } = mountComposable();
        const client = sseInstances[0];

        // Per the SSE spec lastEventId defaults to '' (not undefined), and Number('') is 0 —
        // without the fallback the entry would be stamped at the epoch.
        const before = Date.now();
        client.opts.onMessage?.(sseMessage(JSON.stringify(validStats()), ''));
        const fallbackTs = stats.latest.value?.timestamp;
        expect(fallbackTs).toBeGreaterThanOrEqual(before);
        expect(fallbackTs).toBeLessThanOrEqual(Date.now());
        expect(fallbackTs).not.toBe(0);

        client.opts.onMessage?.(sseMessage(JSON.stringify(validStats()), '1700000000'));
        expect(stats.latest.value?.timestamp).toBe(1_700_000_000);
    });
});
