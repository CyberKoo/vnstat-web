import { ref } from 'vue';

/**
 * Global toast service.
 *
 * The queue lives at module scope so any composable can raise a toast without a provider in scope,
 * and `<ToastHost>` in `App.vue` renders whatever is queued. This mirrors the imperative API the
 * call sites used before, minus the library.
 */

export type ToastType = 'success' | 'error';

export interface Toast {
    id: number;
    type: ToastType;
    text: string;
}

/** How long a toast stays on screen */
const DURATION = 3000;

const toasts = ref<Toast[]>([]);
let seq = 0;

function push(type: ToastType, text: string) {
    const id = ++seq;
    toasts.value = [...toasts.value, { id, type, text }];
    setTimeout(() => dismiss(id), DURATION);
}

function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
}

/**
 * Imperative toast API.
 *
 * @example
 * ```ts
 * const toast = useToast();
 * try { await save(); toast.success(t('saved')); }
 * catch { toast.error(t('saveFailed')); }
 * ```
 */
export function useToast() {
    return {
        /** Live queue, rendered by `<ToastHost>` */
        toasts,
        success: (text: string) => push('success', text),
        error: (text: string) => push('error', text),
        dismiss,
    };
}
