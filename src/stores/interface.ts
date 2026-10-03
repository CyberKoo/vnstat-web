import { defineStore } from 'pinia';
import { ref, type Ref } from 'vue';

/**
 * Network interface Pinia store.
 *
 * Manages the network interface list options and the currently selected interface in vnstat-web.
 * Normally the list is loaded at startup through the `getInterfaces` API and then applied with
 * `setOptions`.
 *
 * @example
 * const interfaceStore = useInterfaceStore();
 * const interfaces = await getInterfaces();
 * interfaceStore.setOptions(interfaces.map(name => ({ label: name, value: name })));
 * interfaceStore.setSelectedInterface('eth0');
 */
export const useInterfaceStore = defineStore('interface', () => {
    /**
     * Network interface option list.
     *
     * Each option object holds `label` (the display name) and `value` (the actual interface name).
     *
     * @type {Ref<{ label: string; value: string }[]>}
     */
    const options: Ref<{ label: string; value: string }[]> = ref<{ label: string; value: string }[]>([]);
    /**
     * Whether the interface list has finished loading.
     *
     * @type {Ref<boolean>}
     */
    const isLoaded: Ref<boolean> = ref(false);
    /**
     * Name of the currently selected network interface.
     *
     * @type {Ref<string>}
     */
    const selected: Ref<string> = ref('');

    /**
     * Sets the network interface option list.
     *
     * When nothing is selected or the selection is not in the new list, the first interface of the
     * list is selected automatically (if the list is not empty); otherwise the current selection is
     * kept.
     *
     * @param newOptions The new interface option list
     */
    function setOptions(newOptions: { label: string; value: string }[]) {
        options.value = newOptions;

        // Reset to the first interface only when nothing is selected or it left the new list
        const stillExists = selected.value && newOptions.some((o) => o.value === selected.value);
        if (!stillExists && newOptions.length > 0) {
            selected.value = newOptions[0]?.value ?? '';
        }
        isLoaded.value = true;
    }

    /**
     * Sets the name of the currently selected network interface.
     *
     * @param val Interface name, e.g. 'eth0'
     */
    function setSelectedInterface(val: string) {
        selected.value = val;
    }

    return {
        /** Network interface option list (reactive) */
        options,
        /** Name of the currently selected interface (reactive) */
        selected,
        /** Sets the option list */
        setOptions,
        /** Sets the selected interface */
        setSelectedInterface,
        /** Loading state of the interface list (reactive) */
        isLoaded,
    };
});
