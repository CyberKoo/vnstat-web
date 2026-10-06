<template>
    <div ref="gridRef" class="s2-year-cards">
        <div v-for="(card, cardIdx) in cards" :key="card.year" class="s2-year-card">
            <div class="s2-year-card-head">
                <span class="s2-year-card-year">{{ card.year }}</span>
                <span v-if="card.inProgress" class="s2-year-card-badge">{{ t('chart.yearCard.inProgress') }}</span>
                <span v-if="card.yoyPercent != null" class="s2-year-card-yoy">
                    {{ t('chart.yearCard.yoy', { percent: yoyText(card.yoyPercent) }) }}
                </span>
            </div>
            <div class="s2-year-card-total">{{ formatBytes(card.total, 1).formatted }}</div>
            <div class="s2-year-card-sub">
                {{ t('chart.yearCard.monthlyAvg', { value: formatBytes(card.monthlyAvg, 1).formatted }) }}
                <template v-if="card.peakMonth">
                    ·
                    {{
                        t('chart.yearCard.peak', {
                            month: card.peakMonth.label,
                            value: formatBytes(card.peakMonth.value, 1).formatted,
                        })
                    }}
                </template>
            </div>
            <div class="s2-year-card-share">
                <div class="s2-year-card-share-track">
                    <div class="s2-year-card-share-rx" :style="{ width: `${card.rxShare * 100}%` }" />
                </div>
                <span class="s2-year-card-share-label">{{
                    t('chart.yearCard.rxShare', { percent: formatDecimal(card.rxShare * 100, 1) })
                }}</span>
            </div>
            <!-- Mini month bars (button-like: one Tab stop for all cards, arrows walk the bars) -->
            <div class="s2-year-card-months">
                <div
                    v-for="(v, i) in card.monthly"
                    :key="i"
                    class="s2-year-card-mbar"
                    :class="{ 'is-empty': v == null, 'is-current': card.inProgress && i === currentMonthIdx }"
                    :style="{ height: barHeight(v, card.monthly) }"
                    role="button"
                    :tabindex="roving.tabIndex(cardIdx * 12 + i)"
                    :aria-label="monthBarTitle(i, v)"
                    @click="onBarTap(i, v, $event)"
                    @keydown="onBarKeydown($event, cardIdx * 12 + i, i, v)"
                    @focus="onBarFocus(cardIdx * 12 + i, i, v, $event)"
                    @blur="onBarBlur"
                    @pointerenter="onBarHover(i, v, $event)"
                    @pointerleave="onBarLeave"
                />
            </div>
        </div>

        <!-- Bar info bubble (hover on desktop, tap on touch; the native title tooltip never appears on touch) -->
        <Teleport to="body">
            <Transition name="s2-tooltip">
                <div v-if="tipVisible" :ref="setTipEl" class="s2-tooltip s2-cell-tip" :style="tipStyle" role="tooltip">
                    {{ tipContent }}
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

import type { YearCard } from '@/composables/yearOverYear';
import { LOCALE_DAYJS, resolveAppLocale } from '@/config/locales';
import { useDayjs } from '@/composables/useDayjs';
import { useCellTooltip } from '@/composables/useCellTooltip';
import { useRovingCells } from '@/composables/useRovingCells';
import { formatBytes } from '@/utils/bytes';
import { formatDecimal } from '@/utils/numbers';

const props = defineProps<{
    /** Year comparison cards (built by buildYearCards, ascending by year) */
    cards: YearCard[];
}>();

const { t, locale } = useI18n();
const dayjs = useDayjs();

/** Current month index (0-11), used to highlight the in-progress month */
const currentMonthIdx = new Date().getMonth();

/** Signed percent text for the year-over-year figure (e.g. "+12.3%" / "-4.0%") */
function yoyText(pct: number): string {
    return `${pct >= 0 ? '+' : ''}${formatDecimal(pct, 1)}%`;
}

/** Localized short month name (dayjs "MMM", e.g. "Jan" in English), following the UI language */
function monthName(monthIdx: number): string {
    return dayjs().locale(LOCALE_DAYJS[resolveAppLocale(locale.value)]).date(1).month(monthIdx).format('MMM');
}

/** Mini bar bubble text: the month plus the value ("--" for months without records) */
function monthBarTitle(monthIdx: number, value: number | null): string {
    return `${monthName(monthIdx)} ${value != null ? formatBytes(value, 1).formatted : '--'}`;
}

/**
 * Bar info bubble: hover shows it on desktop, tap shows it on touch, and a touch anywhere else
 * dismisses it. The selector spans the month bars of every card in the grid.
 */
const {
    visible: tipVisible,
    content: tipContent,
    style: tipStyle,
    setTipEl,
    showForEl,
    hide: hideTip,
} = useCellTooltip('.s2-year-card-months .s2-year-card-mbar');

/**
 * Visual column count of the auto-fit card grid, measured on demand: the track count changes with
 * the container width, so the Up/Down step (one card row = columns × 12 months) cannot be a constant
 */
function cardColumns(): number {
    const cards = Array.from(gridRef.value?.children ?? []) as HTMLElement[];
    if (cards.length < 2) return 1;
    const firstRowTop = cards[0].offsetTop;
    let columns = 0;
    for (const card of cards) {
        if (card.offsetTop !== firstRowTop) break;
        columns++;
    }
    return Math.max(columns, 1);
}

/** All cards share a single Tab stop; arrows walk the bars (Left/Right = ±1 month, Up/Down = one visual card row, same month) */
const gridRef = ref<HTMLDivElement>();
const roving = useRovingCells(gridRef, '.s2-year-card-months .s2-year-card-mbar', () => props.cards.length * 12, {
    horizontal: 1,
    vertical: () => cardColumns() * 12,
});

/** Hover shows the bubble on desktop only (touch also fires pointerenter on tap; the click path handles that) */
function onBarHover(monthIdx: number, value: number | null, event: PointerEvent) {
    if (event.pointerType !== 'mouse') return;
    showForEl(event.currentTarget as HTMLElement, monthBarTitle(monthIdx, value));
}

function onBarLeave(event: PointerEvent) {
    if (event.pointerType !== 'mouse') return;
    hideTip();
}

/** Tap (or mouse click; the bars have no other action) shows the bubble against the bar */
function onBarTap(monthIdx: number, value: number | null, event: MouseEvent) {
    showForEl(event.currentTarget as HTMLElement, monthBarTitle(monthIdx, value));
}

function onBarKeydown(event: KeyboardEvent, i: number, monthIdx: number, value: number | null) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showForEl(event.currentTarget as HTMLElement, monthBarTitle(monthIdx, value));
        return;
    }
    roving.onKeydown(event, i);
}

/** Keyboard focus shows the same bubble hover would */
function onBarFocus(i: number, monthIdx: number, value: number | null, event: FocusEvent) {
    roving.syncActive(i);
    showForEl(event.currentTarget as HTMLElement, monthBarTitle(monthIdx, value));
}

function onBarBlur() {
    hideTip();
}

/** Mini bar height: normalized against the card's peak; months without records show as short ghost bars */
function barHeight(v: number | null, monthly: (number | null)[]): string {
    if (v == null) return '3px';
    const max = Math.max(...monthly.filter((x): x is number => x != null), 1);
    return `${Math.max(8, (v / max) * 100)}%`;
}
</script>

<style scoped>
.s2-year-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 16px;
}

.s2-year-card {
    padding: 16px 18px 14px;
    border: 1px solid var(--s2-border-light);
    transition: border-color var(--s2-transition);
    border-radius: var(--s2-radius-sm);
    background: var(--s2-card);
}

.s2-year-card-head {
    display: flex;
    align-items: baseline;
    gap: 8px;
}

.s2-year-card-year {
    font-family: var(--font-mono);
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: var(--s2-text);
}

.s2-year-card-badge {
    padding: 1px 7px;
    border-radius: 999px;
    background: var(--brand-bg, rgba(124, 92, 255, 0.1));
    color: var(--brand);
    font-size: 10px;
    font-weight: 600;
    line-height: 1.6;
}

.s2-year-card-yoy {
    margin-left: auto;
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 600;
    color: var(--s2-text-muted);
}

.s2-year-card-total {
    margin-top: 8px;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: clamp(20px, 2vw, 28px);
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.15;
    color: var(--brand);
}

.s2-year-card-sub {
    margin-top: 6px;
    font-size: 12px;
    color: var(--s2-text-muted);
}

.s2-year-card-share {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 12px;
}

.s2-year-card-share-track {
    flex: 1;
    height: 5px;
    border-radius: 999px;
    background: var(--tx);
    overflow: hidden;
    display: flex;
}

.s2-year-card-share-rx {
    height: 100%;
    background: var(--rx);
}

.s2-year-card-share-label {
    flex-shrink: 0;
    font-size: 11px;
    color: var(--s2-text-muted);
}

.s2-year-card-months {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 32px;
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--s2-border-light);
    transition: border-color var(--s2-transition);
}

.s2-year-card-mbar {
    flex: 1;
    min-width: 0;
    border-radius: 2px 2px 0 0;
    background: color-mix(in srgb, var(--rx) 55%, transparent);
    transition: background-color var(--s2-transition);
}

.s2-year-card-mbar.is-empty {
    background: var(--s2-border-light);
}

.s2-year-card-mbar:focus-visible {
    outline: 2px solid var(--brand);
    outline-offset: 1px;
}

.s2-year-card-mbar.is-current {
    background: var(--accent);
}

@media (--mobile) {
    .s2-year-cards {
        grid-template-columns: 1fr;
    }
}
</style>
