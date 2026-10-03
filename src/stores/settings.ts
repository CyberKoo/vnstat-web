import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

/** Rate unit: bits (e.g. Mbps) or bytes (e.g. MiB/s) */
export type SpeedUnit = 'bits' | 'bytes';

const SPEED_UNIT_KEY = 's2-speed-unit';
const QUOTA_KEY = 's2-quota-gib';
const THRESHOLD_KEY = 's2-live-threshold-mbps';
const SIDEBAR_KEY = 's2-sidebar-collapsed';

function readSpeedUnit(): SpeedUnit {
    try {
        return globalThis.localStorage?.getItem(SPEED_UNIT_KEY) === 'bytes' ? 'bytes' : 'bits';
    } catch {
        return 'bits';
    }
}

function readSidebarCollapsed(): boolean {
    try {
        const raw = globalThis.localStorage?.getItem(SIDEBAR_KEY);
        return raw == null ? true : raw === '1';
    } catch {
        return true;
    }
}

function readNumber(key: string): number | null {
    try {
        const raw = globalThis.localStorage?.getItem(key);
        if (raw == null || raw === '') return null;
        const n = Number(raw);
        return Number.isFinite(n) && n > 0 ? n : null;
    } catch {
        return null;
    }
}

function persist(key: string, value: string | number | null) {
    try {
        if (value == null) globalThis.localStorage?.removeItem(key);
        else globalThis.localStorage?.setItem(key, String(value));
    } catch {
        // Keep the in-memory state only when localStorage is unavailable
    }
}

/**
 * User preference settings store.
 *
 * Manages three kinds of cross-page preferences, all persisted to localStorage:
 * - `speedUnit`: rate display unit (bits / bytes), switched globally by the top bar button
 * - `monthlyQuotaGiB`: monthly traffic quota (GiB), used for quota progress and the end-of-month
 *   projection
 * - `liveThresholdMbps`: rate threshold on the live page (Mbps), null means disabled
 * - `sidebarCollapsed`: collapsed state of the desktop sidebar
 */
export const useSettingsStore = defineStore('settings', () => {
    const speedUnit = ref<SpeedUnit>(readSpeedUnit());
    const monthlyQuotaGiB = ref<number | null>(readNumber(QUOTA_KEY));
    const liveThresholdMbps = ref<number | null>(readNumber(THRESHOLD_KEY));
    const sidebarCollapsed = ref<boolean>(readSidebarCollapsed());

    watch(speedUnit, (v) => persist(SPEED_UNIT_KEY, v), { flush: 'sync' });
    watch(monthlyQuotaGiB, (v) => persist(QUOTA_KEY, v), { flush: 'sync' });
    watch(liveThresholdMbps, (v) => persist(THRESHOLD_KEY, v), { flush: 'sync' });
    watch(sidebarCollapsed, (v) => persist(SIDEBAR_KEY, v ? '1' : '0'), { flush: 'sync' });

    function toggleSpeedUnit() {
        speedUnit.value = speedUnit.value === 'bits' ? 'bytes' : 'bits';
    }

    return { speedUnit, monthlyQuotaGiB, liveThresholdMbps, sidebarCollapsed, toggleSpeedUnit };
});
