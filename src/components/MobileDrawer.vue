<template>
    <Teleport to="body">
        <div
            v-if="mounted"
            class="s2-drawer"
            :class="{ open: open, 's2-drawer--slid': slid }"
            role="dialog"
            aria-modal="true"
            :aria-label="t('layout.mainNav')"
            @click.self="$emit('close')"
            @keydown="onKeydown"
        >
            <div ref="panel" class="s2-drawer-panel">
                <div class="s2-drawer-header">
                    <AppLogo />
                </div>
                <div class="s2-drawer-select-row">
                    <select
                        v-if="interfaceOptions.length > 1"
                        :value="selectedInterface"
                        class="s2-sidebar-select"
                        :aria-label="t('layout.interface')"
                        @change="
                            (e: Event) => {
                                $emit('update:selectedInterface', (e.target as HTMLSelectElement).value);
                                $emit('close');
                            }
                        "
                    >
                        <option v-for="opt in interfaceOptions" :key="opt.value" :value="opt.value">
                            {{ opt.label }}
                        </option>
                    </select>
                    <div v-else class="s2-sidebar-iface-single">
                        <icon-mdi-ethernet />
                        <span>{{ selectedInterface }}</span>
                    </div>
                </div>
                <AppMenu :collapsed="false" :indent="20" />
            </div>
        </div>
    </Teleport>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
    visible: boolean;
    interfaceOptions: { label: string; value: string }[];
    selectedInterface: string;
}>();

const emit = defineEmits<{
    close: [];
    'update:dimming': [value: boolean];
    'update:selectedInterface': [value: string];
}>();

const { t } = useI18n();

/*
 * Open and close animate the panel and page dimming together.
 * The drawer stays mounted and interactive until the closing slide finishes.
 */

const PANEL_MS = 200; // Panel slide, both directions; matches the CSS transition
const STAGE_TOTAL = PANEL_MS;

/** Whether the element is mounted (controlled by v-if) */
const mounted = ref(false);
/** Mask state (controls CSS .open): makes the drawer visible and interactive, and fades the mask in */
const open = ref(false);
/** Panel state (controls CSS .s2-drawer--slid): the panel's slide position */
const slid = ref(false);
/** The sliding panel, used to force a style flush before the opening transition starts */
const panel = ref<HTMLElement | null>(null);
let openFrame = 0;

/** Whatever had focus when the drawer opened (the header menu button), restored on close */
let prevFocus: HTMLElement | null = null;

let unmountTimer: ReturnType<typeof setTimeout> | null = null;

/** Cancel whatever stage is still in flight, so a fast re-toggle cannot land a stale state */
function resetStages() {
    if (openFrame) {
        cancelAnimationFrame(openFrame);
        openFrame = 0;
    }
    if (unmountTimer) clearTimeout(unmountTimer);
    unmountTimer = null;
}

/** Modal dialog keys: Escape closes, Tab cycles inside the panel */
function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
        event.preventDefault();
        emit('close');
        return;
    }
    if (event.key !== 'Tab') return;
    // `a[href]` matters as much as the form controls: the menu rows are router-links, and a
    // trap written without it would leak focus straight past them
    const focusables = panel.value?.querySelectorAll<HTMLElement>(
        'a[href], button, select, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusables?.length) return;
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

watch(
    () => props.visible,
    (val) => {
        resetStages();
        if (val) {
            /*
             * Opening: mount, then fade the mask in and slide the panel behind it.
             * The drawer is absolute in document space (a fixed root would trip Safari 26's
             * chrome tinting), and html is the scroller on mobile — so bring the document to
             * its top first, otherwise opening from a scrolled position leaves the drawer
             * off-screen. Scroll locking is done with touch-action on the root, NOT with
             * overflow:hidden on <html>: that stops iOS 26 Safari from compositing live page
             * pixels behind its chrome, which turned the address bar into an opaque band.
             */
            window.scrollTo(0, 0);
            prevFocus = document.activeElement as HTMLElement | null;
            mounted.value = true;
            nextTick(() => {
                if (!props.visible) return;
                /*
                 * nextTick alone resolves in a microtask, before the browser has computed any style for the
                 * freshly mounted panel. Setting the classes there coalesces both mutations into one style
                 * recalc, so the transitions never see their own starting values and the drawer snaps into
                 * place. Reading a layout property flushes style with the panel still at translateX(-100%),
                 * which becomes the before-change style; driving the classes from the next frame then
                 * animates from it.
                 */
                if (panel.value) void panel.value.offsetWidth;
                openFrame = requestAnimationFrame(() => {
                    openFrame = 0;
                    if (!props.visible) return;
                    open.value = true;
                    slid.value = true;
                    emit('update:dimming', true);
                    // Modal dialog: focus moves into the panel on open
                    panel.value?.querySelector<HTMLElement>('select, button')?.focus();
                });
            });
        } else {
            slid.value = false;
            emit('update:dimming', false);
            const finishClose = () => {
                open.value = false;
                mounted.value = false;
                unmountTimer = null;
                // Focus goes back to whatever opened the drawer
                prevFocus?.focus();
                prevFocus = null;
            };
            // Match the CSS guard: without a closing transition, do not retain an invisible modal.
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                finishClose();
            } else {
                unmountTimer = setTimeout(finishClose, STAGE_TOTAL);
            }
        }
    },
);

// A stage left in flight would otherwise apply its final state to a drawer that is no longer on screen.
onBeforeUnmount(() => {
    resetStages();
    prevFocus?.focus();
    prevFocus = null;
});
</script>

<style scoped>
/*
 * No overlay scrim, and nothing position:fixed in this subtree. Safari 26 takes its
 * Liquid Glass chrome tint from fixed/sticky content at the viewport edges — any fixed
 * element there, even a transparent one or a pseudo-element, turns the chrome into a
 * flat tint band while the drawer is open. And the underscan strip behind Safari's
 * expanded chrome cannot be covered by ANY positioned element anyway: only the document
 * paints there. So the dimming is applied to the page content itself — BaseLayout sets
 * .s2-dimmed (filter: var(--s2-drawer-dim)) on the layout shell and header — which dims
 * every region uniformly, the strip included, and keeps the chrome showing real, dimmed
 * page pixels.
 *
 * The root is absolute (a fixed root would reintroduce the band). html is the scroller
 * on mobile, so the drawer scrolls the document to its top on open, and further
 * scrolling is blocked with touch-action on the root rather than overflow:hidden on
 * <html>, which would break the same compositing the glass effect relies on.
 */
.s2-drawer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100vh;
    height: 100dvh;
    z-index: 200;
    overflow: visible;
    pointer-events: none;
    visibility: hidden;
}

.s2-drawer.open {
    pointer-events: auto;
    visibility: visible;
    touch-action: none;
}

.s2-drawer-panel {
    position: absolute;
    top: 0;
    left: 0;
    /* 100vh stops at the layout viewport's bottom edge — iOS 26 insets Safari's expanded
       chrome there too, leaving the sheet visibly short of the screen bottom. The 120px
       bleed (toolbar + home indicator) continues it under that chrome; the overflow below
       the root's 100dvh box is only ever reachable under the chrome, so it can't be tapped. */
    height: calc(100vh + 120px);
    width: 216px;
    background: var(--s2-glass-bg-strong, rgba(255, 255, 255, 0.62));
    -webkit-backdrop-filter: blur(36px) saturate(var(--s2-glass-saturate, 180%));
    backdrop-filter: blur(36px) saturate(var(--s2-glass-saturate, 180%));
    overflow: visible;
    display: flex;
    flex-direction: column;
    box-shadow: var(--s2-shadow-lg, 0 12px 40px rgba(16, 24, 40, 0.1));
    border-right: 1px solid var(--s2-glass-border, rgba(255, 255, 255, 0.7));
    transform: translateX(-100%);
    transition: transform 0.2s ease-out;
    z-index: 1;
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
}

/* Firefox needs an unfiltered page behind the glass. Use a separate scrim rather
   than filtering the layout; Safari keeps its document-dimming workaround. */
@supports (-moz-appearance: none) {
    .s2-drawer::before {
        content: '';
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.08);
        backdrop-filter: blur(4px);
        opacity: 0;
        transition: opacity 0.2s ease-out;
        pointer-events: none;
    }

    .s2-drawer--slid::before {
        opacity: 1;
    }
}

/* The slide is the drawer's only entrance cue, so it is retired rather than shortened; the panel
   still appears in place, and the Firefox scrim fade goes with it. Placed after the @supports
   block so it outranks the equal-specificity transitions above, and kept in this scoped block
   because a bare class in theme-s2.css would lose on specificity. */
@media (prefers-reduced-motion: reduce) {
    .s2-drawer-panel,
    .s2-drawer::before {
        transition: none;
    }
}

/* Keep the root visible until the panel finishes sliding out. */
.s2-drawer--slid .s2-drawer-panel {
    transform: translateX(0);
}

.s2-drawer-header {
    height: var(--header-height);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 12px;
    box-sizing: border-box;
    border-bottom: 1px solid var(--s2-border, #d8dce8);
    flex-shrink: 0;
    transition: border-color var(--s2-transition, 0.3s ease);
}

/*
 * The drawer menu is inset further and starts lower than a bare .s2-menu: the previous component
 * library carried both as internal menu padding. Reproducing them is what keeps the drawer
 * pixel-identical to the layout it replaced. The pill is positioned from the row edge, so it is
 * unaffected by --s2-menu-pad-left.
 */
:deep(.s2-menu) {
    --s2-menu-pad-left: 20px;
    padding-top: 8px;
}
</style>
