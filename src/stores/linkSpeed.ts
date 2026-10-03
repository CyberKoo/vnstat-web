import { defineStore } from 'pinia';
import { ref, type Ref } from 'vue';

import { getInterfaceLinkSpeed } from '@/api/interfaces';
import type { InterfaceLinkSpeed } from '@/types/network';

/**
 * Link speed Pinia store.
 *
 * Manages the link speed (Mbps) of the currently selected interface, taken from the backend
 * `/interfaces/{name}/link-speed` endpoint. Link speed is quasi-static data, so it needs no
 * continuous polling and is only fetched again when the interface is switched.
 *
 * @example
 * const linkSpeedStore = useLinkSpeedStore();
 * // Called when the interface is switched
 * linkSpeedStore.load('eth0');
 * console.log(linkSpeedStore.current); // { interface: "eth0", rx: 1000, tx: 1000 }
 */
export const useLinkSpeedStore = defineStore('linkSpeed', () => {
    /**
     * Link speed of the current interface; null when it is not loaded or the load failed.
     *
     * @type {Ref<InterfaceLinkSpeed | null>}
     */
    const linkSpeed: Ref<InterfaceLinkSpeed | null> = ref<InterfaceLinkSpeed | null>(null);

    /** Whether the link speed result is pending (true initially, while loading, false on success) */
    const loading: Ref<boolean> = ref(true);

    // Request controller: cancels the previous unfinished request on interface switch, avoiding race overwrites
    let controller: AbortController | null = null;

    /**
     * Loads the link speed of a given interface and updates linkSpeed.
     *
     * On failure linkSpeed is set to null, and the caller falls back to the configured default
     * (VITE_APP_LINK_SPEED).
     *
     * @param name Interface name (e.g. eth0)
     */
    async function load(name: string) {
        controller?.abort();

        if (!name) {
            // Interface not settled yet: keep loading so the UI shows the skeleton, not the default
            linkSpeed.value = null;
            return;
        }

        loading.value = true;
        const ctrl = new AbortController();
        controller = ctrl;

        try {
            const speed = await getInterfaceLinkSpeed(name, ctrl.signal);
            // Write only while this is still the newest request; stale ones (aborted or replaced) are ignored
            if (controller === ctrl) {
                linkSpeed.value = speed;
                loading.value = false;
            }
        } catch {
            if (controller === ctrl) {
                linkSpeed.value = null;
                loading.value = false;
            }
        }
    }

    return {
        /**
         * Link speed of the current interface (reactive); null when not loaded or the load failed.
         *
         * @type {Ref<InterfaceLinkSpeed | null>}
         */
        linkSpeed,
        /** Whether the link speed result is pending (true initially, false once loaded or failed) */
        loading,
        /** Loads the link speed of a given interface and updates linkSpeed */
        load,
    };
});
