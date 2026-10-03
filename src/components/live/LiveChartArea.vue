<template>
    <div class="s2-live-chart">
        <h2 class="s2-section-label">
            {{ t('live.chart.title') }}
            <span v-if="hasHistory" class="s2-section-hint">{{ t('live.chart.historyHint') }}</span>
        </h2>

        <!-- Rate threshold settings -->
        <div class="s2-chart-tools">
            <button
                ref="thrBtn"
                class="s2-tool-btn"
                :class="{ active: thresholdSet }"
                :title="thresholdBtnTitle"
                :aria-label="thresholdBtnTitle"
                :aria-expanded="thrOpen"
                @click="toggleThrPanel"
            >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path
                        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                    />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
            </button>
            <!-- Mask and panel live at body level: inside the sheet, backdrop-filter would make the
                 card the containing block for the fixed mask, so clicks outside the card never reached it -->
            <Teleport to="body">
                <div v-if="thrOpen" class="s2-thr-mask" @click="closeThrPanel"></div>
                <div
                    v-if="thrOpen"
                    ref="thrPanel"
                    class="s2-thr-panel"
                    :style="thrPanelStyle"
                    role="group"
                    :aria-label="t('live.chart.thresholdTitle')"
                    @keydown.esc="closeThrPanel"
                    @keydown="onThrPanelKeydown"
                    @focusout="onThrFocusout"
                >
                    <div class="s2-thr-title">{{ t('live.chart.thresholdTitle') }}</div>
                    <div class="s2-thr-row">
                        <input
                            ref="thrInputEl"
                            v-model="thrInput"
                            type="number"
                            min="0"
                            step="1"
                            class="s2-thr-input"
                            :placeholder="t('live.chart.thresholdPlaceholder')"
                            :aria-label="t('live.chart.thresholdLabel')"
                            :aria-describedby="thrUnitId"
                            @change="applyThrInput"
                        />
                        <span :id="thrUnitId" class="s2-thr-unit">Mbps</span>
                    </div>
                    <div class="s2-thr-foot">
                        <button class="s2-thr-clear" :disabled="!thresholdSet" @click="clearThreshold">
                            {{ t('live.chart.thresholdClear') }}
                        </button>
                        <span class="s2-thr-state">{{ thresholdState }}</span>
                    </div>
                </div>
            </Teleport>
        </div>

        <!-- Replay status bar -->
        <div v-if="isReplaying" class="s2-replay-bar">
            <span class="s2-replay-dot"></span>
            <span class="s2-replay-text">{{ t('live.chart.replaying') }} &middot; {{ replayLabelFull }}</span>
            <button class="s2-replay-exit" @click="exitReplay">{{ t('live.chart.exitReplay') }}</button>
        </div>

        <!-- Replay timeline -->
        <div v-if="hasHistory" class="s2-replay-row">
            <span class="s2-replay-tag">{{
                isReplaying ? t('live.chart.replayTag') : t('live.chart.historyTag')
            }}</span>
            <input
                type="range"
                class="s2-replay-slider"
                :min="sliderMin"
                :max="sliderMax"
                :step="FIVEMINUTE_INTERVAL_SEC"
                :value="sliderTs"
                :style="{ '--fill': sliderFillPct + '%' }"
                :aria-label="t('live.chart.replayTimeline')"
                :aria-valuetext="isReplaying ? replayLabelFull : t('live.chart.liveTag')"
                @input="onSliderInput"
            />
            <span class="s2-replay-time mono">{{ isReplaying ? replayLabelShort : t('live.chart.liveTag') }}</span>
        </div>

        <div class="s2-live-chart-body">
            <div class="s2-chart-box s2-chart-main">
                <RealTimeLine :latest-traffic="latestTraffic" :is-dark="isDark" :replay="replay" />
                <!-- The first SSE frame can take a moment (connect/backoff); bare axes alone read
                     as a flat zero line, so say what is actually happening -->
                <div v-if="!latestTraffic && !isReplaying" class="s2-chart-connecting" role="status">
                    {{ t('live.chart.connecting') }}
                </div>
            </div>
            <div class="s2-sidebar-glass s2-sidebar-fixed">
                <div class="s2-sidebar-item">
                    <div class="s2-sidebar-label">
                        {{ t('live.sidebar.peak') }} <span v-if="minMaxWindow" class="muted">{{ minMaxWindow }}</span>
                    </div>
                    <div class="s2-sidebar-value">
                        {{ peakValue }} <span class="muted">{{ peakAt }}</span>
                    </div>
                </div>
                <div class="s2-sidebar-item">
                    <div class="s2-sidebar-label">
                        {{ t('live.sidebar.trough') }}
                        <span v-if="minMaxWindow" class="muted">{{ minMaxWindow }}</span>
                    </div>
                    <div class="s2-sidebar-value">
                        {{ troughValue }} <span class="muted">{{ troughAt }}</span>
                    </div>
                </div>
                <div class="s2-sidebar-item">
                    <div class="s2-sidebar-label">{{ t('live.sidebar.fiveMinTotal') }}</div>
                    <div class="s2-sidebar-value">{{ fiveMinTotal }}</div>
                </div>
                <div class="s2-sidebar-item">
                    <div class="s2-sidebar-label">{{ t('live.sidebar.uptime') }}</div>
                    <div class="s2-sidebar-value">
                        <template v-if="daysSinceCreation !== null">
                            {{ uptimeDays }} <span class="muted">{{ sinceCreated }}</span>
                        </template>
                        <template v-else>-</template>
                    </div>
                </div>
                <div class="s2-sidebar-item">
                    <div class="s2-sidebar-label">{{ t('live.sidebar.monthlyTotal') }}</div>
                    <div class="s2-sidebar-value">
                        {{ monthlyTotal.formatted }} <span class="muted">/ {{ grandTotal.formatted }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, useId, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import RealTimeLine from '@/components/live/RealTimeLine.vue';

import { useDayjs } from '@/composables/useDayjs';
import { buildReplayWindow, FIVEMINUTE_INTERVAL_SEC, type ReplayWindow } from '@/composables/replayWindow';
import { useAnchoredPanel } from '@/composables/useAnchoredPanel';
import { useSettingsStore } from '@/stores/settings';
import { focusNeighbor } from '@/utils/focus';
import type { TimedNetworkStats, TrafficItem } from '@/types/network';

const props = defineProps<{
    latestTraffic: TimedNetworkStats | null;
    isDark: boolean;
    fiveMinuteItems: TrafficItem[];
    peakValue: string;
    peakTimeStr: string;
    fiveMinTotal: string;
    troughValue: string;
    troughTimeStr: string;
    minMaxWindow: string;
    daysSinceCreation: number | null;
    createdDate: string;
    monthlyTotal: { formatted: string };
    grandTotal: { formatted: string };
}>();

const dayjs = useDayjs();
const settingsStore = useSettingsStore();
const { t } = useI18n();

// ── Replay ──

/** Whether the historical data is replayable (fiveminute needs at least 2 entries before the timeline is shown) */
const hasHistory = computed(() => props.fiveMinuteItems.length >= 2);

const sliderMin = computed(() => props.fiveMinuteItems[0]?.timestamp ?? 0);
const sliderMax = computed(() => props.fiveMinuteItems[props.fiveMinuteItems.length - 1]?.timestamp ?? 0);

const isReplaying = ref(false);
const replayTs = ref<number | null>(null);

/** Current replay window; null when not replaying or the window has no data */
const replay = computed<ReplayWindow | null>(() => {
    if (!isReplaying.value || replayTs.value == null) return null;
    const w = buildReplayWindow(props.fiveMinuteItems, replayTs.value);
    return w.x.length > 0 ? w : null;
});

const sliderTs = computed(() => (isReplaying.value && replayTs.value != null ? replayTs.value : sliderMax.value));
const sliderFillPct = computed(() => {
    const range = sliderMax.value - sliderMin.value;
    return range > 0 ? ((sliderTs.value - sliderMin.value) / range) * 100 : 100;
});

/** Full time in the status bar (locale date + time) */
const replayLabelFull = computed(() =>
    replayTs.value != null ? dayjs.unix(replayTs.value).format(t('common.format.dateTime')) : '',
);
/** Compact time on the right of the timeline (locale short date + time) */
const replayLabelShort = computed(() =>
    replayTs.value != null ? dayjs.unix(replayTs.value).format(t('common.format.dateTimeShort')) : '',
);

function onSliderInput(ev: Event) {
    const v = Number((ev.target as HTMLInputElement).value);
    if (!Number.isFinite(v)) return;
    replayTs.value = v;
    isReplaying.value = true;
}

function exitReplay() {
    isReplaying.value = false;
    replayTs.value = null;
}

// The time range changes on interface switch / detail refresh, so exit the replay to avoid a stale window
watch(
    () => props.fiveMinuteItems,
    () => exitReplay(),
);

// ── Rate threshold ──

const thrOpen = ref(false);
const thrInput = ref('');
const thrBtn = ref<HTMLElement>();
const thrPanel = ref<HTMLElement>();
const thrInputEl = ref<HTMLInputElement>();
const thrUnitId = useId();
const { panelStyle: thrPanelStyle } = useAnchoredPanel(thrBtn, thrPanel, thrOpen);

const thresholdSet = computed(() => settingsStore.liveThresholdMbps != null);

/** Threshold button tooltip and panel state line, each a whole translated sentence */
const thresholdBtnTitle = computed(() =>
    thresholdSet.value
        ? t('live.chart.thresholdActive', { value: settingsStore.liveThresholdMbps })
        : t('live.chart.thresholdSet'),
);
const thresholdState = computed(() =>
    thresholdSet.value
        ? t('live.chart.thresholdOn', { value: settingsStore.liveThresholdMbps })
        : t('live.chart.thresholdOff'),
);

// ── Sidebar value annotations (composed sentences, translated as a whole) ──

const peakAt = computed(() => t('live.sidebar.at', { time: props.peakTimeStr }));
const troughAt = computed(() => t('live.sidebar.at', { time: props.troughTimeStr }));
const uptimeDays = computed(() => t('live.sidebar.days', { count: props.daysSinceCreation }));
const sinceCreated = computed(() => t('live.sidebar.since', { date: props.createdDate }));

function toggleThrPanel() {
    thrOpen.value = !thrOpen.value;
    if (thrOpen.value) {
        thrInput.value = settingsStore.liveThresholdMbps?.toString() ?? '';
        // The panel is teleported to the end of <body>, so without this a keyboard user would
        // have to Tab through the rest of the page to reach it
        void nextTick(() => thrInputEl.value?.focus());
    }
}

/** Escape / mask click: close and return focus to the trigger button */
function closeThrPanel() {
    thrOpen.value = false;
    thrBtn.value?.focus();
}

/** Last Tab direction inside the panel — tells the focusout handoff which way to walk */
let thrTabDirection: 'forward' | 'backward' = 'forward';

function onThrPanelKeydown(event: KeyboardEvent) {
    if (event.key === 'Tab') thrTabDirection = event.shiftKey ? 'backward' : 'forward';
}

/**
 * Non-modal popover: focus leaving the panel dismisses it. The panel is teleported to <body>'s
 * end, so the native tab order would leave the page (Tab past the last element strands focus on
 * the browser chrome) — hand it to the trigger's neighbor in the Tab direction instead, after the
 * panel has unmounted so its own controls cannot be chosen.
 */
function onThrFocusout(event: FocusEvent) {
    if (thrPanel.value?.contains(event.relatedTarget as Node)) return;
    thrOpen.value = false;
    void nextTick(() => {
        if (!focusNeighbor(thrBtn.value, thrTabDirection)) thrBtn.value?.focus();
    });
}

function applyThrInput() {
    // v-model on a type="number" input may return a number, so handle it uniformly as a string
    const raw = String(thrInput.value ?? '').trim();
    if (raw === '') {
        settingsStore.liveThresholdMbps = null;
        return;
    }
    const v = Number(raw);
    settingsStore.liveThresholdMbps = Number.isFinite(v) && v > 0 ? v : null;
}

function clearThreshold() {
    settingsStore.liveThresholdMbps = null;
    thrInput.value = '';
}
</script>

<style scoped>
.s2-live-chart {
    position: relative;
}

/* The threshold tool floats absolutely at the top-right corner; keep the
   label row (title + history hint) clear of it so the hint is never covered. */
.s2-live-chart .s2-section-label {
    padding-right: 44px;
}

.s2-live-chart-body {
    display: flex;
    gap: 24px;
    min-height: 0;
    max-height: 475px;
}

.s2-chart-main {
    min-height: 200px;
    position: relative;
    padding-top: 4px;
}

.s2-chart-main :deep(canvas) {
    width: 100% !important;
    height: 100% !important;
    min-height: 180px;
}

/* ── Top-right section tool (threshold settings) ── */
.s2-chart-tools {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 20;
}

.s2-tool-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border: 1px solid var(--s2-border);
    border-radius: var(--s2-radius-xs);
    background: var(--s2-glass-bg-strong);
    backdrop-filter: blur(var(--s2-glass-blur)) saturate(var(--s2-glass-saturate));
    -webkit-backdrop-filter: blur(var(--s2-glass-blur)) saturate(var(--s2-glass-saturate));
    color: var(--s2-text-muted);
    cursor: pointer;
    transition: all var(--s2-transition);
}

.s2-tool-btn:hover {
    color: var(--s2-text);
    border-color: var(--s2-text-muted);
}

.s2-tool-btn.active {
    color: var(--danger);
    border-color: var(--danger);
}

/* Transparent overlay: closes on a click anywhere outside the panel. Teleported to <body>,
   so this really is viewport-wide (see useAnchoredPanel) */
.s2-thr-mask {
    position: fixed;
    inset: 0;
    z-index: 29;
}

/* Teleported to <body>; the inline style from useAnchoredPanel supplies top/left */
.s2-thr-panel {
    position: fixed;
    z-index: 30;
    width: 208px;
    padding: 12px;
    background: var(--s2-glass-bg-strong);
    backdrop-filter: blur(var(--s2-glass-blur)) saturate(var(--s2-glass-saturate));
    -webkit-backdrop-filter: blur(var(--s2-glass-blur)) saturate(var(--s2-glass-saturate));
    border: 1px solid var(--s2-glass-border);
    border-radius: var(--s2-radius-sm);
    box-shadow: var(--s2-shadow-lg);
}

.s2-thr-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--s2-text);
    margin-bottom: 8px;
}

.s2-thr-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.s2-thr-input {
    flex: 1;
    min-width: 0;
    height: 28px;
    padding: 0 8px;
    border: 1px solid var(--s2-border);
    border-radius: var(--s2-radius-xs);
    background: var(--s2-card);
    color: var(--s2-text);
    font-family: var(--font-mono);
    font-size: 12px;
    outline: none;
    transition: border-color var(--s2-transition);
}

.s2-thr-input:focus {
    border-color: var(--brand);
}

.s2-thr-unit {
    font-size: 11px;
    color: var(--s2-text-muted);
    flex-shrink: 0;
}

.s2-thr-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
}

.s2-thr-clear {
    padding: 3px 10px;
    border: 1px solid var(--s2-border);
    border-radius: var(--s2-radius-xs);
    background: transparent;
    color: var(--s2-text-muted);
    font-size: 12px;
    font-family: var(--font-sans);
    cursor: pointer;
    transition: all var(--s2-transition);
}

.s2-thr-clear:hover:not(:disabled) {
    color: var(--danger);
    border-color: var(--danger);
}

/* disabled opacity/cursor come from the shared control-state rules in theme-s2.css */

.s2-thr-state {
    font-size: 11px;
    color: var(--s2-text-muted);
    font-family: var(--font-mono);
}

/* ── Replay status bar ── */
.s2-replay-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: -6px 0 12px;
    padding: 7px 12px;
    background: var(--s2-glass-bg-strong);
    backdrop-filter: blur(var(--s2-glass-blur)) saturate(var(--s2-glass-saturate));
    -webkit-backdrop-filter: blur(var(--s2-glass-blur)) saturate(var(--s2-glass-saturate));
    border: 1px solid var(--s2-glass-border);
    border-left: 3px solid var(--accent);
    border-radius: var(--s2-radius-sm);
    box-shadow: var(--s2-shadow);
    font-size: 12px;
    color: var(--s2-text);
}

.s2-replay-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent);
    flex-shrink: 0;
    animation: s2-replay-pulse 1.6s ease-in-out infinite;
}

@keyframes s2-replay-pulse {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.35;
    }
}

/* Decorative heartbeat on an 8px dot: hold it solid instead of pulsing forever. The dot itself
   already says "replay is active". Guarded here because the animation lives in this scoped block. */
@media (prefers-reduced-motion: reduce) {
    .s2-replay-dot {
        animation: none;
    }
}

.s2-replay-text {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
}

.s2-replay-exit {
    margin-left: auto;
    padding: 3px 12px;
    border: 1px solid var(--brand);
    border-radius: var(--s2-radius-xs);
    background: transparent;
    color: var(--brand);
    font-size: 12px;
    font-family: var(--font-sans);
    cursor: pointer;
    transition: all var(--s2-transition);
}

.s2-replay-exit:hover:not(:disabled) {
    background: var(--s2-hover-bg);
}

/* ── Replay timeline ── */
.s2-replay-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: -6px 0 14px;
}

.s2-replay-tag {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--s2-text-muted);
    min-width: 34px;
    flex-shrink: 0;
    text-transform: uppercase;
}

.s2-replay-slider {
    flex: 1;
    min-width: 0;
    height: 4px;
    border-radius: 999px;
    appearance: none;
    -webkit-appearance: none;
    outline: none;
    cursor: pointer;
    background: linear-gradient(90deg, var(--brand) var(--fill, 100%), var(--s2-border-light) var(--fill, 100%));
}

.s2-replay-slider::-webkit-slider-thumb {
    appearance: none;
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--s2-card);
    border: 2px solid var(--brand);
    box-shadow: var(--s2-shadow);
    cursor: grab;
    transition: transform 0.15s ease;
}

.s2-replay-slider::-webkit-slider-thumb:hover {
    transform: scale(1.15);
}

.s2-replay-slider::-moz-range-thumb {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--s2-card);
    border: 2px solid var(--brand);
    box-shadow: var(--s2-shadow);
    cursor: grab;
}

.s2-replay-slider::-moz-range-track {
    background: transparent;
}

.s2-replay-time {
    width: 96px;
    flex-shrink: 0;
    text-align: right;
    font-size: 11px;
    color: var(--s2-text-muted);
    font-variant-numeric: tabular-nums;
}

/* Keep a thin hairline divider between the sidebar rows */
.s2-sidebar-item {
    margin-bottom: 0;
    padding: 10px 0;
    border-bottom: 1px solid var(--s2-border-light);
    transition: border-color var(--s2-transition);
}

.s2-sidebar-item:first-child {
    padding-top: 0;
}

.s2-sidebar-item:last-child {
    padding-bottom: 0;
    border-bottom: none;
}

.s2-sidebar-value {
    font-family: var(--font-mono);
    font-size: 15px;
    font-weight: 500;
    color: var(--s2-text);
}

.s2-sidebar-value .muted {
    color: var(--s2-text-muted);
    font-size: 13px;
    font-weight: 400;
}

@media (--mobile) {
    .s2-live-chart-body {
        flex-direction: column;
        max-height: none;
    }
    .s2-chart-main {
        overflow: hidden;
        min-height: 150px;
    }
    .s2-replay-row {
        gap: 8px;
    }
    .s2-replay-time {
        width: 84px;
        font-size: 10px;
    }
}
</style>
