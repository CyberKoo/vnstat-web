<template>
    <div
        ref="root"
        class="s2-dropdown-root"
        @keydown.esc.stop="close"
        @keydown.down.prevent="onTriggerArrowDown"
        @click="onRootClick"
        @mouseenter="onRootEnter"
        @mouseleave="onRootLeave"
    >
        <slot name="trigger" :open="open" :toggle="toggle" />

        <Teleport to="body">
            <Transition name="s2-dropdown">
                <div
                    v-if="open"
                    ref="panel"
                    class="s2-dropdown"
                    :class="{ 's2-dropdown--large': size === 'large', 's2-dropdown--right': placement === 'right' }"
                    :style="panelStyle"
                    role="menu"
                    @keydown="onPanelKeydown"
                    @pointerdown="onPanelPointerDown"
                    @mouseenter="cancelPendingClose"
                    @mouseleave="onRootLeave"
                >
                    <button
                        v-for="opt in options"
                        :key="opt.key"
                        type="button"
                        class="s2-dropdown-item"
                        :class="{ 's2-dropdown-item--active': opt.key === activeKey }"
                        role="menuitem"
                        :aria-current="opt.key === activeKey ? 'true' : undefined"
                        @click="choose(opt.key, $event)"
                    >
                        <span v-if="opt.icon" class="s2-dropdown-item-icon"><MenuIcon :icon="opt.icon" /></span>
                        <span class="s2-dropdown-item-label">{{ opt.label }}</span>
                    </button>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script lang="ts" setup>
/**
 * Click-to-open dropdown panel, teleported to `<body>` and positioned against its trigger.
 *
 * The panel is measured after mount, because it sizes itself to its content. It is placed
 * 6px under the trigger (the gap the rail design has always used) and clamped to the viewport.
 */
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

import MenuIcon from '@/components/icons/MenuIcon.vue';
import { focusNeighbor } from '@/utils/focus';

export interface DropdownOption {
    key: string;
    label: string;
    /** Iconify icon name; the option renders label-only when omitted */
    icon?: string;
}

const props = withDefaults(
    defineProps<{
        options: DropdownOption[];
        /**
         * `bottom` hangs the panel under the trigger (default);
         * `right` opens it beside the trigger, used by the collapsed rail where the trigger is a
         * full-width row and the panel has to clear the 56px rail.
         */
        placement?: 'bottom' | 'right';
        /** Horizontal alignment against the trigger, for the `bottom` placement */
        align?: 'center' | 'start';
        /** `large` renders 40px rows with icons, for flyout menus */
        size?: 'default' | 'large';
        /**
         * Also open on hover. Used by the collapsed rail, where the panel is the only way to
         * reach a group's children. Clicking still works, so keyboard and touch stay usable.
         */
        openOnHover?: boolean;
        /**
         * Key of the option that reads as current (the route the user is on). It gets the brand
         * tint and `aria-current`, which is what the collapsed rail's flyout needs to keep
         * marking the active child.
         */
        activeKey?: string;
    }>(),
    {
        placement: 'bottom',
        align: 'center',
        size: 'default',
        openOnHover: false,
        activeKey: undefined,
    },
);

const emit = defineEmits<{
    select: [key: string];
}>();

/** Gap between the trigger and the panel */
const GAP = 6;
/** Minimum distance kept from the viewport edges */
const MARGIN = 8;
/** Grace period on hover-out, so the pointer can travel from the trigger into the panel */
const HOVER_LEAVE_GRACE = 150;

const root = ref<HTMLElement>();
const panel = ref<HTMLElement>();
const open = ref(false);
const panelStyle = ref<Record<string, string>>({});

/** The element the panel anchors to: the first node the trigger slot renders. */
function triggerEl(): HTMLElement | undefined {
    return (root.value?.firstElementChild as HTMLElement | undefined) ?? undefined;
}

function position() {
    const trigger = triggerEl();
    const body = panel.value;
    if (!trigger || !body) return;

    const t = trigger.getBoundingClientRect();
    const w = body.offsetWidth;
    const h = body.offsetHeight;

    let top: number;
    let left: number;

    if (props.placement === 'right') {
        top = t.top;
        left = t.right + GAP;
    } else {
        left = props.align === 'center' ? t.left + t.width / 2 - w / 2 : t.left;
        const below = t.bottom + GAP;
        // Flip above the trigger when there is no room below
        top = below + h > window.innerHeight && t.top - GAP - h >= 0 ? t.top - GAP - h : below;
    }

    left = Math.min(Math.max(left, MARGIN), window.innerWidth - w - MARGIN);

    panelStyle.value = {
        position: 'fixed',
        top: `${Math.round(top)}px`,
        left: `${Math.round(left)}px`,
    };
}

async function openPanel(focusFirst = false) {
    pointerDownInPanel = false;
    open.value = true;
    await nextTick();
    position();
    // Re-anchor once the panel has settled its own width/height
    requestAnimationFrame(position);
    // Keyboard-opened menus move focus into the panel (APG menu pattern); pointer/hover
    // opens leave focus alone so hovering never yanks it
    if (focusFirst) focusItem(0);
}

function close() {
    cancelPendingClose();
    pointerDownInPanel = false;
    open.value = false;
}

/** Arms item selection for this opening. Keyboard activation never produces one of these. */
function onPanelPointerDown() {
    pointerDownInPanel = true;
}

function toggle() {
    if (open.value) close();
    else void openPanel();
}

/** Open from the trigger with ArrowDown and land on the first item, per the menu pattern */
function onTriggerArrowDown() {
    if (!open.value) void openPanel(true);
}

function itemEls(): HTMLElement[] {
    return Array.from(panel.value?.querySelectorAll<HTMLElement>('.s2-dropdown-item') ?? []);
}

function focusItem(i: number) {
    const items = itemEls();
    if (!items.length) return;
    items[(i + items.length) % items.length]!.focus();
}

/** Roving focus inside the panel; Escape returns focus to the trigger, Tab walks on from it */
function onPanelKeydown(e: KeyboardEvent) {
    const items = itemEls();
    if (!items.length) return;
    const current = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        focusItem(current + 1);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        focusItem(current - 1);
    } else if (e.key === 'Home') {
        e.preventDefault();
        focusItem(0);
    } else if (e.key === 'End') {
        e.preventDefault();
        focusItem(items.length - 1);
    } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        close();
        triggerEl()?.focus();
    } else if (e.key === 'Tab') {
        // The panel is teleported to <body>'s end: the native tab order from here leaves the
        // page, so walk on from the trigger's neighbor ourselves (after the panel unmounts, so
        // its items cannot be chosen)
        e.preventDefault();
        const direction = e.shiftKey ? 'backward' : 'forward';
        close();
        void nextTick(() => {
            if (!focusNeighbor(triggerEl(), direction)) triggerEl()?.focus();
        });
    }
}

/** Click-to-open, so the trigger slot does not have to wire this up itself */
function onRootClick(e: MouseEvent) {
    const target = e.target as Node;
    // Clicks on the panel itself are handled by its own options
    if (panel.value?.contains(target)) return;
    // On a hover panel, a click lands after the pointer has already opened it. Toggling there
    // would close what the user just revealed, so a click only ever opens. Escape and
    // mouse-out remain the ways out.
    if (props.openOnHover && open.value) return;
    toggle();
}

let closeTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * True once a pointerdown has landed inside this opening of the panel.
 *
 * iPad Safari turns one tap into mouseenter followed by click, and retargets that click onto
 * whatever the mouseenter just revealed. The first row of a hover menu sits beside the trigger,
 * so the tap that opened it selects "hourly" before the menu is ever seen. The pointerdown of
 * that tap already hit the trigger, while the panel did not exist yet; a real choice, mouse or
 * finger, starts with a pointerdown on the panel itself.
 */
let pointerDownInPanel = false;

function cancelPendingClose() {
    if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
    }
}

function onRootEnter() {
    if (!props.openOnHover) return;
    cancelPendingClose();
    if (!open.value) void openPanel();
}

/** Leaving the trigger or the panel; the grace period covers the gap between the two. */
function onRootLeave() {
    if (!props.openOnHover || !open.value) return;
    cancelPendingClose();
    closeTimer = setTimeout(() => {
        closeTimer = null;
        close();
    }, HOVER_LEAVE_GRACE);
}

function choose(key: string, event: MouseEvent) {
    // detail 0 is Enter/Space on the focused item. Leaving the panel open is what makes the
    // opening tap useful: the menu is now on screen for the next tap.
    if (props.openOnHover && event.detail !== 0 && !pointerDownInPanel) return;
    close();
    // Selection dismisses the menu, so focus goes back to the trigger (keyboard users keep
    // their place; pointer interaction never shows a focus ring thanks to :focus-visible)
    triggerEl()?.focus();
    emit('select', key);
}

function onDocumentPointerDown(e: PointerEvent) {
    if (!open.value) return;
    const target = e.target as Node;
    if (panel.value?.contains(target) || root.value?.contains(target)) return;
    close();
}

function onViewportChange() {
    if (open.value) position();
}

onMounted(() => {
    document.addEventListener('pointerdown', onDocumentPointerDown, true);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);
});

onBeforeUnmount(() => {
    cancelPendingClose();
    document.removeEventListener('pointerdown', onDocumentPointerDown, true);
    window.removeEventListener('resize', onViewportChange);
    window.removeEventListener('scroll', onViewportChange, true);
});

defineExpose({ close });
</script>
