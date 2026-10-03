import { computed, type Ref } from 'vue';

import { useDayjs } from '@/composables/useDayjs';
import type { VnstatInterfaceDetail } from '@/types/network';

/**
 * Returns interface metadata: creation timestamp, total samples, days since creation.
 *
 * @param interfaceDetailStore - Reactive ref containing the interface detail data
 * @returns Computed ref with `created` timestamp, `totalSamples` count, `daysSinceCreation`
 */
export function useInterfaceMeta(interfaceDetailStore: Ref<VnstatInterfaceDetail | null>) {
    const dayjs = useDayjs();
    return computed(() => {
        const detail = interfaceDetailStore.value;

        /**
         * Interface creation Unix timestamp (seconds). Null when the backend does not report it
         * (e.g. interfaces added via `vnstat --add`), so callers can hide the field instead of
         * rendering a bogus value diffed from the epoch.
         */
        const createdTimestamp: number | null = detail?.created?.timestamp ?? null;

        /** Traffic type keys to aggregate */
        const trafficKeys = ['top', 'day', 'fiveminute', 'hour', 'month', 'year'] as const;

        /**
         * Count total samples across all traffic types
         */
        const totalSamples = trafficKeys.reduce((sum, key) => {
            const arr = detail?.traffic?.[key];
            // Only add length when arr is an array
            return sum + (Array.isArray(arr) ? arr.length : 0);
        }, 0);

        return {
            /** Interface creation timestamp (seconds), null when unknown */
            created: createdTimestamp,
            /** Total samples */
            totalSamples,
            /** Days since creation, null when the creation time is unknown */
            daysSinceCreation: createdTimestamp === null ? null : dayjs().diff(dayjs.unix(createdTimestamp), 'days'),
        };
    });
}
