import { getInterfaceDetail } from '@/api/traffic';
import type { VnstatInterfaceDetail } from '@/types/network';

/** Validity period of the detail cache (milliseconds), aligned with the polling period of the overview page: one real refetch per polling period */
const DETAIL_CACHE_TTL = 60_000;

/** Cache entry: the detail data and the fetch time */
interface CachedDetail {
    detail: VnstatInterfaceDetail;
    fetchedAt: number;
}

/** Interface name → detail cache (module-level singleton, reused in several places of the overview page) */
const detailCache = new Map<string, CachedDetail>();

/** Interface name → in-flight request (concurrent deduplication, at most one detail request per interface at a time) */
const pendingRequests = new Map<string, Promise<VnstatInterfaceDetail>>();

/**
 * Drops cache entries that have exceeded the TTL. Called lazily on access so stale entries of
 * interfaces that are no longer polled (renamed / removed interfaces) do not accumulate forever.
 */
function evictExpired() {
    const now = Date.now();
    for (const [name, entry] of detailCache) {
        if (now - entry.fetchedAt >= DETAIL_CACHE_TTL) {
            detailCache.delete(name);
        }
    }
}

/**
 * Fetch an interface detail with a local cache.
 *
 * Independent of the "currently selected interface" cache of the interfaceDetail store:
 * the overview page keeps its own module-level cache, so switching the selected interface does not
 * affect the data here.
 * A cache entry within its validity period is returned directly; concurrent calls for the same
 * interface share the same in-flight request.
 *
 * @param name Interface name
 * @returns The interface detail (a cache hit resolves from the cache synchronously)
 */
export function getInterfaceDetailCached(name: string): Promise<VnstatInterfaceDetail> {
    evictExpired();
    const hit = detailCache.get(name);
    if (hit && Date.now() - hit.fetchedAt < DETAIL_CACHE_TTL) {
        return Promise.resolve(hit.detail);
    }

    const inflight = pendingRequests.get(name);
    if (inflight) return inflight;

    const request = getInterfaceDetail(name)
        .then((detail) => {
            detailCache.set(name, { detail, fetchedAt: Date.now() });
            return detail;
        })
        .finally(() => {
            pendingRequests.delete(name);
        });
    pendingRequests.set(name, request);
    return request;
}
