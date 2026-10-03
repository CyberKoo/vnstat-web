import { bytesToRate, formatBytes } from '@/utils/bytes';

export interface TrafficTable {
    period: string;
    received: string;
    sent: string;
    total: string;
    avgSpeed: string;
}

/**
 * Options type for building a traffic table.
 * @template T - The data type of a table row
 */
export type BuildTrafficTableOpts<T> = {
    /** Array of data items */
    items: T[];
    /** Number of entries to keep */
    limit: number;
    /**
     * Accessor for the received traffic (rx); defaults to item.rx.
     * Customize it when your field is not named rx.
     */
    getRx?: (item: T) => number;
    /**
     * Accessor for the sent traffic (tx); defaults to item.tx.
     * Customize it when your field is not named tx.
     */
    getTx?: (item: T) => number;
    /**
     * Accessor for the sampling time (in seconds). Used to compute the traffic rate.
     */
    samplingTime: (item: T) => number;
    /**
     * Accessor for the period string, e.g. "2024-09-01" or "2024-09-01 12:00".
     */
    getPeriod: (item: T) => string;
    /**
     * Whether to sort by timestamp in descending order. Needed for Monthly, usually not for Top.
     */
    sortByTimestampDesc?: boolean;
    /**
     * Whether the order is reversed
     */
    reversed?: boolean;
    /**
     * Custom formatter for the average rate (takes bytes per second).
     * Lets the output follow the global unit preference (e.g. useSpeedFormat's formatSpeed);
     * when omitted, the value is formatted as a bit rate.
     */
    formatAvgSpeed?: (bytesPerSec: number) => string;
};

/**
 * Builds generic traffic table data.
 *
 * @template T - The data item type; it must allow an optional timestamp field
 * @param opts - Build options
 * @returns TrafficTable[] - The formatted table rows
 *
 * @example
 * ```ts
 * const result = buildTrafficTable({
 *   items: dataList,
 *   limit: 10,
 *   samplingTime: row => row.time,
 *   getPeriod: row => row.date,
 *   sortByTimestampDesc: true,
 * });
 * ```
 */
export function buildTrafficTable<T extends { timestamp?: number }>(opts: BuildTrafficTableOpts<T>): TrafficTable[] {
    const {
        items,
        limit,
        getRx = (it: T) => (it as T & { rx: number; tx: number }).rx,
        getTx = (it: T) => (it as T & { rx: number; tx: number }).tx,
        samplingTime,
        getPeriod,
        sortByTimestampDesc = false,
        reversed = true,
        formatAvgSpeed,
    } = opts;

    const arr = items.slice();

    // Take only N entries
    const picked = reversed ? arr.slice(-limit) : arr.slice(0, limit);

    // Sort by time descending when needed
    if (sortByTimestampDesc) {
        picked.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
    }

    // Build the contents of each table row
    return picked.map((item) => {
        const rx = getRx(item); // Received traffic
        const tx = getTx(item); // Sent traffic
        const total = rx + tx; // Total traffic
        const bytesPerSec = total / samplingTime(item); // Average rate (bytes per second)

        return {
            period: getPeriod(item), // Period text
            received: formatBytes(rx).formatted, // Received traffic string
            sent: formatBytes(tx).formatted, // Sent traffic string
            total: formatBytes(total).formatted, // Total traffic string
            avgSpeed: formatAvgSpeed
                ? formatAvgSpeed(bytesPerSec)
                : bytesToRate(total, samplingTime(item), 2).formatted, // Average rate string
        };
    });
}
