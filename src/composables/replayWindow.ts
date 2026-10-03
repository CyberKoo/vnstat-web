import type { TrafficItem } from '@/types/network';

/** Fixed interval of a fiveminute statistics record (seconds) */
export const FIVEMINUTE_INTERVAL_SEC = 300;

/** Total width of the replay window (seconds): ±2 hours centred on the selected moment */
export const REPLAY_WINDOW_SEC = 7200;

/**
 * Replay window: slice data that uPlot can consume directly.
 */
export interface ReplayWindow {
    /** Timestamps inside the window (seconds, Unix, ascending) */
    x: number[];
    /** Receive rate inside the window (bytes/s, converted from the rx bytes of a record ÷ 300s) */
    rx: number[];
    /** Send rate inside the window (bytes/s, converted from the tx bytes of a record ÷ 300s) */
    tx: number[];
    /** Index inside the window of the data point closest to the target moment */
    centerIdx: number;
    /** Center of the window (timestamp of the data point closest to the target moment, seconds) */
    centerTs: number;
}

/**
 * Find the index of the data point closest to the target moment among the fiveminute records.
 *
 * The data is sorted ascending by time; a binary search locates the first record that is not earlier
 * than the target moment, which is then compared with its predecessor to pick the nearer one.
 *
 * @param items List of fiveminute records (ascending by time)
 * @param targetTs Target moment (seconds)
 * @returns The index of the nearest record; -1 when the list is empty
 */
export function findNearestIndex(items: readonly TrafficItem[], targetTs: number): number {
    const n = items.length;
    if (n === 0) return -1;

    let lo = 0;
    let hi = n - 1;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (items[mid]!.timestamp < targetTs) lo = mid + 1;
        else hi = mid;
    }
    // lo = index of the first record with timestamp >= targetTs; compare it with the previous one to
    // see which is nearer
    if (lo > 0 && Math.abs(items[lo - 1]!.timestamp - targetTs) <= Math.abs(items[lo]!.timestamp - targetTs)) {
        return lo - 1;
    }
    return lo;
}

/**
 * Build the replay window: a slice of the fiveminute history centred on the target moment.
 *
 * - first locate the record closest to the target moment as the window center;
 * - then take all records inside [center - windowSec/2, center + windowSec/2];
 * - rate conversion: the rx/tx of a record is the number of bytes over that 5 minute interval,
 *   divided by 300 to get bytes/s, keeping the same unit as the realtime curve (bytespersecond).
 *
 * @param items List of fiveminute records (ascending by time)
 * @param targetTs Target moment (seconds)
 * @param windowSec Total width of the window (seconds), ±2 hours by default
 * @returns The replay window; all arrays are empty and centerIdx is -1 when there is no data in the range
 */
export function buildReplayWindow(
    items: readonly TrafficItem[],
    targetTs: number,
    windowSec: number = REPLAY_WINDOW_SEC,
): ReplayWindow {
    const empty: ReplayWindow = { x: [], rx: [], tx: [], centerIdx: -1, centerTs: targetTs };
    const centerIdx = findNearestIndex(items, targetTs);
    if (centerIdx < 0) return empty;

    const centerTs = items[centerIdx]!.timestamp;
    const half = windowSec / 2;
    const minTs = centerTs - half;
    const maxTs = centerTs + half;

    const x: number[] = [];
    const rx: number[] = [];
    const tx: number[] = [];
    let idx = -1;
    for (let i = 0; i < items.length; i++) {
        const ts = items[i]!.timestamp;
        if (ts < minTs) continue;
        if (ts > maxTs) break;
        if (i === centerIdx) idx = x.length;
        x.push(ts);
        rx.push((items[i]!.rx ?? 0) / FIVEMINUTE_INTERVAL_SEC);
        tx.push((items[i]!.tx ?? 0) / FIVEMINUTE_INTERVAL_SEC);
    }

    if (x.length === 0) return empty;
    return { x, rx, tx, centerIdx: idx, centerTs };
}
