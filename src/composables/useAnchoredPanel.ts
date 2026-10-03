import { nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';

/**
 * Fixed-position a small popover panel (teleported to `<body>`) against its trigger: right-aligned
 * underneath it, clamped to the viewport, flipped above when there is no room below. Re-anchors on
 * scroll and resize while open.
 *
 * Panels MUST live at body level: inside a `.s2-sheet` the backdrop-filter makes the sheet the
 * containing block for fixed descendants, so a "fixed" mask/panel would only cover the card.
 */
export function useAnchoredPanel(
    trigger: Ref<HTMLElement | undefined>,
    panel: Ref<HTMLElement | undefined>,
    open: Ref<boolean>,
) {
    /** Gap between the trigger and the panel */
    const GAP = 6;
    /** Minimum distance kept from the viewport edges */
    const MARGIN = 8;

    const panelStyle = ref<Record<string, string>>({});

    function position() {
        const t = trigger.value;
        const p = panel.value;
        if (!t || !p) return;

        const r = t.getBoundingClientRect();
        const w = p.offsetWidth;
        const h = p.offsetHeight;

        const below = r.bottom + GAP;
        const top = below + h > window.innerHeight && r.top - GAP - h >= 0 ? r.top - GAP - h : below;
        const left = Math.min(Math.max(r.right - w, MARGIN), window.innerWidth - w - MARGIN);

        panelStyle.value = {
            position: 'fixed',
            top: `${Math.round(top)}px`,
            left: `${Math.round(left)}px`,
        };
    }

    function onViewportChange() {
        if (open.value) position();
    }

    watch(open, async (val) => {
        if (!val) return;
        // The panel mounts with v-if, so measure after the DOM update, then once more after it
        // has settled its own width/height
        await nextTick();
        position();
        requestAnimationFrame(position);
    });

    onMounted(() => {
        window.addEventListener('resize', onViewportChange);
        window.addEventListener('scroll', onViewportChange, true);
    });

    onBeforeUnmount(() => {
        window.removeEventListener('resize', onViewportChange);
        window.removeEventListener('scroll', onViewportChange, true);
    });

    return { panelStyle };
}
