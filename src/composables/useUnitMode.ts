import { computed } from 'vue';
import { formatByteRate, bytesToRate } from '@/utils/bytes';
import { useSettingsStore } from '@/stores/settings';

/**
 * Unit type: bps (bits/s) or Bps (bytes/s).
 */
export type UnitMode = 'Bps' | 'bps';

/**
 * Composable for switching and formatting the unit of the realtime chart.
 *
 * The unit comes from the global settings store (the Mbps ↔ MiB/s switch in the top bar); this
 * composable keeps an internal "in effect" unit on top of the global one (`_committed`, updated once
 * the animation has finished), so the axes and the tooltip keep the old unit during the fade
 * animation.
 */
/**
 * The slice of the settings store this composable reads, narrowed to the one field so callers (and
 * tests) can pass a plain object instead of standing up Pinia.
 */
export type UnitModeSettings = Pick<ReturnType<typeof useSettingsStore>, 'speedUnit'>;

/**
 * @param settings Source of the unit preference; defaults to the global settings store
 */
export function useUnitMode(settings: UnitModeSettings = useSettingsStore()) {
    /** Reactive unit (drives the template + triggers the fade animation), sourced from the global store */
    const unitMode = computed<UnitMode>(() => (settings.speedUnit === 'bytes' ? 'Bps' : 'bps'));

    /** The unit actually in effect (synced once fadeOut has completed) */
    let _committed: UnitMode = unitMode.value;

    /**
     * Format a byte/sec rate with the unit currently in effect.
     *
     * @param byteRate Bytes per second
     * @param decimals Number of decimals: 0 rounds, 1 keeps one, 2 keeps two
     */
    function formatRate(byteRate: number, decimals: 0 | 1 | 2 = 0): string {
        if (_committed === 'Bps') return formatByteRate(byteRate, decimals);
        return bytesToRate(byteRate, 1, decimals).formatted;
    }

    /**
     * Sync the unit in effect once fadeOut has completed.
     */
    function commitUnitMode(mode: UnitMode) {
        _committed = mode;
    }

    return {
        /** Reactive unit reference (for template binding) */
        unitMode,
        /** Rate formatting function (uses the committed unit in effect) */
        formatRate,
        /** Commit the unit in effect (called once fadeOut has completed) */
        commitUnitMode,
    };
}
