import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SseEventRegistry, type EventListenerTarget } from '@/utils/sse/eventRegistry';

/** A connection stub that records what was attached and detached */
function fakeTarget() {
    const attached = new Map<string, EventListener>();
    const added: string[] = [];
    const removed: string[] = [];
    const target: EventListenerTarget = {
        addEventListener(type, listener) {
            attached.set(type, listener);
            added.push(type);
        },
        removeEventListener(type, listener) {
            if (attached.get(type) === listener) attached.delete(type);
            removed.push(type);
        },
    };
    return { target, attached, added, removed };
}

const noop = () => {};

describe('SseEventRegistry', () => {
    let registry: SseEventRegistry;

    beforeEach(() => {
        registry = new SseEventRegistry();
    });

    describe('registration', () => {
        it('attaches a single named handler to the connection', () => {
            const { target, added } = fakeTarget();
            registry.add('traffic', noop);
            registry.bindTo(target);

            expect(added).toEqual(['traffic']);
            expect(registry.has('traffic')).toBe(true);
        });

        it('attaches a batch of handlers', () => {
            const { target, added } = fakeTarget();
            registry.add({ traffic: noop, stats: noop });
            registry.bindTo(target);

            expect(added.sort()).toEqual(['stats', 'traffic']);
            expect(registry.names().sort()).toEqual(['stats', 'traffic']);
        });

        it('ignores an empty event name and a non-function handler', () => {
            const { target, added } = fakeTarget();
            registry.add('', noop);
            registry.add('ok', undefined as unknown as () => void);
            registry.add({ '': noop, bad: 'nope' as unknown as () => void });
            registry.bindTo(target);

            expect(added).toEqual([]);
            expect(registry.names()).toEqual([]);
        });
    });

    describe('rebinding onto a new connection', () => {
        it('attaches every registered handler to a fresh connection', () => {
            registry.add({ traffic: noop, stats: noop });
            const { target, added } = fakeTarget();
            registry.bindTo(target);

            expect(added.sort()).toEqual(['stats', 'traffic']);
        });

        it('detaches first, so a dead connection does not keep the old listener', () => {
            registry.add('traffic', noop);
            const first = fakeTarget();
            registry.bindTo(first.target);
            // The connection goes away
            registry.unbindAll(first.target);
            const second = fakeTarget();
            registry.bindTo(second.target);

            expect(first.removed).toEqual(['traffic']);
            expect(second.added).toEqual(['traffic']);
        });

        it('keeps a listener attached when re-binding to the same connection', () => {
            registry.add('traffic', noop);
            const { target, added, removed } = fakeTarget();
            registry.bindTo(target);
            registry.bindTo(target);

            // Rebinding must not churn the listener
            expect(added).toEqual(['traffic']);
            expect(removed).toEqual([]);
        });
    });

    describe('replacing a handler', () => {
        it('detaches the old listener and attaches the new one', () => {
            const { target, attached, removed } = fakeTarget();
            // Distinct references: the registry compares by identity to decide whether to rebind
            const first = () => {};
            const second = () => {};
            registry.add('traffic', first);
            registry.bindTo(target);
            const afterFirst = attached.get('traffic');

            registry.add('traffic', second);
            registry.bindTo(target);

            expect(removed).toEqual(['traffic']);
            expect(attached.get('traffic')).toBe(second);
            expect(afterFirst).toBe(first);
        });

        it('re-attaches the replacement on the next connection', () => {
            const { target, attached } = fakeTarget();
            const first = () => {};
            const second = () => {};
            registry.add('traffic', first);
            registry.bindTo(target);
            registry.add('traffic', second);
            registry.bindTo(target);

            expect(attached.get('traffic')).toBe(second);
        });

        it('leaves the listener alone when the same handler is re-registered', () => {
            const { target, added, removed } = fakeTarget();
            const handler = () => {};
            registry.add('traffic', handler);
            registry.bindTo(target);
            registry.add('traffic', handler);
            registry.bindTo(target);

            expect(added).toEqual(['traffic']);
            expect(removed).toEqual([]);
        });
    });

    describe('removal', () => {
        it('detaches a removed handler from the live connection', () => {
            const { target, attached, removed } = fakeTarget();
            registry.add({ traffic: noop, stats: noop });
            registry.bindTo(target);

            registry.remove('traffic');
            registry.bindTo(target);

            expect(removed).toEqual(['traffic']);
            expect(attached.has('traffic')).toBe(false);
            expect(attached.has('stats')).toBe(true);
        });

        it('removes everything when called without a name', () => {
            const { target, attached, removed } = fakeTarget();
            registry.add({ traffic: noop, stats: noop });
            registry.bindTo(target);

            registry.remove();
            registry.bindTo(target);

            expect(removed.sort()).toEqual(['stats', 'traffic']);
            expect(attached.size).toBe(0);
            expect(registry.names()).toEqual([]);
        });

        it('does not re-attach a removed handler on the next connection', () => {
            registry.add({ traffic: noop, stats: noop });
            registry.remove('traffic');
            const { target, added } = fakeTarget();
            registry.bindTo(target);

            expect(added).toEqual(['stats']);
        });
    });

    describe('tolerates a hostile connection', () => {
        it('treats a throwing removeEventListener as success', () => {
            registry.add('traffic', noop);
            const { target } = fakeTarget();
            registry.bindTo(target);

            const throwing: EventListenerTarget = {
                addEventListener: () => {},
                removeEventListener: () => {
                    throw new Error('connection already closed');
                },
            };
            expect(() => {
                registry.unbindAll(throwing);
                registry.add('traffic', noop);
                registry.bindTo(throwing);
            }).not.toThrow();
        });

        it('forgets the connection when binding to null', () => {
            registry.add('traffic', noop);
            registry.bindTo(fakeTarget().target);
            registry.bindTo(null);

            // A later connection gets the handler again, so nothing was lost
            const { added } = fakeTarget();
            registry.bindTo({ addEventListener: (t) => added.push(t), removeEventListener: () => {} });
            expect(added).toEqual(['traffic']);
        });
    });
});

describe('SseEventRegistry integration with EventSource-shaped stubs', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('dispatches a registered handler when the connection raises the event', () => {
        const registry = new SseEventRegistry();
        const listeners = new Map<string, EventListener>();
        const target: EventListenerTarget = {
            addEventListener: (type, l) => listeners.set(type, l),
            removeEventListener: (type, l) => {
                if (listeners.get(type) === l) listeners.delete(type);
            },
        };

        const onTraffic = vi.fn();
        registry.add('traffic', onTraffic);
        registry.bindTo(target);

        listeners.get('traffic')?.({ data: '1' } as MessageEvent);

        expect(onTraffic).toHaveBeenCalledTimes(1);
    });
});
