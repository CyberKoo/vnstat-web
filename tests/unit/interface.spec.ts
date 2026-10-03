import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { useInterfaceStore } from '@/stores/interface';

describe('interface store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('starts empty', () => {
        const store = useInterfaceStore();
        expect(store.options).toEqual([]);
        expect(store.selected).toBe('');
        expect(store.isLoaded).toBe(false);
    });

    it('setOptions with an empty list: selects nothing and marks it loaded', () => {
        const store = useInterfaceStore();
        store.setOptions([]);
        expect(store.options).toEqual([]);
        expect(store.selected).toBe('');
        expect(store.isLoaded).toBe(true);
    });

    it('setOptions with a non-empty list: selects the first interface automatically', () => {
        const store = useInterfaceStore();
        store.setOptions([
            { label: 'eth0', value: 'eth0' },
            { label: 'wlan0', value: 'wlan0' },
        ]);
        expect(store.selected).toBe('eth0');
        expect(store.isLoaded).toBe(true);
    });

    it('keeps the current selection when setOptions is called again after the user selected one', () => {
        const store = useInterfaceStore();
        store.setOptions([
            { label: 'eth0', value: 'eth0' },
            { label: 'wlan0', value: 'wlan0' },
        ]);
        store.setSelectedInterface('wlan0');
        store.setOptions([
            { label: 'eth0', value: 'eth0' },
            { label: 'wlan0', value: 'wlan0' },
            { label: 'br0', value: 'br0' },
        ]);
        expect(store.selected).toBe('wlan0');
    });

    it('resets to the first entry when the selection is not in the new list', () => {
        const store = useInterfaceStore();
        store.setOptions([{ label: 'eth0', value: 'eth0' }]);
        store.setOptions([{ label: 'wlan0', value: 'wlan0' }]);
        expect(store.selected).toBe('wlan0');
    });

    it('setSelectedInterface switches manually', () => {
        const store = useInterfaceStore();
        store.setOptions([{ label: 'eth0', value: 'eth0' }]);
        store.setSelectedInterface('eth0');
        expect(store.selected).toBe('eth0');
    });
});
