import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, type App } from 'vue';
import { flushPromises } from '@vue/test-utils';

import { usePoll } from '@/composables/usePoll';

/**
 * Run a composable inside a component context (triggers onMounted/onUnmounted).
 */
function withSetup<T extends (...args: never[]) => unknown>(composable: T): [ReturnType<T>, App] {
    let result!: ReturnType<T>;
    const app = createApp({
        setup() {
            result = composable();
            return () => null;
        },
    });
    app.mount(document.createElement('div'));
    return [result, app];
}

/** Dispatch the visibilitychange event (paired with a document.hidden stub) */
function dispatchVisibilityChange() {
    document.dispatchEvent(new Event('visibilitychange'));
}

describe('usePoll', () => {
    let app: App | null = null;

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        app?.unmount();
        app = null;
        vi.useRealTimers();
        vi.restoreAllMocks();
        // restore the visibility state
        Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    });

    it('runs the task once right after mount (immediate defaults to true)', async () => {
        const task = vi.fn().mockResolvedValue(undefined);
        [, app] = withSetup(() => usePoll(task, { intervalMs: 60_000 }));
        await flushPromises();
        expect(task).toHaveBeenCalledTimes(1);
    });

    it('does not run immediately when immediate=false', async () => {
        const task = vi.fn().mockResolvedValue(undefined);
        [, app] = withSetup(() => usePoll(task, { intervalMs: 60_000, immediate: false }));
        await flushPromises();
        expect(task).not.toHaveBeenCalled();
    });

    it('repeats at a fixed interval', async () => {
        const task = vi.fn().mockResolvedValue(undefined);
        [, app] = withSetup(() => usePoll(task, { intervalMs: 1000 }));
        await flushPromises();
        expect(task).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(1000);
        expect(task).toHaveBeenCalledTimes(2);

        await vi.advanceTimersByTimeAsync(2000);
        expect(task).toHaveBeenCalledTimes(4);
    });

    it('stop halts further scheduling', async () => {
        const task = vi.fn().mockResolvedValue(undefined);
        const [poll] = withSetup(() => usePoll(task, { intervalMs: 1000 }));
        await flushPromises();

        poll.stop();
        await vi.advanceTimersByTimeAsync(10_000);
        expect(task).toHaveBeenCalledTimes(1);
    });

    it('stops polling after the component is unmounted', async () => {
        const task = vi.fn().mockResolvedValue(undefined);
        [, app] = withSetup(() => usePoll(task, { intervalMs: 1000 }));
        await flushPromises();

        app!.unmount();
        app = null;
        await vi.advanceTimersByTimeAsync(10_000);
        expect(task).toHaveBeenCalledTimes(1);
    });

    it('triggers onError when the task throws without affecting later scheduling', async () => {
        const onError = vi.fn();
        const task = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValue(undefined);
        [, app] = withSetup(() => usePoll(task, { intervalMs: 1000, onError }));
        await flushPromises();

        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledWith(new Error('boom'));

        await vi.advanceTimersByTimeAsync(1000);
        expect(task).toHaveBeenCalledTimes(2);
    });

    it('allowOverlap=false: a scheduled run is skipped while the previous task is still running', async () => {
        let resolveTask!: () => void;
        const task = vi.fn().mockImplementation(() => new Promise<void>((r) => (resolveTask = r)));
        [, app] = withSetup(() => usePoll(task, { intervalMs: 1000 }));
        await flushPromises();

        // the task triggered by the mount is still pending when the interval timer fires
        await vi.advanceTimersByTimeAsync(1000);
        expect(task).toHaveBeenCalledTimes(1); // the overlapping run is ignored

        resolveTask();
        await flushPromises();
        await vi.advanceTimersByTimeAsync(1000);
        expect(task).toHaveBeenCalledTimes(2); // polling resumes afterwards
    });

    it('cancels the in-flight task on stop (signal.aborted)', async () => {
        let receivedSignal: AbortSignal | null = null;
        let resolveTask!: () => void;
        const task = vi.fn().mockImplementation(({ signal }: { signal: AbortSignal | null }) => {
            receivedSignal = signal;
            return new Promise<void>((r) => (resolveTask = r));
        });
        const [poll] = withSetup(() => usePoll(task, { intervalMs: 1000 }));

        expect(receivedSignal?.aborted).toBe(false);
        poll.stop();
        expect(receivedSignal?.aborted).toBe(true);

        resolveTask();
        await flushPromises();
    });

    it('does not run immediately on mount while the page is hidden (enableVisibilityPause)', async () => {
        Object.defineProperty(document, 'hidden', { value: true, configurable: true });
        const task = vi.fn().mockResolvedValue(undefined);
        const [poll] = withSetup(() => usePoll(task, { intervalMs: 1000, enableVisibilityPause: true }));
        await flushPromises();

        // mounted while hidden: schedule only, do not run immediately
        expect(task).not.toHaveBeenCalled();

        // it is still scheduled: the run happens once the interval elapses
        await vi.advanceTimersByTimeAsync(1000);
        expect(task).toHaveBeenCalledTimes(1);
        poll.stop();
    });

    it('refreshes immediately when the page becomes visible again after staying hidden for more than one interval', async () => {
        const task = vi.fn().mockResolvedValue(undefined);
        withSetup(() => usePoll(task, { intervalMs: 1000, enableVisibilityPause: true }));
        await flushPromises();
        expect(task).toHaveBeenCalledTimes(1); // visible on mount: runs immediately

        // go to the background (record hiddenAt and clear the scheduling timer)
        Object.defineProperty(document, 'hidden', { value: true, configurable: true });
        dispatchVisibilityChange();

        // stay in the background for more than one interval
        vi.setSystemTime(Date.now() + 1500);

        // become visible again: hidden duration >= intervalMs -> refresh immediately
        Object.defineProperty(document, 'hidden', { value: false, configurable: true });
        dispatchVisibilityChange();
        await flushPromises();
        expect(task).toHaveBeenCalledTimes(2);
    });
});
