import { computed } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import { bytesToRate, formatByteRate } from '@/utils/bytes';

/**
 * Composable for global rate formatting.
 *
 * Formats "bytes per second" into either a bit rate (Mbps etc.) or a byte rate (MiB/s etc.) according to
 * the `speedUnit` preference in the settings store; calling it inside a computed makes it update
 * automatically when the unit changes.
 *
 * The slice of the settings store this composable reads. Narrowed to the one field on purpose:
 * callers (and tests) can pass a plain `{ speedUnit }` object instead of standing up Pinia.
 */
export type SpeedUnitSource = Pick<ReturnType<typeof useSettingsStore>, 'speedUnit'>;

/**
 * @param settings Source of the unit preference; defaults to the global settings store
 * @returns speedUnit the current (reactive) unit and formatSpeed the formatting function
 */
export function useSpeedFormat(settings: SpeedUnitSource = useSettingsStore()) {
    /**
     * Format a bytes per second rate.
     *
     * @param bytesPerSec - Bytes per second
     * @param decimals - Number of decimals (0/1/2), defaults to 2
     * @returns The rate string with its unit, e.g. "96.50 Mbps" / "12.06 MiB/s"
     */
    function formatSpeed(bytesPerSec: number, decimals: 0 | 1 | 2 = 2): string {
        if (settings.speedUnit === 'bytes') return formatByteRate(bytesPerSec, decimals);
        return bytesToRate(bytesPerSec, 1, decimals).formatted;
    }

    return { speedUnit: computed(() => settings.speedUnit), formatSpeed };
}
