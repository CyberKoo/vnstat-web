import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { useLinkSpeedStore } from '@/stores/linkSpeed';
import { getInterfaceLinkSpeed } from '@/api/interfaces';
import type { InterfaceLinkSpeed } from '@/types/network';

vi.mock('@/api/interfaces', () => ({
    getInterfaceLinkSpeed: vi.fn(),
}));

const getInterfaceLinkSpeedMock = vi.mocked(getInterfaceLinkSpeed);

/** Controllable promise: decide manually when the request settles or fails */
function deferred() {
    let resolve!: (v: InterfaceLinkSpeed) => void;
    let reject!: (e: unknown) => void;
    const promise = new Promise<InterfaceLinkSpeed>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

describe('linkSpeed store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        getInterfaceLinkSpeedMock.mockReset();
    });

    it('starts with loading true and linkSpeed null (the first frame should show a skeleton, not the default value)', () => {
        const store = useLinkSpeedStore();
        expect(store.loading).toBe(true);
        expect(store.linkSpeed).toBeNull();
    });

    it('load(""): does not set loading and keeps waiting (the UI keeps showing a skeleton while the interface is not yet known)', () => {
        const store = useLinkSpeedStore();
        store.load('');
        expect(store.loading).toBe(true);
        expect(store.linkSpeed).toBeNull();
        expect(getInterfaceLinkSpeedMock).not.toHaveBeenCalled();
    });

    it('load success: loading is true during the request, then linkSpeed is written and loading is set to false', async () => {
        const store = useLinkSpeedStore();
        const d = deferred();
        getInterfaceLinkSpeedMock.mockReturnValueOnce(d.promise);

        const p = store.load('eth0');
        expect(store.loading).toBe(true);

        d.resolve({ interface: 'eth0', rx: 10000, tx: 10000 });
        await p;

        expect(store.linkSpeed).toEqual({ interface: 'eth0', rx: 10000, tx: 10000 });
        expect(store.loading).toBe(false);
        expect(getInterfaceLinkSpeedMock).toHaveBeenCalledWith('eth0', expect.any(AbortSignal));
    });

    it('load failure: linkSpeed is set to null and loading to false (the caller falls back to the default value)', async () => {
        const store = useLinkSpeedStore();
        const d = deferred();
        getInterfaceLinkSpeedMock.mockReturnValueOnce(d.promise);

        const p = store.load('eth0');
        d.reject(new Error('network down'));
        await p;

        expect(store.linkSpeed).toBeNull();
        expect(store.loading).toBe(false);
    });

    it('switching interfaces in a row: a stale request result does not overwrite the newer request', async () => {
        const store = useLinkSpeedStore();
        const first = deferred();
        const second = deferred();
        getInterfaceLinkSpeedMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

        const p1 = store.load('eth0');
        const p2 = store.load('wlan0');

        first.resolve({ interface: 'eth0', rx: 1000, tx: 1000 });
        await p1;
        // the old request has returned but should be ignored: still waiting for the new request
        expect(store.linkSpeed).toBeNull();
        expect(store.loading).toBe(true);

        second.resolve({ interface: 'wlan0', rx: 10000, tx: 10000 });
        await p2;

        expect(store.linkSpeed).toEqual({ interface: 'wlan0', rx: 10000, tx: 10000 });
        expect(store.loading).toBe(false);
    });
});
