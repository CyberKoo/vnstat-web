import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { useSettingsStore } from '@/stores/settings';
import { useSpeedFormat } from '@/composables/useSpeedFormat';

describe('settings store', () => {
    beforeEach(() => {
        localStorage.clear();
        setActivePinia(createPinia());
    });

    it('defaults the speed unit to bits', () => {
        const store = useSettingsStore();
        expect(store.speedUnit).toBe('bits');
    });

    it('toggles the unit and persists it to localStorage', () => {
        const store = useSettingsStore();
        store.toggleSpeedUnit();
        expect(store.speedUnit).toBe('bytes');
        expect(localStorage.getItem('s2-speed-unit')).toBe('bytes');
        store.toggleSpeedUnit();
        expect(store.speedUnit).toBe('bits');
        expect(localStorage.getItem('s2-speed-unit')).toBe('bits');
    });

    it('quota and threshold default to null, are persisted when set and remove the key when cleared', () => {
        const store = useSettingsStore();
        expect(store.monthlyQuotaGiB).toBeNull();
        expect(store.liveThresholdMbps).toBeNull();

        store.monthlyQuotaGiB = 500;
        store.liveThresholdMbps = 100;
        expect(localStorage.getItem('s2-quota-gib')).toBe('500');
        expect(localStorage.getItem('s2-live-threshold-mbps')).toBe('100');

        store.monthlyQuotaGiB = null;
        expect(localStorage.getItem('s2-quota-gib')).toBeNull();
    });

    it('falls back to null when restoring an invalid value from localStorage', () => {
        localStorage.setItem('s2-quota-gib', '-5');
        localStorage.setItem('s2-live-threshold-mbps', 'abc');
        setActivePinia(createPinia());
        const store = useSettingsStore();
        expect(store.monthlyQuotaGiB).toBeNull();
        expect(store.liveThresholdMbps).toBeNull();
    });

    it('sidebar collapsed defaults to true and is persisted and restorable after a toggle', () => {
        const store = useSettingsStore();
        expect(store.sidebarCollapsed).toBe(true);

        store.sidebarCollapsed = false;
        expect(localStorage.getItem('s2-sidebar-collapsed')).toBe('0');

        setActivePinia(createPinia());
        const restored = useSettingsStore();
        expect(restored.sidebarCollapsed).toBe(false);
    });
});

describe('useSpeedFormat', () => {
    beforeEach(() => {
        localStorage.clear();
        setActivePinia(createPinia());
    });

    it('bits mode outputs the rate in bits', () => {
        const { formatSpeed } = useSpeedFormat();
        // 12.5 MB/s = 100 Mbps
        expect(formatSpeed(12_500_000)).toBe('100.00 Mbps');
    });

    it('bytes mode outputs the rate in bytes', () => {
        const store = useSettingsStore();
        store.toggleSpeedUnit();
        const { formatSpeed } = useSpeedFormat();
        // 12 MiB/s
        expect(formatSpeed(12 * 1024 * 1024, 0)).toBe('12 MiB/s');
    });

    it('speedUnit reacts to the store', () => {
        const store = useSettingsStore();
        const { speedUnit } = useSpeedFormat();
        expect(speedUnit.value).toBe('bits');
        store.toggleSpeedUnit();
        expect(speedUnit.value).toBe('bytes');
    });
});
