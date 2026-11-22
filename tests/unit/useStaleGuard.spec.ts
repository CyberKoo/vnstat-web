import { afterEach, describe, expect, it } from 'vitest';
import { createApp, type App } from 'vue';

import { useStaleGuard } from '@/composables/useStaleGuard';

/**
 * Run a composable inside a component context (so onScopeDispose is bound to the component scope).
 */
function withSetup<T>(composable: () => T): [T, App] {
    let result!: T;
    const app = createApp({
        setup() {
            result = composable();
            return () => null;
        },
    });
    app.mount(document.createElement('div'));
    return [result, app];
}

describe('useStaleGuard', () => {
    let app: App | null = null;

    afterEach(() => {
        app?.unmount();
        app = null;
    });

    it('keeps the current round valid while no newer round has started', () => {
        const [guard] = withSetup(() => useStaleGuard());
        const isCurrent = guard.begin();
        expect(isCurrent()).toBe(true);
    });

    it('invalidates the previous round once a new one starts', () => {
        const [guard] = withSetup(() => useStaleGuard());
        const first = guard.begin();
        const second = guard.begin();
        expect(first()).toBe(false);
        expect(second()).toBe(true);
    });

    it('invalidates the current round once the owning scope is gone', () => {
        const [guard, instance] = withSetup(() => useStaleGuard());
        const isCurrent = guard.begin();
        expect(isCurrent()).toBe(true);
        instance.unmount();
        app = null;
        expect(isCurrent()).toBe(false);
    });
});
