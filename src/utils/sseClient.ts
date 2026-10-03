import { createVisibilityPause } from '@/utils/createVisibilityPause';
import { ReconnectPolicy, type ReconnectPolicyOptions } from '@/utils/reconnectPolicy';
import { SseEventRegistry } from '@/utils/sseEventRegistry';

/**
 * Event handler collection
 */
type Handlers = {
    /**
     * Callback fired when the connection opens
     */
    onOpen?: (ev: Event) => void;
    /**
     * Callback fired when a message arrives
     */
    onMessage?: (ev: MessageEvent) => void;
    /**
     * Callback fired on error
     */
    onError?: (ev: Event) => void;
};

/**
 * Constructor options
 */
type ConstructorOptions = {
    /**
     * Whether to send cookies, default true
     */
    withCredentials?: boolean;
    /**
     * How many milliseconds to wait before closing the SSE connection after the page is
     * backgrounded (disabled by default). Reopened automatically once visible again.
     */
    backgroundCloseDelayMs?: number;
} & ReconnectPolicyOptions &
    Handlers;

/**
 * EventSource wrapper class with automatic reconnect support.
 *
 * Used for receiving vnstat-web realtime traffic over SSE, with exponential backoff reconnects,
 * custom event handlers, and connection state queries.
 *
 * This class owns the connection lifecycle and nothing else. The two decisions that used to be
 * tangled up in it now live in dedicated collaborators: {@link ReconnectPolicy} decides whether and
 * when to retry, and {@link SseEventRegistry} keeps custom event listeners bound across reconnects.
 */
export class SseClient {
    /** Current EventSource instance */
    private es: EventSource | null = null;
    /** Whether a connection attempt is in progress */
    private opening = false;

    /** Prefix URL (trailing slashes removed) */
    private readonly prefix: string;
    /** URL suffix */
    private urlSuffix: string | null = null;

    // Collaborators
    /** Whether / when to retry a dropped connection */
    private readonly policy: ReconnectPolicy;
    /** Custom event listeners, rebound onto every new connection */
    private readonly events = new SseEventRegistry();
    /** Visibility pause manager */
    private visibilityPauseHandle: ReturnType<typeof createVisibilityPause> | null = null;

    // Option parameters
    /** Whether to send cookies */
    private readonly withCredentials: boolean;
    /** Background close delay in milliseconds; unset means disabled */
    private readonly backgroundCloseDelayMs?: number;

    // Event handlers
    /** open event handler */
    private onOpenHandler?: (ev: Event) => void;
    /** message event handler */
    private onMessageHandler?: (ev: MessageEvent) => void;
    /** error event handler */

    private onErrorHandler?: (ev: Event) => void;

    /**
     * Creates an SseClient instance.
     *
     * Initializes the SSE client, supporting reconnect strategy and event callback configuration.
     *
     * @param prefix Server prefix address, e.g. `/api` or `https://example.com`
     * @param opts Configuration options
     *
     * @example
     * ```ts
     * const sse = new SseClient('/api/v1');
     * ```
     */
    constructor(prefix: string, opts: ConstructorOptions = {}) {
        this.prefix = prefix.replace(/\/+$/, ''); // Strip trailing slashes to avoid duplicates
        this.withCredentials = opts.withCredentials ?? true;
        this.backgroundCloseDelayMs = opts.backgroundCloseDelayMs;

        this.policy = new ReconnectPolicy(opts);
        this.onOpenHandler = opts.onOpen;
        this.onMessageHandler = opts.onMessage;
        this.onErrorHandler = opts.onError;
    }

    // Public API

    /**
     * Opens the SSE connection.
     *
     * Ignores the call when the connection is already open or in progress. Registers custom event
     * listeners automatically.
     *
     * @param urlSuffix URL suffix, e.g. `vnstat/interfaces/eth0`
     * @throws If urlSuffix is neither set now nor previously
     *
     * @example
     * ```ts
     * sse.open('vnstat/interfaces/eth0');
     * ```
     */
    open(urlSuffix?: string) {
        if (urlSuffix) this.urlSuffix = urlSuffix;
        if (!this.urlSuffix) {
            console.warn('[SseClient] urlSuffix is not set. Cannot open connection.');
            throw new Error(
                'SseClient: urlSuffix is not set. Pass it to open(suffix) or call setUrlSuffix(suffix) first.',
            );
        }
        this.policy.resume();
        if (this.es || this.opening) {
            this.debug('[SseClient] Already connecting or connected, ignoring open()');
            return;
        }

        this.opening = true;
        const url = this.buildUrl();
        this.debug(`[SseClient] Attempting to connect: ${url}, withCredentials: ${this.withCredentials}`);
        const es = new EventSource(url, {
            withCredentials: this.withCredentials,
        });
        this.es = es;

        es.onopen = (ev) => {
            this.opening = false;
            this.policy.onConnected();
            this.onOpenHandler?.(ev);
            this.debug('[SseClient] Connection opened');
        };

        es.onmessage = (ev) => {
            this.onMessageHandler?.(ev);
        };

        es.onerror = (ev) => {
            console.error('[SseClient] Connection error, scheduling reconnect', ev);
            this.onErrorHandler?.(ev);
            this.forceClose();
            this.opening = false;
            const delay = this.policy.onError(() => {
                this.debug('[SseClient] Reconnect attempt');
                this.open();
            });
            if (delay !== null) {
                this.debug(`[SseClient] Will attempt to reconnect in ${delay} ms`);
            }
        };

        // Register the dictionary-style custom event listeners (event name -> handler)
        this.events.bindTo(es);

        // Automatic close in the background (visibility pause)
        this.setupVisibilityPause();
    }

    /**
     * Sets up the visibility pause listener.
     * Closes the connection automatically once the page has been hidden for longer than
     * backgroundCloseDelayMs, and reopens it when the page becomes visible again.
     */
    private setupVisibilityPause() {
        if (!this.backgroundCloseDelayMs || this.visibilityPauseHandle) return;

        const delayMs = this.backgroundCloseDelayMs;
        this.visibilityPauseHandle = createVisibilityPause(delayMs, {
            onBackgroundExpired: () => {
                this.stopKeepAlive();
                this.forceClose();
            },
            onForeground: () => {
                if (!this.isOpen() && !this.opening && this.urlSuffix) {
                    this.open();
                }
            },
        });
        this.visibilityPauseHandle.setup();
    }

    /**
     * Forcefully restarts the SSE connection.
     *
     * Closes the current connection first, then opens it again.
     *
     * @param urlSuffix URL suffix, e.g. `vnstat/interfaces/eth0`
     * @throws If urlSuffix is neither set now nor previously
     */
    restart(urlSuffix?: string) {
        if (urlSuffix) this.urlSuffix = urlSuffix;
        if (!this.urlSuffix) {
            throw new Error(
                'SseClient: urlSuffix is not set. Pass it to restart(suffix) or call setUrlSuffix(suffix) first.',
            );
        }
        this.policy.reset();
        this.forceClose();
        this.opening = false;
        this.open();
    }

    /**
     * Closes the SSE connection and stops automatic reconnect.
     */
    close() {
        this.policy.stop();
        this.teardownVisibilityPause();
        this.forceClose();
        this.opening = false;

        this.debug('[SseClient] Manually closed and stopped auto-reconnect');
    }

    /**
     * Stops automatic reconnect while keeping the current connection open.
     */
    stopKeepAlive() {
        this.policy.stop();
    }

    /** Removes the visibility pause listener */
    private teardownVisibilityPause() {
        if (this.visibilityPauseHandle) {
            this.visibilityPauseHandle.teardown();
            this.visibilityPauseHandle = null;
        }
    }

    /**
     * Sets the SSE URL suffix.
     *
     * @param suffix URL suffix, e.g. `vnstat/interfaces/eth0`
     */
    setUrlSuffix(suffix: string) {
        this.urlSuffix = suffix;
    }

    /**
     * Gets the full SSE connection URL.
     *
     * @returns The full URL string, or null when urlSuffix is not set
     */
    getFullUrl(): string | null {
        return this.urlSuffix ? this.buildUrl() : null;
    }

    /**
     * Checks whether the current connection is open.
     *
     * @returns true when open, false when not open or closed
     */
    isOpen(): boolean {
        return !!this.es && this.es.readyState === EventSource.OPEN;
    }

    /**
     * Registers a custom event handler.
     *
     * Accepts a single event or a batch (object map). When called while the connection is open, the
     * listeners update immediately and an event with the same name replaces the old handler.
     *
     * @param nameOrMap Event name string, or an object map of { eventName: handler }
     * @param handler Single event handler (used when the first argument is an event name)
     *
     * @example
     * ```ts
     * // Single
     * sse.addEventHandler('traffic', (ev) => console.log(ev.data));
     *
     * // Batch
     * sse.addEventHandler({
     *   traffic: (ev) => { ... },
     *   stats: (ev) => { ... }
     * });
     * ```
     */
    addEventHandler(
        nameOrMap: string | Record<string, (ev: MessageEvent) => void>,
        handler?: (ev: MessageEvent) => void,
    ) {
        this.events.add(nameOrMap, handler);
        // Sync to the current connection (if one exists)
        this.events.bindTo(this.es);
    }

    // Internal methods

    /**
     * Debug log emitted only in development builds; stripped from production builds.
     */
    private debug(...args: unknown[]): void {
        if (import.meta.env.DEV) {
            console.log(...args);
        }
    }

    /**
     * Builds the full URL
     * @returns The joined URL
     */
    private buildUrl(): string {
        const suffix = (this.urlSuffix ?? '').replace(/^\/+/, ''); // Strip leading slashes
        return `${this.prefix}/${suffix}`;
    }

    /**
     * Forcefully closes the current EventSource
     */
    private forceClose() {
        if (this.es) {
            try {
                this.events.unbindAll(this.es);
                this.es.close();
                this.debug('[SseClient] Connection closed');
            } catch (err) {
                console.warn('[SseClient] Error closing connection', err);
            }
            this.es = null;
        }
    }
}
