import { describe, expect, it } from 'vitest';

import { API_BASE_URL } from '@/config';
import { SseClient } from '@/utils/sse/client';

/**
 * The REST layer and the SSE client must always target the same base path.
 *
 * Both read @/config, which is the single source of truth. Before that was true, each side kept
 * its own copy of the env lookup and the two could resolve different values (the `||` vs `??`
 * split), which would have sent the REST calls and the live stream to different paths.
 */
describe('API base path', () => {
    it('is a relative path without a trailing slash', () => {
        expect(API_BASE_URL.startsWith('/')).toBe(true);
        expect(API_BASE_URL.endsWith('/')).toBe(false);
    });

    it('places the SSE live stream under the same base path as the REST calls', () => {
        // The SSE client is constructed with exactly this constant (useLiveNetworkStats.ts)
        const sse = new SseClient(API_BASE_URL);
        sse.setUrlSuffix('/interfaces/eth0/live');
        expect(sse.getFullUrl()).toBe(`${API_BASE_URL}/interfaces/eth0/live`);
    });
});
