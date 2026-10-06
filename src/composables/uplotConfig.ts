import type { Ref } from 'vue';
import uPlot from 'uplot';

import { palette } from '@/config/colors';
import { i18n } from '@/plugins/i18n';
import dayjs from '@/plugins/dayjs';
import { hexToRgba } from '@/utils/color';

// ── Types ──

export interface UplotColors {
    rx: string;
    tx: string;
    accent: string;
    danger: string;
    text: string;
    grid: string;
    bg: string;
    fontMono: string;
}

/**
 * Overlay state on the chart (threshold line / replay marker).
 *
 * Provided by the caller as a getter and read on every repaint, so a change in the threshold or
 * replay state does not rebuild the whole uPlot instance.
 */
export interface UplotOverlay {
    /** Rate threshold line (bytes/s); null means off */
    thresholdBps: number | null;
    /** Selected replay moment (seconds); null means not in replay mode */
    replayTs: number | null;
    /** Receive rate at the selected replay moment (bytes/s), used for the value label beside the vertical line */
    replayRx: number | null;
    /** Send rate at the selected replay moment (bytes/s), used for the value label beside the vertical line */
    replayTx: number | null;
    /** Current display span of the RX direction (bytes/s); the chart data is normalized by this */
    rxSpan: number;
    /** Tick values for the RX half, in bytes/s */
    rxTicks: number[];
    /** Current display span of the TX direction (bytes/s) */
    txSpan: number;
    /** Tick values for the TX half, in bytes/s */
    txTicks: number[];
    /** Height share of the RX half (0..1); the zero line sits at this fraction from the top */
    yShare: number;
}

export interface BuildOptsParams {
    width: number;
    height: number;
    isMobile: boolean;
    isDark: boolean;
    colors: UplotColors;
    formatRate: (v: number, d?: 0 | 1 | 2) => string;
    containerRef: Ref<HTMLDivElement | undefined>;
    /** Realtime window width (milliseconds), determines the initial x axis range */
    windowMs: number;
    /** Read the current overlay state (threshold / replay); called on every repaint */
    getOverlay: () => UplotOverlay;
}

// ── Color helpers ──

/**
 * Extract color values from the computed style of a DOM element.
 */
export function getColors(containerRef: Ref<HTMLDivElement | undefined>, isDark: boolean): UplotColors {
    const el = containerRef.value;
    if (!el) {
        return {
            rx: palette.rx,
            tx: palette.tx,
            accent: palette.accent,
            danger: palette.danger,
            text: '#646c82',
            grid: isDark ? 'rgba(255, 255, 255, 0.38)' : '#c2c2c2',
            bg: '#fff',
            fontMono: 'monospace',
        };
    }
    const style = getComputedStyle(el);
    return {
        rx: style.getPropertyValue('--rx').trim() || palette.rx,
        tx: style.getPropertyValue('--tx').trim() || palette.tx,
        accent: style.getPropertyValue('--accent').trim() || palette.accent,
        danger: style.getPropertyValue('--danger').trim() || palette.danger,
        text: style.getPropertyValue('--s2-text-muted').trim() || (isDark ? '#8b93a9' : '#646c82'),
        grid: style.getPropertyValue('--s2-chart-grid').trim() || (isDark ? 'rgba(255, 255, 255, 0.38)' : '#c2c2c2'),
        bg: style.getPropertyValue('--s2-card').trim() || (isDark ? '#151926' : '#fff'),
        fontMono: style.getPropertyValue('--font-mono').trim() || "ui-monospace, 'SF Mono', Menlo, monospace",
    };
}

// ── uPlot factory helpers ──

/** Gradient area fill end opacity (fades to 0 towards the zero line) */
const FILL_TOP_ALPHA = 0.28;

/**
 * Mirrored area chart series: RX points up, TX points down (the data is already negated), sharing the
 * same y axis (the upper and lower ranges are independent).
 *
 * The gradient fades at the zero line: RX is dense at the top and fades towards the zero line; TX is
 * mirrored and grows denser towards the bottom.
 */
export function makeSeries(label: string, stroke: string, mirrored: boolean): uPlot.Series {
    return {
        label,
        stroke,
        width: 2.5,
        points: { show: false },
        scale: 'y',
        fill: (self: uPlot): CanvasGradient => {
            const { top, height } = self.bbox;
            const zero = self.valToPos(0, 'y', true);
            if (!mirrored) {
                const gradient = self.ctx.createLinearGradient(0, top, 0, zero);
                gradient.addColorStop(0, hexToRgba(stroke, FILL_TOP_ALPHA));
                gradient.addColorStop(1, hexToRgba(stroke, 0));
                return gradient;
            }
            const gradient = self.ctx.createLinearGradient(0, zero, 0, top + height);
            gradient.addColorStop(0, hexToRgba(stroke, 0));
            gradient.addColorStop(1, hexToRgba(stroke, FILL_TOP_ALPHA));
            return gradient;
        },
        paths: uPlot.paths!.spline!(),
    };
}

/**
 * Over-threshold marker series: only the data points beyond the threshold line are drawn (danger
 * colored dots), without a line.
 *
 * The data is generated by the caller with buildThresholdMarkers (over-threshold points keep their
 * original value, the rest are null).
 */
export function makeThresholdSeries(scale: string, colors: UplotColors): uPlot.Series {
    return {
        label: 'threshold',
        stroke: colors.danger,
        scale,
        width: 0,
        fill: undefined,
        points: { show: true, size: 5, fill: colors.danger, stroke: colors.bg, width: 1 },
        paths: () => null,
    };
}

// ── Mirrored y handling ──
//
// The two directions share one uPlot scale for positioning, but they are normalized by their own
// per-direction span before entering the chart, so the upper and lower halves have fully
// independent tick scales: a 1 Gbps RX and a 10 Mbps TX each get their own labels.
// The zero line floats with the traffic ratio: each direction's height share is proportional to
// its span, clamped so the dominant side gets at most 2/3 of the plot (and the quiet side never
// shrinks into nothing). Grid lines and tick labels are custom-painted per half in paintOverlay
// (the native y axis is disabled).

/** Headroom above each direction's peak within its half (10%, same spirit as the old /0.9 range) */
const HEADROOM = 0.9;
/** ~3 subdivisions when rounding the display span to a nice multiple of the tick step */
const TICKS_PER_HALF = 3;
/** Height share limits: the dominant direction may use at most 3/4 of the plot, the quiet one
 * keeps ≥ 1/4; in between the share slides with the traffic ratio (equal traffic = 1/2) */
const MIN_SHARE = 1 / 4;
const MAX_SHARE = 3 / 4;
/** Per-half tick density: one line per ~50px of half height, between MIN and MAX intervals */
const TARGET_PX_PER_TICK = 50;
const MIN_INTERVALS = 1;
const MAX_INTERVALS = 4;

/** "Nice" increments (m × 10^n), the same family uPlot snaps its tick step to */
const NICE_INCREMENTS = [1, 2, 2.5, 5];

/** Smallest nice number greater than or equal to v */
function niceCeil(v: number): number {
    if (!(v > 0)) return 1;
    const base = 10 ** Math.floor(Math.log10(v));
    for (const m of NICE_INCREMENTS) {
        if (m * base >= v) return m * base;
    }
    return 10 * base;
}

/**
 * Display span for one direction: the data max plus headroom, rounded up so the span is always an
 * exact multiple of the tick step — the outer end and every tick land on nice values.
 */
export function sideSpan(maxValue: number): { span: number; step: number } {
    const raw = Math.max(maxValue, 0) / HEADROOM;
    if (raw <= 0) return { span: 0, step: 0 };
    const step = niceCeil(raw / TICKS_PER_HALF);
    const span = Math.max(step, Math.ceil(raw / step - 1e-9) * step);
    return { span, step };
}

/**
 * Height share of the RX half (the TX half gets 1 − share): proportional to the two spans, so the
 * busier direction gets more room, sliding from 1/2 (equal traffic) to at most 3/4 vs 1/4 for a
 * strongly dominant direction.
 */
export function rxShare(rxSpan: number, txSpan: number): number {
    const total = rxSpan + txSpan;
    if (total <= 0) return 0.5;
    return Math.min(MAX_SHARE, Math.max(MIN_SHARE, rxSpan / total));
}

/** Tick values for one direction (0 and `step` multiples up to and including `span`) */
export function sideTicks(span: number, step: number): number[] {
    if (!(span > 0) || !(step > 0)) return [0];
    const out: number[] = [];
    for (let i = 0; i * step <= span + 1e-9; i++) out.push(i * step);
    return out;
}

/** Format a timestamp (seconds) in the active language (local time zone). */
function fmtHM(tsSec: number): string {
    return dayjs.unix(tsSec).format(i18n.global.t('common.format.time'));
}

/**
 * Build the complete uPlot configuration.
 */
export function buildOpts(params: BuildOptsParams): uPlot.Options {
    const { width, height, isMobile, colors, formatRate, containerRef, windowMs, getOverlay } = params;

    const now = Date.now();
    const minTs = (now - windowMs) / 1e3;
    const maxTs = now / 1e3;
    const axisFont = '10px ' + colors.fontMono;
    // Mobile axis slot: tick values are not drawn (each direction's span is shown by a floating label)
    const mobileAxisSize = 8;
    // Desktop gutter minimum; the real width is derived from the widest per-side tick label
    const minAxisLabelWidth = 70;

    /** RX/TX area label elements (created on ready), repositioned on draw according to the zero line */
    let rxLabelEl: HTMLElement | null = null;
    let txLabelEl: HTMLElement | null = null;

    /**
     * Touch devices: tapping the chart pins the cursor and tooltip, and no mouseleave ever fires
     * to clear them, so the tooltip sticks after the finger lifts. Any touch landing outside the
     * chart hides it (attached on ready, removed on destroy)
     */
    let dismissTouch: ((event: TouchEvent) => void) | null = null;
    /**
     * Set by the destroy hook. uPlot fires ready from a queued microtask (its first commit), so an
     * instance created and destroyed within the same synchronous run (e.g. two startPlot() calls in
     * one tick) runs destroy first; a late ready checks this flag and registers nothing, since the
     * destroy hook has already fired and would never get a second chance to unregister.
     */
    let destroyed = false;

    /**
     * Custom-painted per-half tick labels and grid lines (the native y axis is disabled).
     * The number of divisions follows the half's pixel height, so a small region gets fewer
     * lines instead of the same dense lattice as a large one; both ends are always labeled.
     * `rect` is the plot box in CSS pixels (the caller has already scaled the ctx by pxRatio).
     */
    const paintSideTicks = (
        self: uPlot,
        ov: UplotOverlay,
        zeroY: number,
        rect: { left: number; top: number; w: number; h: number },
        crisp: (v: number) => number,
    ) => {
        const ctx = self.ctx;
        const { left, top, w, h } = rect;
        /**
         * Intervals by half height: one line per TARGET_PX_PER_TICK pixels, clamped to
         * [MIN_INTERVALS, MAX_INTERVALS]; both endpoints are always labeled.
         */
        const intervalsFor = (halfPx: number) =>
            Math.min(MAX_INTERVALS, Math.max(MIN_INTERVALS, Math.round(halfPx / TARGET_PX_PER_TICK)));
        const sides = [
            { span: ov.rxSpan, up: true },
            { span: ov.txSpan, up: false },
        ] as const;
        for (const side of sides) {
            if (!(side.span > 0)) continue;
            const halfPx = side.up ? zeroY - top : top + h - zeroY;
            const k = intervalsFor(halfPx);
            for (let i = 0; i <= k; i++) {
                const v = (side.span * i) / k;
                const y = side.up ? zeroY - (v / side.span) * halfPx : zeroY + (v / side.span) * halfPx;
                // Grid line (skip the zero line, drawn separately). Drawn at the token's own
                // strength (the dark token already carries alpha) to match the x-axis grid
                if (v > 0) {
                    ctx.strokeStyle = colors.grid;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(left, crisp(y));
                    ctx.lineTo(left + w, crisp(y));
                    ctx.stroke();
                }
                if (isMobile) continue;
                // Tick mark + right-aligned label in the gutter
                ctx.strokeStyle = colors.text;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(left - 4, crisp(y));
                ctx.lineTo(left, crisp(y));
                ctx.stroke();
                const label = formatRate(v, 1);
                ctx.lineWidth = 3;
                ctx.strokeStyle = colors.bg;
                ctx.strokeText(label, left - 7, y);
                ctx.fillStyle = colors.text;
                ctx.fillText(label, left - 7, y);
            }
        }
    };

    /** Paint the overlay: per-half grid/ticks, zero baseline, threshold lines, replay line labels, Live pulse head points */
    const paintOverlay = (self: uPlot) => {
        const ov = getOverlay();
        const ctx = self.ctx;
        // bbox/valToPos are in device (canvas) pixels and the ctx transform is identity; scale the
        // ctx by the pixel ratio and draw in CSS pixels so fonts/lines keep their intended size on
        // hi-dpi screens (otherwise everything painted here renders at 1/pxRatio of native size)
        const px = uPlot.pxRatio || 1;
        /** Round to the device pixel grid (+0.5) so 1px strokes stay crisp at any pixel ratio */
        const crisp = (v: number) => (Math.round(v * px) + 0.5) / px;
        const rect = {
            left: self.bbox.left / px,
            top: self.bbox.top / px,
            w: self.bbox.width / px,
            h: self.bbox.height / px,
        };
        const { left, top, w, h } = rect;

        // Area labels sit at the middle of each half; the normalized scale keeps the zero line centered
        const zeroInOver = self.valToPos(0, 'y', true) / px - top;
        if (rxLabelEl && txLabelEl) {
            rxLabelEl.style.display = zeroInOver < 24 ? 'none' : '';
            txLabelEl.style.display = h - zeroInOver < 24 ? 'none' : '';
            rxLabelEl.style.top = `${zeroInOver / 2}px`;
            txLabelEl.style.top = `${(zeroInOver + h) / 2}px`;
        }

        if (!self.data[0] || self.data[0].length === 0) return;

        ctx.save();
        ctx.scale(px, px);
        ctx.font = axisFont;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'right';

        // ── Zero baseline: the divider of the mirrored chart, slightly stronger than the regular grid ──
        const zeroY = crisp(self.valToPos(0, 'y', true) / px);
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = colors.text;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(left, zeroY);
        ctx.lineTo(left + w, zeroY);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // ── Per-half grid lines and tick labels (each direction has its own scale) ──
        paintSideTicks(self, ov, zeroY, rect, crisp);

        // ── Threshold lines: one per direction, normalized by that direction's span and share ──
        if (ov.thresholdBps != null && ov.thresholdBps > 0) {
            ctx.font = `600 10px ${colors.fontMono}`;
            // The y-tick labels left textAlign at 'right', but labelX below is the label's left edge
            ctx.textAlign = 'left';
            const thr = ov.thresholdBps;
            for (const sign of [1, -1] as const) {
                const span = sign > 0 ? ov.rxSpan : ov.txSpan;
                const share = sign > 0 ? ov.yShare : 1 - ov.yShare;
                if (!(span > 0) || !(share > 0)) continue;
                const y = crisp(self.valToPos(sign * (thr / span) * share, 'y', true) / px);
                if (y < top || y > top + h) continue;
                ctx.strokeStyle = colors.danger;
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 4]);
                ctx.beginPath();
                ctx.moveTo(left, y);
                ctx.lineTo(left + w, y);
                ctx.stroke();
                ctx.setLineDash([]);

                // Value label at the right end of the line (moved to the other side when it hits the edge)
                const label = formatRate(thr, 1);
                const tw = ctx.measureText(label).width;
                const labelX = left + w - tw - 6;
                const labelY = sign > 0 ? (y - 9 < top ? y + 11 : y - 9) : y + 9 > top + h ? y - 11 : y + 9;
                ctx.lineWidth = 3;
                ctx.strokeStyle = colors.bg;
                ctx.strokeText(label, labelX, labelY);
                ctx.fillStyle = colors.danger;
                ctx.fillText(label, labelX, labelY);
            }
        }

        ctx.font = `600 10px ${colors.fontMono}`;
        ctx.textAlign = 'left';

        // ── Vertical line at the selected replay moment + the rx/tx values at that moment ──
        if (ov.replayTs != null) {
            const x = crisp(self.valToPos(ov.replayTs, 'x', true) / px);
            if (x >= left && x <= left + w) {
                ctx.strokeStyle = colors.accent;
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(x, top);
                ctx.lineTo(x, top + h);
                ctx.stroke();
                ctx.setLineDash([]);

                const rows: Array<{ text: string; color: string }> = [{ text: fmtHM(ov.replayTs), color: colors.text }];
                if (ov.replayRx != null) rows.push({ text: `↓ ${formatRate(ov.replayRx, 1)}`, color: colors.rx });
                if (ov.replayTx != null) rows.push({ text: `↑ ${formatRate(ov.replayTx, 1)}`, color: colors.tx });

                const maxTw = Math.max(...rows.map((r) => ctx.measureText(r.text).width));
                // When the vertical line is near the right edge, put the labels on its left to avoid
                // overflowing the plot area
                const lx = x + 10 + maxTw > left + w ? x - 10 - maxTw : x + 10;
                let ly = top + 12;
                for (const row of rows) {
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = colors.bg;
                    ctx.strokeText(row.text, lx, ly);
                    ctx.fillStyle = row.color;
                    ctx.fillText(row.text, lx, ly);
                    ly += 13;
                }
            }
        } else {
            // ── Live pulse head point: the last sample point gets a breathing halo plus a solid dot,
            // turning danger colored when it goes over the threshold ──
            const pulse = 0.55 + 0.45 * Math.sin(performance.now() / 380);
            for (const [seriesIdx, color] of [
                [1, colors.rx],
                [2, colors.tx],
            ] as const) {
                const ys = self.data[seriesIdx];
                if (!ys) continue;
                let i = ys.length - 1;
                while (i >= 0 && ys[i] == null) i--;
                if (i < 0) continue;
                const xv = self.data[0][i];
                const yv = ys[i];
                if (xv == null || yv == null) continue;
                // Shrink by 5px so the head point is not clipped by the plot boundary at the right edge
                const cx = Math.min(self.valToPos(xv, 'x', true) / px, left + w - 5);
                const cy = self.valToPos(yv, 'y', true) / px;
                if (cy < top || cy > top + h) continue;
                // Data is normalized by span and share; convert back to the real rate for the check
                const span = seriesIdx === 1 ? ov.rxSpan : ov.txSpan;
                const share = seriesIdx === 1 ? ov.yShare : 1 - ov.yShare;
                const realRate = share > 0 && span > 0 ? (Math.abs(yv) / share) * span : 0;
                const overThreshold = ov.thresholdBps != null && realRate > ov.thresholdBps;
                const c = overThreshold ? colors.danger : color;
                ctx.globalAlpha = 0.3 * pulse;
                ctx.fillStyle = c;
                ctx.beginPath();
                ctx.arc(cx, cy, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
                ctx.beginPath();
                ctx.arc(cx, cy, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = colors.bg;
                ctx.stroke();
            }
        }

        ctx.restore();
    };

    return {
        width,
        height,
        mode: 1,
        // Mobile: the x tick labels are centered on the plot bounds and the auto side padding is 0
        // on the left (only sides without axes get auto padding), so the first label ("-60s", or
        // a localized time in replay) is clipped by the canvas edge — reserve room for half a label
        padding: isMobile ? [null, null, null, 18] : undefined,
        cursor: {
            show: true,
            drag: { x: false, y: false },
            points: { size: 4, width: 1.5 },
        },
        select: { show: false, left: 0, top: 0, width: 0, height: 0 },
        legend: { show: false },
        series: [
            {},
            // Labels are never rendered (legend is off, the RX/TX chips are hardcoded), so static
            // strings instead of an i18n lookup on every rebuild
            makeSeries('RX', colors.rx, false),
            makeSeries('TX', colors.tx, true),
            makeThresholdSeries('y', colors),
            makeThresholdSeries('y', colors),
        ],
        axes: [
            {
                stroke: colors.text,
                grid: { stroke: colors.grid, width: 1 },
                ticks: { stroke: colors.text },
                font: axisFont,
                // uPlot places the label top at plotBottom + tickSize(10) + gap(5); the 10px mono
                // font needs ~13px (ascent 10 + descent 3), so anything under ~28 cuts off the
                // bottom of the time labels
                size: 30,
                // Evenly spaced ticks: relative seconds in realtime mode (sliding with the window),
                // localized time in replay mode
                splits: (_self: uPlot, _axisIdx: number, scaleMin: number | null, scaleMax: number | null) => {
                    const min = scaleMin ?? 0;
                    const max = scaleMax ?? 0;
                    return [0, 1, 2, 3].map((i) => min + ((max - min) * i) / 3);
                },
                values: (self: uPlot, splits: number[]) => {
                    if (getOverlay().replayTs != null) return splits.map((v) => fmtHM(v));
                    const max = self.scales.x.max ?? splits[splits.length - 1] ?? 0;
                    return splits.map((v) => {
                        const ago = Math.round(max - v);
                        return ago <= 2 ? i18n.global.t('live.axis.now') : `-${ago}s`;
                    });
                },
            },
            {
                scale: 'y',
                // The y axis is fully custom-painted (paintSideTicks): the two directions are
                // normalized independently, so there is no single native tick lattice
                stroke: colors.text,
                grid: { show: false },
                ticks: { show: false },
                font: axisFont,
                size: isMobile
                    ? mobileAxisSize
                    : (self: uPlot) => {
                          // Labels are right-aligned into this gutter; anything wider than it is
                          // clipped at the canvas edge (e.g. "640.0 Mbps" losing its head digits
                          // looks like "40.0 Mbps"), so size the gutter to the widest per-side label
                          const ctx = self.ctx;
                          ctx.save();
                          ctx.font = axisFont;
                          const ov = getOverlay();
                          let max = 0;
                          for (const v of [...ov.rxTicks, ...ov.txTicks]) {
                              max = Math.max(max, ctx.measureText(formatRate(v, 1)).width);
                          }
                          ctx.restore();
                          return Math.max(minAxisLabelWidth, Math.ceil(max) + 14);
                      },
                values: () => [],
            },
        ],
        scales: {
            // Initial static window; afterwards the caller drives the sliding window with setScale on every frame
            x: { time: true, min: minTs, max: maxTs },
            // Normalized mirrored scale whose zero line floats with the traffic ratio: data is
            // scaled per direction as (v / span) × heightShare, so the range bounds are exactly
            // the two shares. The range is a function (not a min/max pair) so uPlot's auto-scale
            // pass keeps applying it — a plain min/max pair never enters pendScales.
            y: {
                // auto: true is required so uPlot re-runs the range on every scale pass; without
                // it the zero line freezes at the init position
                auto: true,
                range: () => {
                    const share = getOverlay().yShare;
                    return [-(1 - share), share];
                },
            },
        },
        hooks: {
            ready: [
                (self: uPlot) => {
                    // Late ready after destroy (see `destroyed` above): leave no DOM, no hooks and,
                    // most importantly, no document listener behind
                    if (destroyed) return;

                    const ttEl = document.createElement('div');
                    ttEl.className = 'u-tt';
                    ttEl.style.display = 'none';
                    // Create the child nodes once; setCursor only updates textContent, so innerHTML
                    // does not rebuild the DOM on every mousemove
                    const ttTime = document.createElement('div');
                    ttTime.className = 'u-tt-row u-tt-time';
                    const ttRx = document.createElement('div');
                    ttRx.className = 'u-tt-row';
                    ttRx.style.color = colors.rx;
                    const ttTx = document.createElement('div');
                    ttTx.className = 'u-tt-row';
                    ttTx.style.color = colors.tx;
                    ttEl.append(ttTime, ttRx, ttTx);
                    self.over.appendChild(ttEl);

                    rxLabelEl = document.createElement('div');
                    rxLabelEl.className = 'u-axis-label rx';
                    rxLabelEl.textContent = 'RX';
                    self.over.appendChild(rxLabelEl);

                    txLabelEl = document.createElement('div');
                    txLabelEl.className = 'u-axis-label tx';
                    txLabelEl.textContent = 'TX';
                    self.over.appendChild(txLabelEl);

                    // Mobile: floating range labels (independent per side, each labelled with that
                    // side's boundary value)
                    if (isMobile && containerRef.value) {
                        // The max labels live on the shared container, not on the instance root that
                        // destroy removes, and the destroy hook does not clean them up — drop the
                        // previous instance's labels before adding this instance's
                        containerRef.value.querySelectorAll('.u-chart-maxlabel').forEach((el) => el.remove());
                        const rxMaxEl = document.createElement('div');
                        rxMaxEl.className = 'u-chart-maxlabel rx';
                        const txMaxEl = document.createElement('div');
                        txMaxEl.className = 'u-chart-maxlabel tx';
                        containerRef.value.append(rxMaxEl, txMaxEl);

                        const initOverlay = getOverlay();
                        rxMaxEl.textContent = formatRate(initOverlay.rxSpan, 1);
                        txMaxEl.textContent = formatRate(initOverlay.txSpan, 1);
                    }

                    dismissTouch = (event: TouchEvent) => {
                        const target = event.target;
                        if (target instanceof Node && self.root.contains(target)) return;
                        // The same trick as uPlot's own mouseleave: park the cursor off-plot so the
                        // setCursor hook above hides the tooltip and the cursor point markers
                        self.setCursor({ left: -10, top: -10 });
                    };
                    document.addEventListener('touchstart', dismissTouch, { passive: true });

                    self.hooks.setCursor = [
                        () => {
                            const xLen = self.data[0]?.length ?? 0;
                            if (xLen === 0) {
                                ttEl.style.display = 'none';
                                return;
                            }
                            const idx = self.cursor.idx;
                            if (idx == null || idx >= xLen) {
                                ttEl.style.display = 'none';
                                return;
                            }
                            const xVal = self.data[0][idx];
                            const rxVal = self.data[1][idx];
                            const txVal = self.data[2][idx];
                            const left = self.cursor.left ?? 0;

                            const cursorTime = self.posToVal(left, 'x');
                            if (Math.abs(xVal - cursorTime) > 1.5) {
                                ttEl.style.display = 'none';
                                return;
                            }

                            const top = self.cursor.top ?? 0;
                            ttTime.textContent = dayjs.unix(xVal).format(i18n.global.t('common.format.timeSeconds'));
                            // Data is normalized by span and share; convert back to the real rate
                            const ov = getOverlay();
                            const rxReal = rxVal != null && ov.yShare > 0 ? (rxVal / ov.yShare) * ov.rxSpan : null;
                            const txReal =
                                txVal != null && ov.yShare < 1 ? (Math.abs(txVal) / (1 - ov.yShare)) * ov.txSpan : null;
                            ttRx.textContent = i18n.global.t('live.tooltip.rxRow', {
                                value: rxReal != null ? formatRate(rxReal, 2) : '--',
                            });
                            ttTx.textContent = i18n.global.t('live.tooltip.txRow', {
                                value: txReal != null ? formatRate(txReal, 2) : '--',
                            });
                            ttEl.style.display = '';
                            // Use self.width (the live value) instead of the build-time closure width,
                            // so positioning stays correct after the container is resized
                            ttEl.style.left = Math.max(4, Math.min(left + 14, self.width - 180)) + 'px';
                            ttEl.style.top = Math.max(top - 60, 4) + 'px';
                        },
                    ];
                },
            ],
            draw: [paintOverlay],
            destroy: [
                () => {
                    destroyed = true;
                    if (dismissTouch) {
                        document.removeEventListener('touchstart', dismissTouch);
                        dismissTouch = null;
                    }
                },
            ],
        },
    };
}
