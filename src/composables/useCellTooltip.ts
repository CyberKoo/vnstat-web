import { nextTick, onBeforeUnmount, onMounted, ref, type ComponentPublicInstance } from 'vue';

/**
 * Single floating tooltip for heatmap-style cell grids.
 *
 * The native `title` attribute never appears on touch (and on desktop only after a hover delay),
 * so the cells drive this shared bubble instead: hovering a cell shows it on desktop, tapping a
 * cell shows it on touch, and any touch outside a cell (plus scroll/resize/Escape) hides it again.
 *
 * @param cellSelector - CSS selector matching the grid cells, used to tell "tap on a cell" (the
 * cell's own click handler repositions the bubble) apart from "tap elsewhere" (hide the bubble)
 */
export function useCellTooltip(cellSelector: string) {
    /** Gap between the cell and the bubble */
    const GAP = 8;
    /** Minimum distance to the viewport edges */
    const VIEWPORT_PAD = 8;

    const visible = ref(false);
    const content = ref('');
    const style = ref<Record<string, string>>({});
    /** The bubble element (bound via template ref), measured for positioning */
    const tipEl = ref<HTMLElement>();
    /** The cell the bubble is currently anchored to; tapping the same cell again is a "confirm" */
    let anchorEl: HTMLElement | null = null;

    function position() {
        const anchor = anchorEl;
        const tip = tipEl.value;
        if (!anchor || !tip) return;
        const rect = anchor.getBoundingClientRect();
        const w = tip.offsetWidth;
        const h = tip.offsetHeight;
        let left = rect.left + rect.width / 2 - w / 2;
        left = Math.max(VIEWPORT_PAD, Math.min(left, window.innerWidth - w - VIEWPORT_PAD));
        // Above the cell by default; flip below when there is not enough room (first rows)
        let top = rect.top - GAP - h;
        if (top < VIEWPORT_PAD) top = rect.bottom + GAP;
        style.value = {
            position: 'fixed',
            top: `${Math.round(top)}px`,
            left: `${Math.round(left)}px`,
        };
    }

    /** Template ref callback for the bubble element (measured for positioning) */
    function setTipEl(el: Element | ComponentPublicInstance | null) {
        tipEl.value = el instanceof HTMLElement ? el : undefined;
    }

    /** Show the bubble against a cell (or move it when another cell is activated) */
    async function showForEl(el: HTMLElement, text: string) {
        anchorEl = el;
        content.value = text;
        visible.value = true;
        await nextTick();
        position();
    }

    function hide() {
        visible.value = false;
        anchorEl = null;
    }

    function onOutsideTouch(event: TouchEvent) {
        if (!visible.value) return;
        // Taps on a cell are handled by the cell's own click handler (show/move the bubble)
        if (event.target instanceof Element && event.target.matches(cellSelector)) return;
        hide();
    }

    // The bubble uses viewport-fixed coordinates, so any scroll/resize detaches it from the cell
    function onViewportShift() {
        if (visible.value) hide();
    }

    function onKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') hide();
    }

    onMounted(() => {
        document.addEventListener('touchstart', onOutsideTouch, { passive: true });
        document.addEventListener('keydown', onKeydown);
        window.addEventListener('scroll', onViewportShift, { passive: true, capture: true });
        window.addEventListener('resize', onViewportShift, { passive: true });
    });

    onBeforeUnmount(() => {
        document.removeEventListener('touchstart', onOutsideTouch);
        document.removeEventListener('keydown', onKeydown);
        window.removeEventListener('scroll', onViewportShift, { capture: true });
        window.removeEventListener('resize', onViewportShift);
    });

    return { visible, content, style, setTipEl, showForEl, hide };
}
