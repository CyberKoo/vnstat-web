<template>
    <svg
        class="s2-radar-mark"
        :style="{ width: size + 'px', height: size + 'px' }"
        viewBox="0 0 100 100"
        aria-hidden="true"
    >
        <circle
            cx="50"
            cy="50"
            r="34"
            class="ring-outer"
            stroke-width="4.5"
            stroke-dasharray="178 36"
            stroke-linecap="round"
        />
        <circle
            cx="50"
            cy="50"
            r="23"
            class="ring-mid"
            stroke-width="3.5"
            stroke-dasharray="108 36"
            stroke-linecap="round"
            opacity="0.6"
            transform="rotate(60 50 50)"
        />
        <circle
            cx="50"
            cy="50"
            r="12"
            class="ring-inner"
            stroke-width="3"
            stroke-dasharray="50 25"
            stroke-linecap="round"
            opacity="0.45"
            transform="rotate(140 50 50)"
        />
        <line x1="50" y1="50" x2="80" y2="35" class="sweep" stroke-width="3" stroke-linecap="round" opacity="0.7" />
        <circle cx="80" cy="35" r="4.5" class="ping" />
        <circle cx="50" cy="16" r="2.5" class="dot" opacity="0.35" />
        <circle cx="16" cy="50" r="2.5" class="dot" opacity="0.35" />
        <circle cx="74" cy="74" r="3" class="dot" opacity="0.5" />
        <circle cx="50" cy="50" r="7" class="hub" />
    </svg>
</template>

<script lang="ts" setup>
withDefaults(
    defineProps<{
        size?: number;
    }>(),
    { size: 26 },
);
</script>

<style scoped>
.s2-radar-mark {
    flex-shrink: 0;
    fill: none;
}

.ring-outer {
    stroke: var(--brand, #7c5cff);
}
.ring-mid {
    stroke: var(--rx, #4c6fff);
}
.ring-inner {
    stroke: var(--tx, #0c9450);
}
.sweep {
    stroke: var(--rx, #4c6fff);
}
.ping {
    fill: var(--rx, #4c6fff);
}
.dot {
    fill: var(--brand, #7c5cff);
}
.hub {
    fill: var(--brand, #7c5cff);
}
</style>
