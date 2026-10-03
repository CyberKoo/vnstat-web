import type { TrafficItem } from '@/types/network';

/**
 * Today vs all-time record progress result.
 */
export interface RecordProgress {
    /** Total bytes today */
    todayBytes: number;
    /** Bytes of the all-time record */
    recordBytes: number;
    /** Percentage of the record that today accounts for (capped at 100, kept to 1 decimal) */
    percent: number;
    /** Whether the record has been matched / broken */
    reached: boolean;
    /** Bytes still missing to reach the record (0 once reached) */
    remainingBytes: number;
}

/**
 * Compute the progress of today's total against the all-time record.
 *
 * @param todayBytes Total traffic today (rx + tx, bytes)
 * @param topItems traffic.top data items (the largest total among them is the record)
 * @returns The progress result; null when there is no valid record
 */
export function buildRecordProgress(
    todayBytes: number,
    topItems: Pick<TrafficItem, 'rx' | 'tx'>[],
): RecordProgress | null {
    let recordBytes = 0;
    for (const item of topItems) {
        const total = (item.rx ?? 0) + (item.tx ?? 0);
        if (total > recordBytes) recordBytes = total;
    }
    if (recordBytes <= 0) return null;

    const reached = todayBytes >= recordBytes;
    const percent = reached ? 100 : Math.round((todayBytes / recordBytes) * 1000) / 10;
    return {
        todayBytes,
        recordBytes,
        percent,
        reached,
        remainingBytes: reached ? 0 : recordBytes - todayBytes,
    };
}
