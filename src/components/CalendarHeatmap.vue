<template>
    <div class="s2-heatmap-wrapper" :style="{ '--cell-size': cellSize + 'px' }">
        <div ref="scrollRef" class="s2-heatmap-scroll">
            <div class="s2-heatmap-inner">
                <!-- Month label row (absolutely positioned, precisely aligned with the week columns) -->
                <div class="s2-heatmap-months">
                    <span
                        v-for="(m, i) in monthLabels"
                        :key="i"
                        class="s2-heatmap-month-label"
                        :style="{ left: m.left + 'px' }"
                        >{{ m.label }}</span
                    >
                </div>

                <div class="s2-heatmap-body">
                    <!-- Weekday label column -->
                    <div class="s2-heatmap-weekdays">
                        <span v-for="d in weekdays" :key="d" class="s2-heatmap-weekday-label">{{ d }}</span>
                    </div>

                    <!-- Heatmap cells (button-like info cells: the whole grid is ONE Tab stop,
                         arrow keys walk the days, Enter/Space shows the cell bubble) -->
                    <div ref="gridRef" class="s2-heatmap-grid">
                        <div
                            v-for="(cell, idx) in cells"
                            :key="idx"
                            class="s2-heatmap-cell"
                            :class="cell.colorClass"
                            role="button"
                            :tabindex="roving.tabIndex(idx)"
                            :aria-label="cell.tooltip"
                            @click="onCellTap(cell, $event)"
                            @keydown="onCellKeydown($event, idx, cell)"
                            @focus="onCellFocus(idx, cell, $event)"
                            @blur="onCellBlur"
                            @pointerenter="onCellHover(cell, $event)"
                            @pointerleave="onCellLeave"
                        />
                    </div>
                </div>

                <!-- Cell info bubble (hover on desktop, tap on touch; the native title tooltip never appears on touch) -->
                <Teleport to="body">
                    <Transition name="s2-tooltip">
                        <div
                            v-if="tipVisible"
                            :ref="setTipEl"
                            class="s2-tooltip s2-cell-tip"
                            :style="tipStyle"
                            role="tooltip"
                        >
                            {{ tipContent }}
                        </div>
                    </Transition>
                </Teleport>

                <!-- Legend (right-aligned following the grid width) -->
                <div class="s2-heatmap-legend">
                    <span class="s2-heatmap-legend-label">{{ t('chart.heatmap.less') }}</span>
                    <!-- Legend swatches carry only the legend class: the data-cell class brought a
                         hover outline and an opacity transition that a static swatch should not
                         react to. .s2-legend-cell sizes itself from the same --cell-size token. -->
                    <span class="s2-legend-cell s2-color-level-0" aria-hidden="true" />
                    <span class="s2-legend-cell s2-color-level-1" aria-hidden="true" />
                    <span class="s2-legend-cell s2-color-level-2" aria-hidden="true" />
                    <span class="s2-legend-cell s2-color-level-3" aria-hidden="true" />
                    <span class="s2-legend-cell s2-color-level-4" aria-hidden="true" />
                    <span class="s2-heatmap-legend-label">{{ t('chart.heatmap.more') }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { TrafficItem } from '@/types/network';
import { LOCALE_DAYJS, resolveAppLocale } from '@/config/locales';
import { useDayjs } from '@/composables/useDayjs';
import { useCellTooltip } from '@/composables/useCellTooltip';
import { useRovingCells } from '@/composables/useRovingCells';
import { formatBytes } from '@/utils/bytes';
import { BREAKPOINTS } from '@/constants/breakpoints';

const props = withDefaults(
    defineProps<{
        data: TrafficItem[];
        days?: number;
    }>(),
    {
        days: 365,
    },
);

const dayjs = useDayjs();
const { t, locale } = useI18n();

/** Coupled with the CSS @media (--mobile) rule: cells are forced to 10px on mobile */
const MOBILE_QUERY = `(max-width: ${BREAKPOINTS.MOBILE_MAX}px)`;
const isMobileView = ref(false);
let mediaQueryList: MediaQueryList | null = null;

function onMobileQueryChange(e: MediaQueryListEvent) {
    isMobileView.value = e.matches;
}

// ── Container width: on wide screens cells scale up to fill the card, on narrow screens keep the base size and scroll horizontally ──
const scrollRef = ref<HTMLDivElement>();
const gridRef = ref<HTMLDivElement>();
const containerWidth = ref(0);
let resizeObserver: ResizeObserver | null = null;

/**
 * The newest days sit at the right end, so when the grid overflows (phones, narrow windows) the view
 * starts pinned to the end; the pin releases as soon as the user scrolls manually
 */
let userScrolled = false;

/** Set while a programmatic pin is moving the scrollbar: the scroll event it fires is not the user taking over */
let pinScrolling = false;

function onUserScroll() {
    if (pinScrolling) {
        pinScrolling = false;
        return;
    }
    userScrolled = true;
}

function scrollToEnd() {
    const el = scrollRef.value;
    if (!el) return;
    pinScrolling = true;
    el.scrollLeft = el.scrollWidth;
    // A no-op assignment (grid not overflowing, or already at the end) fires no scroll event, and
    // a stale flag would swallow the user's first real scroll. Scroll events fire before rAF
    // callbacks within the same frame, so a real programmatic event has consumed the flag by then.
    requestAnimationFrame(() => {
        pinScrolling = false;
    });
}

onMounted(() => {
    mediaQueryList = window.matchMedia(MOBILE_QUERY);
    isMobileView.value = mediaQueryList.matches;
    mediaQueryList.addEventListener('change', onMobileQueryChange);

    resizeObserver = new ResizeObserver(([entry]) => {
        containerWidth.value = entry.contentRect.width;
    });
    if (scrollRef.value) {
        resizeObserver.observe(scrollRef.value);
        scrollRef.value.addEventListener('scroll', onUserScroll, { passive: true });
    }
    void nextTick(scrollToEnd);
});

onBeforeUnmount(() => {
    mediaQueryList?.removeEventListener('change', onMobileQueryChange);
    mediaQueryList = null;
    resizeObserver?.disconnect();
    resizeObserver = null;
    scrollRef.value?.removeEventListener('scroll', onUserScroll);
});

/** Number of week columns (determined by the length of the date series) */
const columnCount = computed(() => Math.ceil(windowDays.value.length / 7));

/** Cell size lower bound: keep 14px on narrow screens and scroll horizontally */
const BASE_CELL_SIZE = 14;

/** Cell size upper bound: avoid overly large cells on ultra-wide screens */
const MAX_CELL_SIZE = 32;

const cellSize = computed(() => {
    if (isMobileView.value) return 10;
    const cols = columnCount.value;
    if (!containerWidth.value || cols === 0) return BASE_CELL_SIZE;
    // Available width = container - weekday label column (16) - gap between label column and grid (4); the pitch includes the 2px column gap
    const pitch = (containerWidth.value - 20) / cols;
    return Math.max(BASE_CELL_SIZE, Math.min(pitch - 2, MAX_CELL_SIZE));
});

/** Effective cell size (overridden to 10px by CSS on mobile) */
const effectiveCellSize = computed(() => (isMobileView.value ? 10 : cellSize.value));

/** Week column pitch = cell size + column gap (column gap is 1px on mobile) */
const columnPitch = computed(() => effectiveCellSize.value + (isMobileView.value ? 1 : 2));

/**
 * Weekday label column (Monday first). The names come from dayjs so they follow the UI language;
 * `locale.value` is read so the computed re-runs on a language switch (dayjs itself is not reactive).
 */
const weekdays = computed(() => {
    const base = dayjs().locale(LOCALE_DAYJS[resolveAppLocale(locale.value)]);
    return Array.from({ length: 7 }, (_v, i) => base.day((i + 1) % 7).format('dd'));
});

// Index data by date: timestamp -> total bytes
const dayTrafficMap = computed(() => {
    const map = new Map<number, number>();
    for (const item of props.data) {
        const total = (item.rx ?? 0) + (item.tx ?? 0);
        map.set(item.timestamp, total);
    }
    return map;
});

/** Date series: the window start is aligned back to Monday (guaranteeing "row = weekday" always holds), the end is today */
const windowDays = computed(() => {
    const today = dayjs().endOf('day');
    const rawStart = today.subtract(props.days - 1, 'day').startOf('day');
    // day(): Sunday=0 … Saturday=6 → converted to "days since the previous Monday"
    const padBack = (rawStart.day() + 6) % 7;
    const start = rawStart.subtract(padBack, 'day');
    const out = [];
    for (let d = start; !d.isAfter(today, 'day'); d = d.add(1, 'day')) out.push(d);
    return out;
});

// Compute cells for the date window
const cells = computed(() => {
    const map = dayTrafficMap.value;

    // Index raw data by timestamp for rx/tx tooltip breakdown
    const tooltipCells = props.data.reduce(
        (acc, item) => {
            acc[item.timestamp] = item;
            return acc;
        },
        {} as Record<number, TrafficItem>,
    );

    // Find max value in range for color scaling
    let maxVal = 0;
    const tempCells: { date: string; ts: number; value: number; tooltip: string }[] = [];

    for (const d of windowDays.value) {
        const ts = d.unix();
        const value = map.get(ts) ?? 0;
        if (value > maxVal) maxVal = value;

        // Build tooltip with rx/tx breakdown in a single pass
        const raw = tooltipCells[ts];
        const rxFmt = raw ? formatBytes(raw.rx, 1) : null;
        const txFmt = raw ? formatBytes(raw.tx, 1) : null;
        const totalFmt = formatBytes(value, 1);
        // formatted already includes the unit (e.g. "1.23 GiB"), so reuse it directly
        const rxStr = rxFmt ? rxFmt.formatted : '0 B';
        const txStr = txFmt ? txFmt.formatted : '0 B';
        const totalStr = totalFmt.formatted;
        // localized form for the tooltip
        const displayDate = d.format(t('common.format.date'));

        tempCells.push({
            date: d.format('YYYY-MM-DD'),
            ts,
            value,
            tooltip: t('chart.heatmap.cellTip', { date: displayDate, rx: rxStr, tx: txStr, total: totalStr }),
        });
    }

    // Color level depends on maxVal, assign after the pass
    return tempCells.map((c) => ({
        ...c,
        colorClass: getColorClass(c.value, maxVal),
    }));
});

/* Content-width drivers (cell size follows the container, the column count follows the date window):
   re-pin to the right end after layout changes until the user takes over the scrollbar.
   Declared below the date-series computeds: watch evaluates its sources on creation */
watch([effectiveCellSize, columnCount], () => {
    if (userScrolled) return;
    void nextTick(scrollToEnd);
});

type HeatmapCell = (typeof cells.value)[number];

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
} = useCellTooltip('.s2-heatmap-grid .s2-heatmap-cell');

/**
 * The grid is a single Tab stop no matter how many days are shown: arrow keys walk the days
 * (Left/Right = ±1 week, Up/Down = ±1 day), Enter/Space shows the cell bubble.
 */
const roving = useRovingCells(gridRef, '.s2-heatmap-grid .s2-heatmap-cell', () => cells.value.length, {
    horizontal: 7,
    vertical: 1,
});

/** Hover shows the bubble on desktop only (touch also fires pointerenter on tap; the click path handles that) */
function onCellHover(cell: { tooltip: string }, event: PointerEvent) {
    if (event.pointerType !== 'mouse') return;
    showForEl(event.currentTarget as HTMLElement, cell.tooltip);
}

function onCellLeave(event: PointerEvent) {
    if (event.pointerType !== 'mouse') return;
    hideTip();
}

/** Tap (or mouse click; the cells have no other action) shows the bubble against the cell */
function onCellTap(cell: { tooltip: string }, event: MouseEvent) {
    showForEl(event.currentTarget as HTMLElement, cell.tooltip);
}

/** Keyboard on a cell: Enter/Space shows the bubble, everything else goes to the roving tabindex walk */
function onCellKeydown(event: KeyboardEvent, idx: number, cell: HeatmapCell) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showForEl(event.currentTarget as HTMLElement, cell.tooltip);
        return;
    }
    roving.onKeydown(event, idx);
}

/** Keyboard focus shows the same bubble hover would */
function onCellFocus(idx: number, cell: HeatmapCell, event: FocusEvent) {
    roving.syncActive(idx);
    showForEl(event.currentTarget as HTMLElement, cell.tooltip);
}

function onCellBlur() {
    hideTip();
}

// Month labels — absolute positioning: "week column index × column pitch" of the month change day, aligned with zero drift from the cells;
// dropped when too close to the adjacent label on the right (the first partial month usually has only one column, the same handling GitHub uses)
const monthLabels = computed(() => {
    const labels: { label: string; left: number }[] = [];
    let prev = '';
    const list = windowDays.value;
    for (let i = 0; i < list.length; i++) {
        const month = list[i]!.format('MMM');
        if (month !== prev) {
            labels.push({ label: month, left: Math.floor(i / 7) * columnPitch.value });
            prev = month;
        }
    }
    const MIN_GAP = 28;
    return labels.filter((l, i) => i === labels.length - 1 || labels[i + 1]!.left - l.left >= MIN_GAP);
});

// ---- helpers ----

function getColorClass(value: number, maxVal: number): string {
    if (value === 0) return 's2-color-level-0';
    if (maxVal === 0) return 's2-color-level-0';
    // Square-root scale: spreads small/medium values across the levels so one
    // outlier day does not flatten every other cell into the lowest band
    const ratio = Math.sqrt(value / maxVal);
    if (ratio <= 0.25) return 's2-color-level-1';
    if (ratio <= 0.5) return 's2-color-level-2';
    if (ratio <= 0.75) return 's2-color-level-3';
    return 's2-color-level-4';
}
</script>

<style scoped>
.s2-heatmap-wrapper {
    font-family: var(--font-sans, 'Inter', sans-serif);
    user-select: none;
}

/* Content expands to its natural width, the container scrolls horizontally (prevents breaking the page on narrow screens / the full-year view) */
.s2-heatmap-scroll {
    overflow-x: auto;
}

.s2-heatmap-inner {
    /* Natural content width (grid width), the month row and legend both follow the grid alignment; narrow screens scroll horizontally via the outer element */
    width: max-content;
}

.s2-heatmap-months {
    position: relative;
    height: 15px;
    margin-bottom: 4px;
    /* Aligned with the weekday label column below (16px + 4px gap) */
    margin-left: 20px;
    font-size: 11px;
    color: var(--s2-text-muted, #646c82);
    font-family: var(--font-sans, 'Inter', sans-serif);
}

.s2-heatmap-month-label {
    position: absolute;
    top: 0;
    white-space: nowrap;
}

.s2-heatmap-body {
    display: flex;
    gap: 4px;
    width: max-content;
}

.s2-heatmap-weekdays {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 16px;
    flex-shrink: 0;
}

.s2-heatmap-weekday-label {
    height: var(--cell-size, 14px);
    line-height: var(--cell-size, 14px);
    font-size: 10px;
    color: var(--s2-text-muted, #646c82);
    text-align: right;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
}

.s2-heatmap-grid {
    display: grid;
    grid-template-rows: repeat(7, var(--cell-size, 14px));
    /* Fixed week column width, avoiding the auto column being stretched and throwing the cells out of line with the month labels */
    grid-auto-columns: var(--cell-size, 14px);
    grid-auto-flow: column;
    gap: 2px;
}

.s2-heatmap-cell {
    width: var(--cell-size, 14px);
    height: var(--cell-size, 14px);
    border-radius: 2px;
    transition:
        opacity 0.15s,
        background-color var(--s2-transition, 0.3s cubic-bezier(0.4, 0, 0.2, 1));
}

.s2-heatmap-cell:hover {
    opacity: 0.7;
    outline: 1px solid var(--s2-text-muted, #646c82);
    outline-offset: -1px;
}

.s2-heatmap-cell:focus-visible {
    outline: 2px solid var(--brand, #7c5cff);
    outline-offset: 1px;
    opacity: 1;
}

/* Color levels — cyan → blue → purple duotone scale */
.s2-color-level-0 {
    background-color: var(--s2-border-light, #eff1f6);
}
.s2-color-level-1 {
    background-color: color-mix(in srgb, var(--cyan, #06b6d4) 35%, transparent);
}
.s2-color-level-2 {
    background-color: color-mix(in srgb, var(--rx, #4c6fff) 55%, transparent);
}
.s2-color-level-3 {
    background-color: color-mix(in srgb, var(--purple, #8b5cf6) 75%, transparent);
}
.s2-color-level-4 {
    background-color: var(--purple, #8b5cf6);
}

.s2-heatmap-legend {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 3px;
    margin-top: 6px;
    padding-right: 4px;
}

.s2-heatmap-legend-label {
    font-size: 11px;
    color: var(--s2-text-muted, #646c82);
}

.s2-legend-cell {
    display: inline-block;
    /* Sized from the same token as the cells so the legend keeps tracking the grid scale, but
       declared here rather than borrowed from .s2-heatmap-cell: the swatch is not a data cell */
    width: var(--cell-size, 14px);
    height: var(--cell-size, 14px);
    border-radius: 2px;
}

@media (--mobile) {
    .s2-heatmap-cell {
        width: 10px;
        height: 10px;
        border-radius: 1px;
    }
    .s2-legend-cell {
        width: 10px;
        height: 10px;
        border-radius: 1px;
    }
    .s2-heatmap-grid {
        gap: 1px;
    }
    .s2-heatmap-body {
        gap: 2px;
    }
    .s2-heatmap-months {
        margin-left: 18px;
    }
    .s2-heatmap-weekday-label {
        font-size: 8px;
        height: 10px;
        line-height: 10px;
    }
    .s2-heatmap-month-label {
        font-size: 9px;
    }
    .s2-heatmap-wrapper {
        --cell-size: 10px !important;
    }
}
</style>

<style>
/* CalendarHeatmap dark mode — global scope for :root.dark access */
:root.dark .s2-color-level-0 {
    background-color: var(--s2-border-light) !important;
}
:root.dark .s2-color-level-1 {
    background-color: color-mix(in srgb, var(--cyan, #06b6d4) 35%, var(--s2-bg)) !important;
}
:root.dark .s2-color-level-2 {
    background-color: color-mix(in srgb, var(--rx, #4c6fff) 55%, var(--s2-bg)) !important;
}
:root.dark .s2-color-level-3 {
    background-color: color-mix(in srgb, var(--purple, #8b5cf6) 75%, var(--s2-bg)) !important;
}
:root.dark .s2-color-level-4 {
    background-color: color-mix(in srgb, var(--purple, #8b5cf6) 90%, var(--s2-text)) !important;
}
</style>
