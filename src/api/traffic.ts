import request from '@/api/request';
import type { VnstatInterfaceDetail } from '@/types/network';

/**
 * Gets the detailed traffic information of a given network interface.
 *
 * Sends a GET request to `/interfaces/{name}`
 * and returns the detailed traffic data of that network interface.
 *
 * @async
 * @function getInterfaceDetail
 * @param {string} name Network interface name, e.g. 'eth0' or 'wlan0'.
 * @param {AbortSignal} [signal] Optional abort signal to cancel the in-flight request.
 * @returns {Promise<VnstatInterfaceDetail>} The resolved detailed traffic object of the interface.
 *
 * @example
 * const detail = await getInterfaceDetail('eth0');
 * console.log(detail); // Prints the NetworkInterfaceDetail object
 *
 * @throws {Error} Throws if the request fails.
 */
export async function getInterfaceDetail(name: string, signal?: AbortSignal): Promise<VnstatInterfaceDetail> {
    return request<VnstatInterfaceDetail>({
        url: `/interfaces/${encodeURIComponent(name)}`,
        method: 'get',
        signal,
    });
}
