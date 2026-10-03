const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Focus the element next to `anchor` in the document's tab order. Used when a popover teleported
 * to <body>'s end closes on Tab: the native order would strand focus on the browser chrome (Tab
 * past the last element) or drop it at the page's far end (Shift+Tab), so the popover hands focus
 * to the trigger's natural neighbor instead. Returns false when no neighbor receives focus.
 */
export function focusNeighbor(anchor: HTMLElement | undefined, direction: 'forward' | 'backward'): boolean {
    if (!anchor) return false;
    const focusable = Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    const index = focusable.indexOf(anchor);
    if (index === -1) return false;
    const step = direction === 'forward' ? 1 : -1;
    // focus() is a no-op on elements the browser considers unfocusable (hidden, inert), so walk
    // until focus actually lands somewhere
    for (let i = index + step; i >= 0 && i < focusable.length; i += step) {
        focusable[i].focus();
        if (document.activeElement === focusable[i]) return true;
    }
    return false;
}
