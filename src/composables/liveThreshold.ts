import { BITS_PER_BYTE, BITS_PER_MBIT } from '@/constants';

/**
 * Convert an Mbps threshold into bytes/s.
 *
 * The threshold is stored in decimal form (1 Mbps = 1e6 bit/s) while the live curve data is in
 * bytes/s; the horizontal threshold line on the chart and the over-threshold markers are compared in
 * that unit.
 *
 * @param mbps The megabits per second value (> 0)
 * @returns The corresponding bytes per second
 *
 * @example
 * mbpsToBytesPerSec(100); // 12_500_000
 */
export function mbpsToBytesPerSec(mbps: number): number {
    return (mbps * BITS_PER_MBIT) / BITS_PER_BYTE;
}

/**
 * Mark the data points in a series that exceed the threshold line.
 *
 * Returns an array of the same length as the input: points above the threshold keep their original
 * value (uPlot draws them as danger colored dots) and the other positions are null (not drawn). When
 * the threshold is disabled (null or a non-positive value) everything is null.
 *
 * @param values Rate series (bytes/s, null/undefined allowed)
 * @param thresholdBps The threshold line (bytes/s), null means off
 * @returns A marker series of the same length as the input
 */
/** Cache of all-null series reused when the threshold is off (uPlot does not modify the data arrays, so sharing them by length is safe) */
const sharedNullSeries = new Map<number, (number | null)[]>();

function nullSeries(len: number): (number | null)[] {
    let arr = sharedNullSeries.get(len);
    if (!arr) {
        arr = new Array(len).fill(null);
        sharedNullSeries.set(len, arr);
    }
    return arr;
}

export function buildThresholdMarkers(
    values: ArrayLike<number | null | undefined>,
    thresholdBps: number | null,
): (number | null)[] {
    if (thresholdBps == null || !(thresholdBps > 0)) return nullSeries(values.length);
    const out: (number | null)[] = new Array(values.length).fill(null);
    for (let i = 0; i < values.length; i++) {
        const v = values[i];
        if (v != null && v > thresholdBps) out[i] = v;
    }
    return out;
}
