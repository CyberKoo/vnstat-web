<template>
    <div class="hp-wrap">
        <!-- 24-cell horizontal heatmap bar (group of button-like cells, one Tab stop for the row) -->
        <div ref="gridRef" class="hp-grid" role="group" :aria-label="t('chart.hourlyProfile.aria')">
            <div
                v-for="(cell, i) in profile"
                :key="cell.hour"
                class="hp-cell"
                :class="colorClass(cell.avgTotal)"
                role="button"
                :tabindex="roving.tabIndex(i)"
                :aria-label="cellTooltip(cell)"
                @click="onCellTap(cell, $event)"
                @keydown="onCellKeydown($event, i, cell)"
                @focus="onCellFocus(i, cell, $event)"
                @blur="onCellBlur"
                @pointerenter="onCellHover(cell, $event)"
                @pointerleave="onCellLeave"
            />
        </div>

        <!-- Bottom scale -->
        <div class="hp-axis">
            <span v-for="h in axisHours" :key="h" class="hp-axis-label mono">{{ h }}</span>
        </div>

        <!-- Cell info bubble (hover on desktop, tap on touch; the native title tooltip never appears on touch) -->
        <Teleport to="body">
            <Transition name="s2-tooltip">
                <div v-if="tipVisible" :ref="setTipEl" class="s2-tooltip s2-cell-tip" :style="tipStyle" role="tooltip">
                    {{ tipContent }}
                </div>
            </Transition>
        </Teleport>

        <!-- Legend -->
        <div class="hp-legend">
            <span class="hp-legend-label">{{ t('chart.legend.low') }}</span>
            <!-- Legend swatches carry only the legend class: the data-cell class brought a hover
                 outline and an opacity transition that a static swatch should not react to -->
            <span class="hp-legend-cell" :class="levelClass(0)" aria-hidden="true" />
            <span class="hp-legend-cell" :class="levelClass(1)" aria-hidden="true" />
            <span class="hp-legend-cell" :class="levelClass(2)" aria-hidden="true" />
            <span class="hp-legend-cell" :class="levelClass(3)" aria-hidden="true" />
            <span class="hp-legend-cell" :class="levelClass(4)" aria-hidden="true" />
            <span class="hp-legend-label">{{ t('chart.legend.high') }}</span>
            <span v-if="hasRecent" class="hp-legend-hint">{{ t('chart.hourlyProfile.hoverHint') }}</span>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useHourlyProfile } from '@/composables/useHourlyProfile';
import { useCellTooltip } from '@/composables/useCellTooltip';
import { useRovingCells } from '@/composables/useRovingCells';
import { formatBytes } from '@/utils/bytes';

/**
 * 24h hour-of-day profile — a single row of 24 horizontal heatmap cells.
 *
 * Each cell is colored across 5 levels by the historical average total traffic for that hour (cyan → blue → purple color-mix),
 * and the cell bubble shows the historical average along with the actual value from the last 24h.
 */
const { t } = useI18n();
const { profile } = useHourlyProfile();

type ProfileCell = (typeof profile.value)[number];

/** Maximum historical average traffic (used for grading) */
const maxAvg = computed(() => profile.value.reduce((max, c) => Math.max(max, c.avgTotal), 0));

/** Whether actual values from the last 24h exist */
const hasRecent = computed(() => profile.value.some((c) => c.recentTotal !== null));

/** Bottom scale (one number every 4 hours) */
const axisHours = computed(() => Array.from({ length: 6 }, (_v, i) => i * 4));

/** 5 levels by average (0 = no data) */
function colorClass(value: number): string {
    return levelClass(levelOf(value, maxAvg.value));
}

/** Class name for each level */
function levelClass(level: number): string {
    return `hp-level-${level}`;
}

/** Level of the value relative to the maximum, on a square-root scale (0-4) */
function levelOf(value: number, max: number): number {
    if (value <= 0 || max <= 0) return 0;
    // Square-root scale: keeps small/medium cells distinguishable when one
    // outlier cell is much larger than the rest
    const ratio = Math.sqrt(value / max);
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
}

/** Build the cell tooltip */
function cellTooltip(cell: ProfileCell): string {
    const time = `${String(cell.hour).padStart(2, '0')}:00`;
    const avg = formatBytes(cell.avgRx + cell.avgTx, 1).formatted;
    if (cell.recentTotal === null) return t('chart.hourlyProfile.cellTip', { time, avg });
    return t('chart.hourlyProfile.cellTipToday', { time, avg, today: formatBytes(cell.recentTotal, 1).formatted });
}

/**
 * Cell info bubble: hover shows it on desktop, tap shows it on touch, and a touch anywhere else
 * dismisses it. The selector is scoped to the grid so the legend swatches do not count as cells.
 */
const {
    visible: tipVisible,
    content: tipContent,
    style: tipStyle,
    setTipEl,
    showForEl,
    hide: hideTip,
} = useCellTooltip('.hp-grid .hp-cell');

/** The row is a single Tab stop; Left/Right walk the hours, Enter/Space shows the cell bubble */
const gridRef = ref<HTMLDivElement>();
const roving = useRovingCells(gridRef, '.hp-grid .hp-cell', () => profile.value.length, {
    horizontal: 1,
    vertical: 0,
});

/** Hover shows the bubble on desktop only (touch also fires pointerenter on tap; the click path handles that) */
function onCellHover(cell: ProfileCell, event: PointerEvent) {
    if (event.pointerType !== 'mouse') return;
    showForEl(event.currentTarget as HTMLElement, cellTooltip(cell));
}

function onCellLeave(event: PointerEvent) {
    if (event.pointerType !== 'mouse') return;
    hideTip();
}

/** Tap (or mouse click; the cells have no other action) shows the bubble against the cell */
function onCellTap(cell: ProfileCell, event: MouseEvent) {
    showForEl(event.currentTarget as HTMLElement, cellTooltip(cell));
}

function onCellKeydown(event: KeyboardEvent, i: number, cell: ProfileCell) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showForEl(event.currentTarget as HTMLElement, cellTooltip(cell));
        return;
    }
    roving.onKeydown(event, i);
}

/** Keyboard focus shows the same bubble hover would */
function onCellFocus(i: number, cell: ProfileCell, event: FocusEvent) {
    roving.syncActive(i);
    showForEl(event.currentTarget as HTMLElement, cellTooltip(cell));
}

function onCellBlur() {
    hideTip();
}
</script>

<style scoped>
.hp-wrap {
    user-select: none;
}

.hp-grid {
    display: grid;
    grid-template-columns: repeat(24, 1fr);
    gap: 3px;
}

.hp-cell {
    height: 28px;
    border-radius: var(--s2-radius-xs);
    transition:
        opacity 0.15s,
        background-color var(--s2-transition);
}

.hp-cell:hover {
    opacity: 0.75;
    outline: 1px solid var(--s2-text-muted);
    outline-offset: -1px;
}

.hp-cell:focus-visible {
    opacity: 1;
    outline: 2px solid var(--brand);
    outline-offset: 1px;
}

.hp-axis {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    margin-top: 4px;
}

.hp-axis-label {
    font-size: 10px;
    color: var(--s2-text-muted);
}

.hp-legend {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 3px;
    margin-top: 8px;
}

.hp-legend-label {
    font-size: 11px;
    color: var(--s2-text-muted);
    margin: 0 2px;
}

.hp-legend-hint {
    font-size: 11px;
    color: var(--s2-text-muted);
    margin-left: 8px;
}

.hp-legend-cell {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 3px;
}

/* Color levels (light) — cyan → blue → purple duotone scale */
.hp-level-0 {
    background-color: var(--s2-border-light);
}
.hp-level-1 {
    background-color: color-mix(in srgb, var(--cyan) 35%, var(--s2-border-light));
}
.hp-level-2 {
    background-color: color-mix(in srgb, var(--rx) 55%, var(--s2-border-light));
}
.hp-level-3 {
    background-color: color-mix(in srgb, var(--purple) 75%, var(--s2-border-light));
}
.hp-level-4 {
    background-color: var(--purple);
}

@media (--mobile) {
    .hp-grid {
        gap: 2px;
    }
    .hp-cell {
        height: 22px;
        border-radius: 4px;
    }
}
</style>

<style>
/* HourlyProfile dark mode — global scope so :root.dark can override it */
:root.dark .hp-level-0 {
    background-color: var(--s2-border-light);
}
:root.dark .hp-level-1 {
    background-color: color-mix(in srgb, var(--cyan) 35%, var(--s2-bg));
}
:root.dark .hp-level-2 {
    background-color: color-mix(in srgb, var(--rx) 55%, var(--s2-bg));
}
:root.dark .hp-level-3 {
    background-color: color-mix(in srgb, var(--purple) 75%, var(--s2-bg));
}
:root.dark .hp-level-4 {
    background-color: color-mix(in srgb, var(--purple) 90%, var(--s2-text));
}
</style>
