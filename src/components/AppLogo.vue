<template>
    <!-- The wordmark is the app's way home. Folded, only the mark renders, so it needs the name
         spelled out for assistive tech; expanded, the text inside is the name. -->
    <router-link to="/" class="s2-app-logo" :class="{ collapsed }" :aria-label="collapsed ? 'vnStat Web' : undefined">
        <RadarMark :size="collapsed ? 32 : 26" />
        <span v-if="!collapsed" class="s2-logo-text"
            >vn<span class="accent">Stat</span> <span class="web">Web</span></span
        >
    </router-link>
</template>

<script lang="ts" setup>
import RadarMark from '@/components/RadarMark.vue';

defineProps<{
    collapsed?: boolean;
}>();
</script>

<style scoped>
.s2-app-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    user-select: none;
    height: 100%;
    width: 100%;
    padding: 0;
    box-sizing: border-box;
    color: var(--s2-text, #1c2333);
    /* It is a link now: drop the UA underline and inherit the mark's colour */
    text-decoration: none;
}

.s2-logo-text {
    font-size: 17px;
    font-weight: 700;
    letter-spacing: -0.01em;
    font-family: var(--font-sans, 'Inter', sans-serif);
    white-space: nowrap;
}

.s2-logo-text .accent {
    color: var(--brand, #7c5cff);
}

.s2-logo-text .web {
    color: var(--rx, #4c6fff);
}
</style>
