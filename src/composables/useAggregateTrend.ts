import { computed, ref } from 'vue';

import { getInterfaces } from '@/api/interfaces';
import { getInterfaceDetailCached } from '@/composables/useInterfaceDetailCache';
import { useStaleGuard } from '@/composables/useStaleGuard';
import { dayKeyOf } from '@/utils/datetime';
import type { VnstatInterfaceDetail } from '@/types/network';

/** Aggregate trend window (days), matching the section title "the latest 30 days" */
export const AGGREGATE_WINDOW_DAYS = 30;

/** Daily traffic series of several interfaces, aligned by date and summed */
export interface AggregateDailySeries {
    /** Date keys (YYYY-MM-DD, ascending; with data they are always windowDays consecutive calendar
     * days, days without records filled with 0) */
    keys: string[];
    /** rx totals of all interfaces per day */
    rx: number[];
    /** tx totals of all interfaces per day */
    tx: number[];
    /** rx+tx totals per day */
    totals: number[];
}

/**
 * Sum the traffic.day of several interfaces per day after aligning them by date.
 *
 * The dates are the union of the day records of each interface; a missing record for a given day on
 * some interface counts as 0.
 * The window is a calendar window: it ends at the latest date present in the data and takes
 * windowDays consecutive calendar days before it (dates on which no interface has a record inside the
 * window are filled with 0, so the x axis stays continuous).
 * With a single interface it degenerates to that interface's own daily traffic series.
 *
 * @param details List of interface details
 * @param windowDays Window size in days (defaults to 30)
 * @returns The aligned and summed daily series (all arrays are empty when there is no data)
 */
export function buildAggregateDailySeries(
    details: VnstatInterfaceDetail[],
    windowDays: number = AGGREGATE_WINDOW_DAYS,
): AggregateDailySeries {
    const rxByDay = new Map<string, number>();
    const txByDay = new Map<string, number>();

    for (const detail of details) {
        for (const item of detail.traffic?.day ?? []) {
            const key = dayKeyOf(item);
            rxByDay.set(key, (rxByDay.get(key) ?? 0) + (item.rx ?? 0));
            txByDay.set(key, (txByDay.get(key) ?? 0) + (item.tx ?? 0));
        }
    }

    const endKey = [...rxByDay.keys()].sort().at(-1);
    if (!endKey) return { keys: [], rx: [], tx: [], totals: [] };

    // Calendar window: ends at the latest data day and takes windowDays consecutive calendar days
    // before it (including days without records)
    const end = new Date(`${endKey}T00:00:00`);
    const keys: string[] = [];
    for (let offset = windowDays - 1; offset >= 0; offset--) {
        const date = new Date(end);
        date.setDate(end.getDate() - offset);
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        keys.push(`${date.getFullYear()}-${m}-${d}`);
    }

    const rx = keys.map((key) => rxByDay.get(key) ?? 0);
    const tx = keys.map((key) => txByDay.get(key) ?? 0);
    return { keys, rx, tx, totals: rx.map((v, i) => v + (tx[i] ?? 0)) };
}

/** Aggregate trend loading status */
export type AggregateTrendStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Composable for the aggregate trend across all interfaces.
 *
 * Goes through the api layer independently (getInterfaces + the locally cached
 * getInterfaceDetailCached) and does not use the current interface cache of the interfaceDetail store,
 * so switching the selected interface does not affect this chart.
 * A single failing interface detail is only skipped; the error state is reached only when all fail.
 * refresh never throws, it only updates status on failure, so the template can tell loading, error
 * and empty data apart.
 *
 * @returns status loading state, series aggregate series, interfaceCount number of interfaces
 *   included, failed whether it failed with no data at all, refresh manual refresh
 */
export function useAggregateTrend() {
    const status = ref<AggregateTrendStatus>('idle');
    /** The most recently built series; the old data is kept after a failure so the chart does not flash empty */
    const series = ref<AggregateDailySeries>({ keys: [], rx: [], tx: [], totals: [] });
    /** Number of interfaces included in the aggregate at the last success */
    const interfaceCount = ref(0);
    /** It failed and there is no displayable data at all (the template shows the error state based on this) */
    const failed = computed(() => status.value === 'error' && series.value.keys.length === 0);

    /** Guard against late results: once a new refresh round starts, the results of the old one are discarded */
    const guard = useStaleGuard();

    /**
     * Fetch the details of all interfaces and rebuild the aggregate series.
     *
     * @param signal Optional external AbortSignal (returns silently after cancellation, without
     *   updating the status)
     */
    async function refresh(signal?: AbortSignal): Promise<void> {
        if (signal?.aborted) return;
        const isCurrent = guard.begin();
        if (status.value === 'idle') status.value = 'loading';
        try {
            const names = await getInterfaces();
            if (signal?.aborted || !isCurrent()) return;
            // A single failing interface does not bring down the whole thing: failing entries are
            // skipped, and an error is raised only when all of them fail
            const details = (
                await Promise.all(
                    names.map((name) =>
                        getInterfaceDetailCached(name).catch(() => null as VnstatInterfaceDetail | null),
                    ),
                )
            ).filter((d): d is VnstatInterfaceDetail => d !== null);
            if (signal?.aborted || !isCurrent()) return;
            if (details.length === 0) throw new Error('no interface details');
            series.value = buildAggregateDailySeries(details);
            interfaceCount.value = details.length;
            status.value = 'ready';
        } catch (err) {
            if (!isCurrent()) return;
            if (err instanceof DOMException && err.name === 'AbortError') return;
            status.value = 'error';
        }
    }

    return { status, series, interfaceCount, failed, refresh };
}
