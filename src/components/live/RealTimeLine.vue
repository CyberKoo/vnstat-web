<template>
    <div class="s2-rt-line-wrap">
        <div ref="containerRef" class="s2-rt-line"></div>
    </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import uPlot from 'uplot';
import { useI18n } from 'vue-i18n';
import 'uplot/dist/uPlot.min.css';

import { useMobile } from '@/composables/useMobile';
import { useRealtimeBuffer } from '@/composables/useRealtimeBuffer';
import { useUnitMode } from '@/composables/useUnitMode';
import { buildThresholdMarkers, mbpsToBytesPerSec } from '@/composables/liveThreshold';
import type { ReplayWindow } from '@/composables/replayWindow';
import { buildOpts, getColors, rxShare, sideSpan, sideTicks } from '@/composables/uplotConfig';
import type { UplotOverlay } from '@/composables/uplotConfig';
import { useSettingsStore } from '@/stores/settings';
import type { TimedNetworkStats } from '@/types/network';

const props = defineProps<{
    latestTraffic: TimedNetworkStats | null;
    isDark: boolean;
    /** Replay window; null means realtime mode (SSE rolling window) */
    replay: ReplayWindow | null;
}>();

const containerRef = ref<HTMLDivElement>();
const { isMobile } = useMobile();
const { locale } = useI18n();

// ── Settings: rate threshold (Mbps → bytes/s) ──
const settingsStore = useSettingsStore();
const thresholdBps = computed(() =>
    settingsStore.liveThresholdMbps != null ? mbpsToBytesPerSec(settingsStore.liveThresholdMbps) : null,
);

// ── Composable: Buffer ──
const { MAX_POINTS, WINDOW_MS, bufX, clearBuffer, appendBuffer, trimBuffer, getDisplayData, emptyInitData } =
    useRealtimeBuffer();

// ── Composable: Unit mode (sourced from the global settings store) ──
const { unitMode, formatRate, commitUnitMode } = useUnitMode();

// ── uPlot state ──
let plot: uPlot | null = null;
let _ro: ResizeObserver | null = null;
let rafId = 0;
let fadeTimer: ReturnType<typeof setTimeout> | null = null;
/** Whether the replay view is currently active (driven by props.replay) */
let inReplay = false;
/**
 * Per-direction display spans and tick values for the normalized chart data; refreshed by
 * withMarkers on every data push, read by the overlay painter, the tooltip and the mobile labels
 */
let curSpans: Pick<UplotOverlay, 'rxSpan' | 'rxTicks' | 'txSpan' | 'txTicks' | 'yShare'> = {
    rxSpan: 0,
    rxTicks: [0],
    txSpan: 0,
    txTicks: [0],
    yShare: 0.5,
};

// ── Overlay getter: reads the latest threshold / replay state on every redraw ──
const getOverlay = (): UplotOverlay => {
    const w = props.replay;
    return {
        thresholdBps: thresholdBps.value,
        replayTs: w?.centerTs ?? null,
        replayRx: w && w.centerIdx >= 0 ? (w.rx[w.centerIdx] ?? null) : null,
        replayTx: w && w.centerIdx >= 0 ? (w.tx[w.centerIdx] ?? null) : null,
        ...curSpans,
    };
};

/** Largest non-null value in an array-like (0 when empty) */
function maxOf(arr: ArrayLike<number | null>): number {
    let m = 0;
    for (let i = 0; i < arr.length; i++) {
        const v = arr[i];
        if (v != null && v > m) m = v;
    }
    return m;
}

/**
 * Largest value among the samples inside the trailing `windowSec` seconds: the buffer can span
 * more wall time than the visible window (samples arrive slower than 1/s), so a peak that already
 * slid out of view must not keep inflating the display span.
 */
function maxOfWindow(x: ArrayLike<number | null>, arr: ArrayLike<number | null>, windowSec: number): number {
    let last = 0;
    for (let i = x.length - 1; i >= 0; i--) {
        const xv = x[i];
        if (xv != null) {
            last = xv;
            break;
        }
    }
    const cutoff = last - windowSec;
    let m = 0;
    for (let i = 0; i < arr.length; i++) {
        const xv = x[i];
        if (xv == null || xv < cutoff) continue;
        const v = arr[i];
        if (v != null && v > m) m = v;
    }
    return m;
}

/**
 * Normalize the data for the mirrored chart and append threshold-breach markers (the 4th/5th
 * series). Each direction is scaled by (v / own span) × own height share, so the two halves are
 * both independent in their tick scales and split in proportion to the traffic (clamped to
 * [1/4, 3/4], see rxShare). `windowSec` limits the span computation to the visible window for
 * live data; pass null for replay windows (the whole array is the window).
 */
function withMarkers(
    x: ArrayLike<number | null>,
    rx: ArrayLike<number | null>,
    tx: ArrayLike<number | null>,
    windowSec: number | null = null,
) {
    const thr = thresholdBps.value;
    const maxRx = windowSec == null ? maxOf(rx) : maxOfWindow(x, rx, windowSec);
    const maxTx = windowSec == null ? maxOf(tx) : maxOfWindow(x, tx, windowSec);
    const rxSide = sideSpan(maxRx);
    const txSide = sideSpan(maxTx);
    const share = rxShare(rxSide.span, txSide.span);
    curSpans = {
        rxSpan: rxSide.span,
        rxTicks: sideTicks(rxSide.span, rxSide.step),
        txSpan: txSide.span,
        txTicks: sideTicks(txSide.span, txSide.step),
        yShare: share,
    };
    const kRx = rxSide.span > 0 ? share / rxSide.span : 0;
    const kTx = txSide.span > 0 ? (1 - share) / txSide.span : 0;
    const norm = (v: number | null, k: number): number | null => (v == null || k === 0 ? null : v * k);
    const negate = (v: number | null): number | null => (v == null ? null : -v);
    return [
        x as (number | null)[],
        Array.from(rx, (v) => norm(v, kRx)),
        Array.from(tx, (v) => negate(norm(v, kTx))),
        buildThresholdMarkers(rx, thr).map((v) => norm(v, kRx)),
        buildThresholdMarkers(tx, thr).map((v) => negate(norm(v, kTx))),
    ] as uPlot.AlignedData;
}

/** Current data in realtime mode (normalized, including the threshold-breach markers) */
function liveData(): uPlot.AlignedData {
    if (bufX.length === 0) {
        const init = emptyInitData();
        return withMarkers(init[0], init[1], init[2]);
    }
    const disp = getDisplayData();
    return withMarkers(disp[0], disp[1], disp[2], WINDOW_MS / 1e3);
}

// ── Data push ──
function pushData() {
    if (!plot || bufX.length === 0) return;
    plot.setData(liveData());
}

/** Update mobile floating span labels from the current per-direction display spans */
function updateMobileLabels() {
    const rxEl = containerRef.value?.querySelector('.u-chart-maxlabel.rx') as HTMLElement | null;
    const txEl = containerRef.value?.querySelector('.u-chart-maxlabel.tx') as HTMLElement | null;
    const ov = getOverlay();
    if (rxEl) rxEl.textContent = formatRate(ov.rxSpan, 1);
    if (txEl) txEl.textContent = formatRate(ov.txSpan, 1);
}

/** Enter the replay view: switch to the historical window data and reset the zoom */
function applyReplay(w: ReplayWindow) {
    if (!plot || w.x.length === 0) return;
    inReplay = true;
    plot.setData(withMarkers(w.x, w.rx, w.tx), true);
    plot.setScale('x', { min: w.x[0]!, max: w.x[w.x.length - 1]! });
    updateMobileLabels();
}

/** Exit the replay view: restore the SSE rolling window */
function exitReplayView() {
    if (!plot || !inReplay) return;
    inReplay = false;
    plot.setData(liveData(), true);
    updateMobileLabels();
}

// ── Plot lifecycle ──
function startPlot() {
    const el = containerRef.value;
    if (!el) return;

    if (rafId) cancelAnimationFrame(rafId);
    plot?.destroy();
    plot = null;

    // Clean up leftover mobile max-label elements from previous render
    el.querySelectorAll('.u-chart-maxlabel').forEach((el) => el.remove());

    const rect = el.getBoundingClientRect();
    const colors = getColors(containerRef, props.isDark);
    plot = new uPlot(
        buildOpts({
            width: rect.width,
            height: rect.height,
            isMobile: isMobile.value,
            isDark: props.isDark,
            colors,
            formatRate,
            containerRef,
            windowMs: WINDOW_MS,
            getOverlay,
        }),
        liveData(),
        el,
    );

    // If already in replay state on mount, present the replay window directly
    if (props.replay) applyReplay(props.replay);
    else updateMobileLabels();

    // Slide the x window every frame (the key to smooth animation); the data itself only needs pushing every 500ms
    let lastPush = 0;
    const PUSH_INTERVAL = 500;
    const tick = (ts: number) => {
        if (!plot) return;
        if (!inReplay) {
            if (ts - lastPush >= PUSH_INTERVAL) {
                pushData();
                lastPush = ts;
            }
            const maxS = Date.now() / 1e3;
            plot.setScale('x', { min: maxS - WINDOW_MS / 1e3, max: maxS });
        }
        rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    if (!_ro) {
        _ro = new ResizeObserver(([entry]) => {
            if (!plot) return;
            const { width, height } = entry.contentRect;
            plot.setSize({ width, height });
        });
        _ro.observe(el);
    }
}

onMounted(startPlot);

watch(locale, () => {
    if (!plot) return;
    // recalcAxes refreshes uPlot's cached axis values even with unchanged scales/data.
    plot.redraw(false, true);
    plot.setCursor({ left: plot.cursor.left ?? -10, top: plot.cursor.top ?? -10 });
    updateMobileLabels();
});

watch(isMobile, () => {
    startPlot();
    if (props.replay) applyReplay(props.replay);
});

// Theme switch: canvas grid/axis colors cannot be CSS-transitioned, so fade out, rebuild, then fade in to avoid an instant jump
watch(
    () => props.isDark,
    () => {
        const el = containerRef.value;
        if (!el) return;
        el.style.opacity = '0';
        if (fadeTimer) clearTimeout(fadeTimer);
        fadeTimer = setTimeout(() => {
            startPlot();
            if (props.replay) applyReplay(props.replay);
            el.style.opacity = '1';
        }, 200);
    },
);

onUnmounted(() => {
    if (rafId) cancelAnimationFrame(rafId);
    if (fadeTimer) clearTimeout(fadeTimer);
    _ro?.disconnect();
    _ro = null;
    // Clean up mobile max-label elements on unmount
    containerRef.value?.querySelectorAll('.u-chart-maxlabel').forEach((el) => el.remove());
    plot?.destroy();
    plot = null;
});

watch(
    () => props.replay,
    (w) => {
        if (w) applyReplay(w);
        else exitReplayView();
    },
    { flush: 'sync' },
);

watch(thresholdBps, () => {
    if (!plot) return;
    if (inReplay) {
        if (props.replay) applyReplay(props.replay);
    } else {
        // Only rebuild the data and overlays, keeping the current zoom
        plot.setData(liveData(), false);
    }
});

watch(
    () => props.latestTraffic,
    (latest) => {
        if (!plot) return;

        if (!latest) {
            const el = containerRef.value;
            if (el) el.style.opacity = '0';
            if (fadeTimer) clearTimeout(fadeTimer);
            fadeTimer = setTimeout(() => {
                clearBuffer();
                plot?.setData(liveData());
                if (el) el.style.opacity = '1';
            }, 200);
            return;
        }

        appendBuffer(
            latest.timestamp / 1e3,
            latest.stats.rx?.bytespersecond ?? 0,
            latest.stats.tx?.bytespersecond ?? 0,
        );
        trimBuffer(MAX_POINTS);
        // The replay view is not interrupted by SSE pushes; it resumes immediately on return to realtime
        if (!inReplay) {
            pushData();
            updateMobileLabels();
        }
    },
    { flush: 'sync' },
);

// ── Unit switch (global unit toggle → rebuild to refresh the axis formatting; rebuild takes <16ms, so no fade is needed) ──
watch(unitMode, (newMode) => {
    if (!plot) return;
    commitUnitMode(newMode);
    startPlot();
    if (props.replay) applyReplay(props.replay);
});
</script>

<style scoped>
.s2-rt-line {
    width: 100%;
    height: 100%;
    min-height: 200px;
    transition: opacity 0.2s ease;
    position: relative;
}
.s2-rt-line :deep(canvas) {
    display: block;
}
.s2-rt-line :deep(.u-tt) {
    position: absolute;
    background: var(--s2-glass-bg-strong);
    backdrop-filter: blur(var(--s2-glass-blur)) saturate(var(--s2-glass-saturate));
    -webkit-backdrop-filter: blur(var(--s2-glass-blur)) saturate(var(--s2-glass-saturate));
    border: 1px solid var(--s2-glass-border);
    border-radius: var(--s2-radius-sm);
    padding: 5px 9px;
    font: 12px var(--font-mono, monospace);
    color: var(--s2-text, #1c2333);
    box-shadow: var(--s2-shadow-lg);
    pointer-events: none;
    z-index: 100;
    line-height: 1.5;
    white-space: nowrap;
    transition:
        background var(--s2-transition, 0.3s),
        border-color var(--s2-transition, 0.3s),
        color var(--s2-transition, 0.3s);
}
.s2-rt-line :deep(.u-tt-time) {
    color: var(--s2-text-muted, #646c82);
    font-size: 11px;
    border-bottom: 1px solid var(--s2-border, #d8dce8);
    margin-bottom: 2px;
    padding-bottom: 2px;
    transition:
        color var(--s2-transition, 0.3s),
        border-color var(--s2-transition, 0.3s);
}

.s2-rt-line :deep(.u-axis-label) {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.06em;
    pointer-events: none;
    z-index: 5;
    user-select: none;
    line-height: 1.1;
}
.s2-rt-line :deep(.u-axis-label.rx) {
    left: 4px;
    color: var(--rx, #4c6fff);
}
.s2-rt-line :deep(.u-axis-label.tx) {
    left: 4px;
    color: var(--tx, #0c9450);
}

.s2-rt-line-wrap {
    position: relative;
    width: 100%;
    height: 100%;
}

/* Mobile: floating range labels (independent top/bottom scales, RX pinned to the top, TX to the bottom) */
.s2-rt-line :deep(.u-chart-maxlabel) {
    position: absolute;
    top: 4px;
    left: 6px;
    font-size: 10px;
    font-weight: 700;
    font-family: var(--font-sans, 'Inter', sans-serif);
    letter-spacing: 0.02em;
    line-height: 1;
    pointer-events: none;
    user-select: none;
    white-space: nowrap;
    z-index: 5;
    text-shadow:
        0 0 8px var(--s2-card, #fff),
        0 0 4px var(--s2-card, #fff);
}
.s2-rt-line :deep(.u-chart-maxlabel.rx) {
    color: var(--rx, #4c6fff);
}
.s2-rt-line :deep(.u-chart-maxlabel.tx) {
    top: auto;
    /* The x axis occupies the bottom 30px of the container (uplotConfig axis size); anchor above
       it with a small gap so the label never sits on the "-60s" tick */
    bottom: 34px;
    color: var(--tx, #0c9450);
}
</style>
