/**
 * Global Vitest setup.
 *
 * happy-dom does not fully implement AbortSignal.timeout / AbortSignal.any, so a minimal
 * polyfill is added to allow testing the signal merging logic in request.ts.
 */

if (typeof AbortSignal.timeout !== 'function') {
    AbortSignal.timeout = (ms: number) => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(new DOMException('The operation timed out', 'TimeoutError')), ms);
        return controller.signal;
    };
}

if (typeof AbortSignal.any !== 'function') {
    AbortSignal.any = (signals: AbortSignal[]) => {
        const controller = new AbortController();
        for (const signal of signals) {
            if (signal.aborted) {
                controller.abort(signal.reason);
                break;
            }
            signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
        }
        return controller.signal;
    };
}
