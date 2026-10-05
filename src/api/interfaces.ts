import request from '@/api/request';
import type { InterfaceLinkSpeed, InterfaceStats, InterfaceSummary } from '@/types/network';

/**
 * Gets the list of all available network interface names.
 *
 * Sends a GET request to `/interfaces`
 * and returns a string array with the names of every network interface on the current system.
 *
 * @returns The resolved array of network interface names.
 *
 * @example
 * const interfaces = await getInterfaces();
 * console.log(interfaces); // Output: ['eth0', 'wlan0', ...]
 *
 * @throws Throws if the request fails.
 */
export async function getInterfaces(): Promise<string[]> {
    return request<string[]>({
        url: '/interfaces',
        method: 'get',
    });
}

/**
 * Gets the summary information of every interface.
 *
 * Sends a GET request to `/interfaces/summary`
 * and returns a brief statistic per interface (total traffic, today's traffic, last update time).
 *
 * @param signal Optional external AbortSignal used to cancel the request
 * @returns An array of interface summaries
 *
 * @example
 * const summaries = await getInterfacesSummary();
 * // [{ name: "eth0", alias: "eth0", total: { rx: ..., tx: ... }, todayRx: ..., todayTx: ..., updatedTimestamp: ... }]
 *
 * @throws Throws if the request fails
 */
export async function getInterfacesSummary(signal?: AbortSignal): Promise<InterfaceSummary[]> {
    return request<InterfaceSummary[]>({
        url: '/interfaces/summary',
        method: 'get',
        signal,
    });
}

/**
 * Gets the aggregated traffic statistics across interfaces.
 *
 * Sends a GET request to `/interfaces/stats`
 * and returns the interface count and the cumulative RX/TX totals of all interfaces.
 *
 * @param signal Optional external AbortSignal used to cancel the request
 * @returns The aggregated statistics
 *
 * @example
 * const stats = await getInterfacesStats();
 * // { totalInterfaces: 3, totalRx: 1234567890000, totalTx: 987654321000 }
 *
 * @throws Throws if the request fails
 */
export async function getInterfacesStats(signal?: AbortSignal): Promise<InterfaceStats> {
    return request<InterfaceStats>({
        url: '/interfaces/stats',
        method: 'get',
        signal,
    });
}

/**
 * Gets the link speed of a given interface.
 *
 * Sends a GET request to `/interfaces/{name}/link-speed`
 * and returns the receive/send link speed of that interface (Mbps), used to compute bandwidth
 * utilization.
 *
 * @param name Interface name (e.g. eth0)
 * @param signal Optional external AbortSignal used to cancel the request
 * @returns The interface link speed information
 *
 * @example
 * const speed = await getInterfaceLinkSpeed('eth0');
 * // { interface: "eth0", rx: 1000, tx: 1000 }
 *
 * @throws Throws if the request fails
 */
export async function getInterfaceLinkSpeed(name: string, signal?: AbortSignal): Promise<InterfaceLinkSpeed> {
    return request<InterfaceLinkSpeed>({
        url: `/interfaces/${encodeURIComponent(name)}/link-speed`,
        method: 'get',
        signal,
    });
}
