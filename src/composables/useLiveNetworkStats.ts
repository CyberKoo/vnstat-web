import { computed, onBeforeUnmount, onMounted, type Ref, shallowRef, watch } from 'vue';

import { RingBuffer } from '@/utils/ringBuffer';
import { API_BASE_URL, SSE_SHUTDOWN_RECONNECT_DELAY_MS } from '@/config';
import type { NetworkStats, TimedNetworkStats } from '@/types/network';
import { SseClient } from '@/utils/sse/client';
import { useSpeedFormat } from '@/composables/useSpeedFormat';

/**
 * Fetches and caches real-time traffic data for the specified interface (SSE).
 *
 * @param selectedInterfaceRef - Reactive ref of the currently selected interface name
 * @param ringBufferSize - Ring buffer capacity (number of data points)
 * @param options - Optional config
 *   @param options.onOpen - SSE connection open callback (optional)
 *   @param options.maxDataGapMs - Max allowed data gap (ms), clears buffer if exceeded (default 60_000)
 * @returns {{
 *   usage: { rx: { formatted: string }; tx: { formatted: string }; total: { formatted: string } } - latest real-time rates (following the global rate unit)
 *   latest: Ref<TimedNetworkStats | null> - latest traffic data entry
 *   open: (interfaceName: string) => void - open SSE connection for the given interface
 *   close: () => void - close current SSE connection
 *   resetTraffic: () => void - clear traffic data buffer
 * }}
 */
export function useLiveNetworkStats(
    selectedInterfaceRef: Ref<string>,
    ringBufferSize: number,
    options?: {
        onOpen?: (ev: Event) => void;
        maxDataGapMs?: number;
    },
) {
    const buffer = new RingBuffer<TimedNetworkStats>(ringBufferSize);

    // Reactive ref for the latest traffic entry (hot path, zero-copy)
    const latest = shallowRef<TimedNetworkStats | null>(null);

    // SSE instance for receiving real-time backend traffic data
    let eventSource: SseClient | null = null;

    // Timer for delayed reconnect after server graceful shutdown
    let shutdownReconnectTimer: number | null = null;

    // Maximum allowed data gap (ms)
    const maxDataGapMs = options?.maxDataGapMs ?? 60_000;

    // EventSource open handler
    const onOpenHandler = (ev: Event) => {
        // Clear buffer if time gap exceeds threshold
        if (Math.abs(Date.now() - (buffer.peekBack()?.timestamp ?? Date.now())) > maxDataGapMs) {
            resetTraffic();
        }

        // Custom onOpen callback
        options?.onOpen?.(ev);
    };

    // Default message handler
    const onMessageHandler = (msg: MessageEvent) => {
        // Parse traffic stats from message; a malformed frame must not escape into the
        // EventSource callback (it would surface as an uncaught DOM exception), so skip it.
        let networkStats: NetworkStats;
        try {
            networkStats = JSON.parse(msg.data) as NetworkStats;
        } catch {
            console.warn('[useLiveNetworkStats] Skipping malformed SSE frame: data is not valid JSON');
            return;
        }
        if (networkStats && networkStats.rx && networkStats.tx) {
            // Parse timestamp. `||` (not `??`) because the SSE spec defaults lastEventId to ''
            // rather than undefined, and Number('') is 0 — an epoch-0 stamp that trips the
            // max-data-gap reset. A real id of '0' decodes to the same epoch 0, which is not
            // a valid sample timestamp either, so the falsy fallback costs nothing.
            const timestamp = Number(msg.lastEventId || Date.now());
            const entry: TimedNetworkStats = { timestamp, stats: networkStats };
            // Push to buffer (also updates latest ref)
            buffer.push(entry);
            latest.value = entry;
        }
    };

    /**
     * Clear the pending delayed reconnect timer after a shutdown event.
     */
    function clearShutdownReconnectTimer() {
        if (shutdownReconnectTimer !== null) {
            window.clearTimeout(shutdownReconnectTimer);
            shutdownReconnectTimer = null;
        }
    }

    /**
     * Open an SSE live traffic connection for the given interface.
     *
     * @param interfaceName Network interface name, e.g. 'eth0'
     */
    function open(interfaceName: string) {
        clearShutdownReconnectTimer();

        if (eventSource) {
            eventSource.close();
        }

        const client = new SseClient(API_BASE_URL, {
            autoReconnect: true,
            reconnectDelayMs: 1_000,
            useExponentialBackoff: true,
            backoff: { initial: 1_000, max: 60_000, factor: 2 },
            onOpen: onOpenHandler,
            onMessage: onMessageHandler,
        });
        eventSource = client;

        // Server graceful shutdown: stop auto-reconnect, then retry once after
        // a delay to give the server time to restart.
        client.addEventHandler('shutdown', () => {
            client.stopKeepAlive();
            shutdownReconnectTimer = window.setTimeout(() => {
                client.restart();
            }, SSE_SHUTDOWN_RECONNECT_DELAY_MS);
        });

        // Start EventSource connection
        client.open(`/interfaces/${interfaceName}/live`);
    }

    /**
     * Close the current SSE connection.
     *
     * Must run unconditionally: after an error the EventSource is already null (isOpen() === false)
     * while the reconnect timer and visibility-pause listener are still alive, so guarding on
     * isOpen() would skip the only path that tears them down.
     */
    function close() {
        clearShutdownReconnectTimer();
        if (eventSource) eventSource.close();
    }

    /**
     * Clear the traffic data buffer and reset reactive refs.
     */
    function resetTraffic() {
        buffer.clear();
        latest.value = null;
    }

    /**
     * Latest real-time rates (rx/tx/total) as formatted strings.
     * "-" until the first SSE frame lands, so a connecting state never reads as a real zero.
     */
    const usage = computed(() => {
        const data = latest.value;
        const { formatSpeed } = useSpeedFormat();

        if (!data) {
            return { rx: { formatted: '-' }, tx: { formatted: '-' }, total: { formatted: '-' } };
        }

        return {
            rx: { formatted: formatSpeed(data.stats.rx?.bytespersecond ?? 0, 2) },
            tx: { formatted: formatSpeed(data.stats.tx?.bytespersecond ?? 0, 2) },
            total: {
                formatted: formatSpeed((data.stats.tx?.bytespersecond ?? 0) + (data.stats.rx?.bytespersecond ?? 0), 2),
            },
        };
    });

    // Watch interface switch: reconnect SSE and reset data
    watch(
        selectedInterfaceRef,
        (name) => {
            if (!name) return;
            resetTraffic();
            close();
            open(name);
        },
        { immediate: true },
    );

    // Disconnect SSE before page unload
    onMounted(() => {
        window.addEventListener('beforeunload', close);
    });

    // Disconnect SSE on component unmount
    onBeforeUnmount(() => {
        window.removeEventListener('beforeunload', close);
        close();
        eventSource = null;
    });

    return {
        /** Latest real-time rates (rx/tx/total) as formatted strings */
        usage,
        /** Latest traffic data entry */
        latest,
        /** Open SSE connection for the given interface */
        open,
        /** Close current SSE connection */
        close,
        /** Clear traffic data buffer */
        resetTraffic,
    };
}
