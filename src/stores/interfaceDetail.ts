import { defineStore } from 'pinia';
import { ref, type Ref } from 'vue';
import type { VnstatInterfaceDetail } from '@/types/network';

/**
 * Network interface detail Pinia store.
 *
 * Manages the detailed traffic statistics of a given network interface in vnstat-web.
 * Usually used together with useInterfaceStore: once an interface is selected, its details are
 * fetched and applied.
 *
 * @example
 * const interfaceStore = useInterfaceStore();
 * const detailStore = useInterfaceDetailStore();
 * // Load the details
 * const detail = await getInterfaceDetail(interfaceStore.selected);
 * detailStore.update(detail);
 */
export const useInterfaceDetailStore = defineStore('interfaceDetail', () => {
    /**
     * Detail state of the current network interface.
     *
     * @type {Ref<VnstatInterfaceDetail | null>}
     */
    const interfaceDetail: Ref<VnstatInterfaceDetail | null> = ref<VnstatInterfaceDetail | null>(null);

    /**
     * Updates the network interface detail information.
     *
     * @param detail The new interface detail object
     */
    function update(detail: VnstatInterfaceDetail) {
        interfaceDetail.value = detail;
    }

    return {
        update,
        /**
         * Interface details (the reactive reference exposed to the outside).
         *
         * @type {Ref<VnstatInterfaceDetail | null>}
         */
        value: interfaceDetail,
    };
});
