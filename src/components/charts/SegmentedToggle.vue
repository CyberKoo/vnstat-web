<template>
    <!-- Mutually exclusive switch: an actual radiogroup with roving tabindex, not tabs
         (tabs would require an associated tabpanel and arrow-key roaming this never had) -->
    <div class="s2-seg-toggle" role="radiogroup" :aria-label="label">
        <span class="s2-seg-slider" :style="sliderStyle" aria-hidden="true" />
        <button
            v-for="(opt, i) in options"
            :key="opt.value"
            type="button"
            class="s2-seg-btn"
            :class="{ active: modelValue === opt.value }"
            role="radio"
            :aria-checked="modelValue === opt.value"
            :tabindex="i === activeIndex ? 0 : -1"
            @click="modelValue = opt.value"
            @keydown="onKeydown($event, i)"
        >
            {{ opt.label }}
        </button>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

/**
 * Segmented toggle (sliding pill) — for mutually exclusive switching between a small number of options,
 * such as chart mode. Visually consistent with the realtime chart bps/Bps toggle.
 */
const props = defineProps<{
    options: { label: string; value: string }[];
    /** Accessible name for the group (the visible section title lives outside the component) */
    label?: string;
}>();

const modelValue = defineModel<string>({ required: true });

const activeIndex = computed(() => {
    const idx = props.options.findIndex((o) => o.value === modelValue.value);
    return idx >= 0 ? idx : 0;
});

const sliderStyle = computed(() => {
    const n = Math.max(props.options.length, 1);
    return {
        width: `calc(${100 / n}% - 4px)`,
        transform: `translateX(calc(${activeIndex.value * 100}% + ${activeIndex.value * 4}px))`,
    };
});

/** Arrow keys move the selection and focus together, per the radio group pattern */
function onKeydown(e: KeyboardEvent, index: number) {
    const n = props.options.length;
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % n;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index - 1 + n) % n;
    if (next < 0) return;
    e.preventDefault();
    modelValue.value = props.options[next]!.value;
    const buttons = (e.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLElement>('.s2-seg-btn');
    buttons?.[next]?.focus();
}
</script>

<style scoped>
.s2-seg-toggle {
    position: relative;
    display: inline-flex;
    padding: 2px;
    border-radius: 999px;
    background: var(--s2-border-light, #eff1f6);
    transition: background-color var(--s2-transition, 0.3s ease);
    user-select: none;
}

.s2-seg-slider {
    position: absolute;
    top: 2px;
    bottom: 2px;
    left: 2px;
    border-radius: 999px;
    background: var(--s2-card, #fff);
    box-shadow: 0 1px 3px rgba(16, 24, 40, 0.12);
    transition: transform var(--s2-transition, 0.3s cubic-bezier(0.4, 0, 0.2, 1));
}

.s2-seg-btn {
    position: relative;
    z-index: 1;
    padding: 3px 12px;
    border: none;
    border-radius: 999px;
    background: transparent;
    color: var(--s2-text-muted, #646c82);
    font-size: 12px;
    font-family: var(--font-sans);
    cursor: pointer;
    transition: color var(--s2-transition, 0.3s ease);
}

.s2-seg-btn.active {
    color: var(--s2-text, #1c2333);
    font-weight: 500;
}

.s2-seg-btn:not(.active):hover {
    color: var(--s2-text, #1c2333);
}
</style>
