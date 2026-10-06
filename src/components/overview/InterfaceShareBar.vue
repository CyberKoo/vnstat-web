<template>
    <!-- The s2-sheet-section wrapper is owned by the view, as on every other page -->
    <h2 class="s2-section-label">
        {{ t('overview.shareBar.title') }}
        <span class="s2-section-hint">{{ t('overview.shareBar.total', { total: totalFormatted }) }}</span>
    </h2>
    <div class="ov-share-bar" role="img" :aria-label="barAriaLabel">
        <!-- No per-segment title: the legend below already lists every name and percent -->
        <div
            v-for="seg in segments"
            :key="seg.name"
            class="ov-share-seg"
            :style="{ width: `${seg.percent}%`, background: seg.color }"
        />
    </div>
    <ul class="ov-share-legend">
        <li v-for="seg in segments" :key="seg.name" class="ov-share-legend-item">
            <span class="ov-share-dot" :style="{ background: seg.color }" />
            <span class="ov-share-name">{{ seg.name }}</span>
            <span class="ov-share-pct">{{ formatDecimal(seg.percent, 1) }}%</span>
        </li>
    </ul>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { interfaceCategoryColor } from '@/components/overview/interfaceColors';
import { formatBytes } from '@/utils/bytes';
import { formatDecimal } from '@/utils/numbers';
import type { InterfaceSummary } from '@/types/network';

/**
 * Interface total share bar — a 100% stacked horizontal bar plus a legend.
 * One segment per interface, with the width being that interface's (rx+tx) proportion of the grand total across all interfaces; the order matches the table rows.
 */
const props = defineProps<{
    /** Interface summary list (order determines the segments and colors) */
    interfaces: InterfaceSummary[];
}>();

const { t, locale } = useI18n();

/**
 * List separator for the aria description.
 * Screen readers pause differently on a full-width comma and a comma + space,
 * so the separator is locale-dependent rather than hard-coded.
 */
const ariaSeparator = computed(() => (locale.value === 'zh-CN' ? '，' : ', '));

/** Single segment data: interface name, share (%), category color */
interface ShareSegment {
    name: string;
    percent: number;
    color: string;
}

/** Cumulative total across all interfaces (sum of rx+tx), the share denominator */
const grandTotal = computed(() => props.interfaces.reduce((sum, item) => sum + item.total.rx + item.total.tx, 0));

/** Stacked segments (keeping the passed-in order, one to one with the table/cards) */
const segments = computed<ShareSegment[]>(() =>
    props.interfaces.map((item, index) => ({
        name: item.name,
        percent: grandTotal.value > 0 ? ((item.total.rx + item.total.tx) / grandTotal.value) * 100 : 0,
        color: interfaceCategoryColor(index),
    })),
);

/** Formatted total traffic text (for the section title hint slot) */
const totalFormatted = computed(() => formatBytes(grandTotal.value).formatted);

/** Accessibility description: each interface's share text joined together */
const barAriaLabel = computed(() =>
    segments.value.map((seg) => `${seg.name} ${formatDecimal(seg.percent, 1)}%`).join(ariaSeparator.value),
);
</script>

<style scoped>
.ov-share-bar {
    display: flex;
    height: 14px;
    border-radius: 7px;
    background: var(--s2-hover-bg);
    overflow: hidden;
    transition: background-color var(--s2-transition);
}

.ov-share-seg {
    height: 100%;
    flex-shrink: 0;
    transition: width var(--s2-transition);
}

.ov-share-seg:first-child {
    border-radius: 7px 0 0 7px;
}

.ov-share-seg:last-child {
    border-radius: 0 7px 7px 0;
}

.ov-share-seg:first-child:last-child {
    border-radius: 7px;
}

.ov-share-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
    margin: 12px 0 0;
    padding: 0;
    list-style: none;
}

.ov-share-legend-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--s2-text);
}

.ov-share-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}

.ov-share-pct {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--s2-text-muted);
}

@media (--mobile) {
    .ov-share-legend {
        gap: 6px 12px;
    }
}
</style>
