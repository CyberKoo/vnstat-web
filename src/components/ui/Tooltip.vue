<template>
    <span
        ref="root"
        class="s2-tooltip-root"
        :class="{ 's2-tooltip-root--block': block }"
        @mouseenter="scheduleShow"
        @mouseleave="hide"
        @focusin="scheduleShow"
        @focusout="hide"
    >
        <slot />

        <Teleport to="body">
            <Transition name="s2-tooltip">
                <div
                    v-if="visible"
                    ref="tip"
                    class="s2-tooltip"
                    :class="`s2-tooltip--${placement}`"
                    :style="tipStyle"
                    role="tooltip"
                >
                    {{ content }}
                </div>
            </Transition>
        </Teleport>
    </span>
</template>

<script lang="ts" setup>
/**
 * Hover/focus tooltip, teleported to `<body>` and positioned against its trigger.
 *
 * Opens after `delay` ms and is dismissed on mouse leave, blur or Escape.
 */
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

const props = withDefaults(
    defineProps<{
        content: string;
        placement?: 'right' | 'left' | 'top' | 'bottom';
        /** Open delay in ms */
        delay?: number;
        /**
         * Block-level wrapper, for triggers that are themselves full-width blocks (a menu row).
         * The default inline-flex is what keeps an icon button centred inside a flex column.
         */
        block?: boolean;
    }>(),
    {
        placement: 'top',
        delay: 100,
        block: false,
    },
);

/** Gap between the trigger and the bubble */
const GAP = 10;

const root = ref<HTMLElement>();
const tip = ref<HTMLElement>();
const visible = ref(false);
const tipStyle = ref<Record<string, string>>({});
let timer: ReturnType<typeof setTimeout> | null = null;

function position() {
    const trigger = root.value;
    const bubble = tip.value;
    if (!trigger || !bubble) return;

    const t = trigger.getBoundingClientRect();
    const w = bubble.offsetWidth;
    const h = bubble.offsetHeight;

    let top: number;
    let left: number;
    if (props.placement === 'right') {
        top = t.top + t.height / 2 - h / 2;
        left = t.right + GAP;
    } else if (props.placement === 'left') {
        top = t.top + t.height / 2 - h / 2;
        left = t.left - GAP - w;
    } else if (props.placement === 'bottom') {
        top = t.bottom + GAP;
        left = t.left + t.width / 2 - w / 2;
    } else {
        top = t.top - GAP - h;
        left = t.left + t.width / 2 - w / 2;
    }

    tipStyle.value = {
        position: 'fixed',
        top: `${Math.round(top)}px`,
        left: `${Math.round(left)}px`,
    };
}

async function show() {
    visible.value = true;
    await nextTick();
    position();
}

function scheduleShow() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void show(), props.delay);
}

function hide() {
    if (timer) clearTimeout(timer);
    visible.value = false;
}

function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') hide();
}

// Escape dismisses from anywhere, so the listener lives on the document — but it is registered in
// `onMounted` to pair with the teardown below. At setup scope it ran for every instance that was
// ever created, including any that was discarded before mounting and never reached
// `onBeforeUnmount`, which leaked a document listener per instance.
onMounted(() => {
    document.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
    if (timer) clearTimeout(timer);
    document.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
/*
 * The wrapper is inline so it adds no layout of its own; the trigger keeps its own box.
 * A plain <span> cannot host a <button> inside a flex row without this, hence the wrapper.
 * --block is for triggers that fill their parent (a menu row) and would otherwise collapse.
 */
.s2-tooltip-root {
    display: inline-flex;
}

.s2-tooltip-root--block {
    display: block;
}
</style>
