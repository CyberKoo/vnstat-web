/**
 * A listener sink, i.e. the slice of EventSource this registry needs.
 */
export interface EventListenerTarget {
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
}

/**
 * A keyed registry of custom SSE event listeners that can be rebound onto a new connection.
 *
 * SSE connections are replaced on every reconnect, so a listener registered with
 * `EventSource.addEventListener` dies with the connection it was attached to. This registry keeps
 * the *desired* handlers separately from the ones actually attached to the current connection, and
 * diffs the two whenever the connection changes. That is what lets a handler be swapped at runtime
 * without leaking the listener it replaced.
 *
 * Removing a listener from a connection that has already closed can throw; that is treated as
 * success, because the goal (the listener is gone) already holds.
 *
 * @example
 * ```ts
 * const registry = new SseEventRegistry();
 * registry.add('traffic', onTraffic);
 * registry.bindTo(es);   // after every (re)connect
 * registry.add('stats', onStats);
 * registry.bindTo(es);   // only 'stats' is attached
 * registry.removeAll();
 * ```
 */
export class SseEventRegistry {
    /** Desired handlers: event name -> handler */
    private readonly desired = new Map<string, (ev: MessageEvent) => void>();

    /** Handlers actually attached to the current connection: event name -> handler */
    private bound = new Map<string, (ev: MessageEvent) => void>();

    /**
     * Registers a handler, replacing any previous one for the same event name.
     *
     * Accepts a single event or a batch map; entries with a non-function handler or an empty name
     * are ignored.
     *
     * @param nameOrMap Event name, or a map of { eventName: handler }
     * @param handler Single handler, used when the first argument is an event name
     */
    add(nameOrMap: string | Record<string, (ev: MessageEvent) => void>, handler?: (ev: MessageEvent) => void): void {
        if (typeof nameOrMap === 'string') {
            if (!nameOrMap || typeof handler !== 'function') return;
            this.desired.set(nameOrMap, handler);
            return;
        }
        if (nameOrMap && typeof nameOrMap === 'object') {
            for (const [eventName, h] of Object.entries(nameOrMap)) {
                if (!eventName || typeof h !== 'function') continue;
                this.desired.set(eventName, h);
            }
        }
    }

    /**
     * Removes one handler, or all of them when no name is given.
     *
     * @param eventName Event name to remove; removes everything when omitted
     */
    remove(eventName?: string): void {
        if (eventName === undefined) {
            this.desired.clear();
            return;
        }
        this.desired.delete(eventName);
    }

    /** Event names with a registered handler */
    names(): string[] {
        return [...this.desired.keys()];
    }

    /** Whether an event name has a registered handler */
    has(eventName: string): boolean {
        return this.desired.has(eventName);
    }

    /**
     * Detaches every listener this registry attached to a connection, and forgets it.
     *
     * Call when the connection is being closed, so a stale connection is not left holding
     * listeners that a later connection would re-attach.
     *
     * @param target The connection the listeners were attached to
     */
    unbindAll(target: EventListenerTarget): void {
        for (const [eventName, handler] of this.bound) {
            try {
                target.removeEventListener(eventName, handler as EventListener);
            } catch {
                // Removing from an already-closed connection can throw; the listener is gone either way
            }
        }
        this.bound = new Map();
    }

    /**
     * Brings a connection in line with the registered handlers: listeners whose handler changed (or
     * was removed) are detached, and missing ones are attached.
     *
     * A no-op when `target` is null, so the caller can pass the current connection straight through.
     *
     * @param target The current connection, or null when there is none
     */
    bindTo(target: EventListenerTarget | null): void {
        if (!target) {
            this.bound = new Map();
            return;
        }

        // Detach listeners whose handler changed or that are no longer registered
        for (const [eventName, boundHandler] of this.bound) {
            if (this.desired.get(eventName) === boundHandler) continue;
            try {
                target.removeEventListener(eventName, boundHandler as EventListener);
            } catch {
                // Ignore removal failures
            }
            this.bound.delete(eventName);
        }

        // Attach the ones that are not on this connection yet
        for (const [eventName, handler] of this.desired) {
            if (this.bound.has(eventName)) continue;
            target.addEventListener(eventName, handler as EventListener);
            this.bound.set(eventName, handler);
        }
    }
}
