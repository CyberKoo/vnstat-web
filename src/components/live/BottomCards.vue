<template>
    <div class="s2-bottom">
        <div class="s2-bottom-col">
            <h2 class="s2-bottom-label">{{ t('live.bottom.packetRate') }} &middot; PPS</h2>
            <div class="s2-bottom-body s2-pps-body">
                <div class="s2-ring-wrap s2-bottom-ring">
                    <Doughnut :data="ppsDonutData" :options="ppsDonutOptions" />
                    <div class="s2-ring-center">
                        <div class="s2-ring-center-val">{{ ppsTotal }}</div>
                        <div class="s2-ring-center-label">PPS</div>
                    </div>
                </div>
                <div class="s2-pps-legend">
                    <div class="s2-pps-row">
                        <span class="s2-pps-dot s2-pps-dot--rx" />
                        <span class="s2-pps-dir">{{ t('common.rx') }}</span>
                        <span class="mono s2-pps-val">{{ ppsStats.rx.toLocaleString() }}</span>
                        <span class="s2-pps-pct">{{ ppsStats.rxPct }}%</span>
                    </div>
                    <div class="s2-pps-row">
                        <span class="s2-pps-dot s2-pps-dot--tx" />
                        <span class="s2-pps-dir">{{ t('common.tx') }}</span>
                        <span class="mono s2-pps-val">{{ ppsStats.tx.toLocaleString() }}</span>
                        <span class="s2-pps-pct">{{ ppsStats.txPct }}%</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="s2-bottom-col">
            <h2 class="s2-bottom-label">{{ t('live.bottom.trendTitle') }}</h2>
            <div class="s2-bottom-body">
                <Bar :data="miniBarData" :options="miniBarOptions" />
            </div>
        </div>
        <div class="s2-bottom-col s2-bottom-col--list">
            <h2 class="s2-bottom-label s2-bottom-label--split">
                <span>{{ t('live.bottom.top5Title') }}</span>
                <span class="s2-top5-key">
                    <i class="s2-top5-dot s2-top5-dot--rx" />{{ t('common.rx')
                    }}<i class="s2-top5-dot s2-top5-dot--tx" />{{ t('common.tx') }}
                </span>
            </h2>
            <div class="s2-bottom-body">
                <div class="s2-top5">
                    <div v-for="(item, index) in top5" :key="item.timestamp" class="s2-top5-item">
                        <span class="s2-top5-rank" :class="rankClass(index)">{{ index + 1 }}</span>
                        <div class="s2-top5-main">
                            <div class="s2-top5-line">
                                <span class="mono muted">{{ formatTimestamp(item.timestamp) }}</span>
                                <span class="mono s2-mono-strong">{{ formatBytes(totalOf(item)).formatted }}</span>
                            </div>
                            <div class="s2-top5-bar">
                                <span class="s2-top5-seg s2-top5-seg--rx" :style="segStyle(item, 'rx')" />
                                <span class="s2-top5-seg s2-top5-seg--tx" :style="segStyle(item, 'tx')" />
                            </div>
                        </div>
                    </div>
                    <div v-if="!top5.length" class="s2-top5-empty">{{ t('live.bottom.noData') }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Doughnut, Bar } from '@/plugins/chartjs';
import type { ChartData, ChartOptions } from 'chart.js';
import { formatBytes } from '@/utils/bytes';
import { useDayjs } from '@/composables/useDayjs';

const { t } = useI18n();

const dayjs = useDayjs();

type Top5Item = { timestamp: number; rx?: number; tx?: number };
type PpsStats = { rx: number; tx: number; rxPct: number; txPct: number };

const props = defineProps<{
    ppsDonutData: ChartData<'doughnut'>;
    ppsDonutOptions: ChartOptions<'doughnut'>;
    ppsTotal: string;
    ppsStats: PpsStats;
    miniBarData: ChartData<'bar'>;
    miniBarOptions: ChartOptions<'bar'>;
    top5: Top5Item[];
}>();

function formatTimestamp(ts: number) {
    return dayjs.unix(ts).format(t('common.format.date'));
}

function totalOf(item: Top5Item) {
    return (item.rx ?? 0) + (item.tx ?? 0);
}

const maxTotal = computed(() => Math.max(0, ...props.top5.map(totalOf)));

/** Accent colors for the top three rank badges (consistent with the TopTraffic ranking: 1st accent, 2nd brand, 3rd tx), the rest muted */
const RANK_CLASSES = ['r1', 'r2', 'r3'] as const;
function rankClass(index: number) {
    return RANK_CLASSES[index] ?? '';
}

/** RX share (integer percent); split 50/50 when the total is 0 */
function rxPercent(item: Top5Item) {
    const total = totalOf(item);
    if (total <= 0) return 50;
    return Math.round(((item.rx ?? 0) / total) * 100);
}

/**
 * Segment width: first normalized by "total relative to the first place" to get the total bar length for that row,
 * then split into rx / tx segments by share; the two segments always sum to the row's total length.
 */
function segStyle(item: Top5Item, part: 'rx' | 'tx') {
    const total = maxTotal.value > 0 ? (totalOf(item) / maxTotal.value) * 100 : 0;
    const share = rxPercent(item) / 100;
    return { width: `${(total * (part === 'rx' ? share : 1 - share)).toFixed(2)}%` };
}
</script>

<style scoped>
.s2-bottom {
    display: flex;
    max-height: 240px;
}

/* Open columns: hairline divider on the left between columns, none on the first */
.s2-bottom-col {
    flex: 1;
    min-width: 0;
    padding: 0 20px;
    border-left: 1px solid var(--s2-border);
    transition: border-color var(--s2-transition);
    display: flex;
    flex-direction: column;
}

.s2-bottom-col:first-child {
    padding-left: 0;
    border-left: none;
}

.s2-bottom-label {
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--s2-text-muted);
    /* h2 carries a UA block-start margin; pin it to 0 so the tag swap changes nothing visually */
    margin-top: 0;
    margin-bottom: 8px;
    font-weight: 500;
    flex-shrink: 0;
}

/* Title row carries the legend: title on the left, rx/tx color keys on the right */
.s2-bottom-label--split {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.s2-top5-key {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 10.5px;
    font-weight: 400;
    white-space: nowrap;
}

.s2-bottom-body {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 0;
}

.s2-bottom-body :deep(canvas) {
    max-width: 100%;
    max-height: 100%;
}

/* Doughnut ring container: stretched by flex to get a deterministic height, avoiding the height:100% chain breaking and letting the chart blow out the row */
.s2-bottom-ring {
    height: auto;
    align-self: stretch;
    min-height: 0;
    padding: 8px 0;
    box-sizing: border-box;
}

/* PPS column: ring on the left filling the remaining width, RX/TX breakdown legend on the right */
.s2-pps-body {
    gap: 8px;
}

.s2-pps-body .s2-bottom-ring {
    flex: 1;
    min-width: 0;
}

.s2-pps-legend {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 12px;
}

.s2-pps-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
}

.s2-pps-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    align-self: center;
    flex-shrink: 0;
}

.s2-pps-dot--rx {
    background: var(--rx);
}

.s2-pps-dot--tx {
    background: var(--tx);
}

.s2-pps-dir {
    color: var(--s2-text-muted);
}

.s2-pps-val {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--s2-text);
}

.s2-pps-pct {
    min-width: 32px;
    text-align: right;
    font-size: 11px;
    color: var(--s2-text-muted);
    font-variant-numeric: tabular-nums;
}

.s2-top5 {
    width: 100%;
    font-size: 13px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.s2-top5-item {
    display: flex;
    align-items: center;
    gap: 9px;
    cursor: default;
    border-radius: var(--s2-radius-xs);
    transition: background-color var(--s2-transition);
}

.s2-top5-item:hover {
    background: var(--s2-hover-bg);
}

/* Rank badge: top three get their own colors, ranks 4-5 muted */
.s2-top5-rank {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--s2-radius-xs);
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 600;
    color: var(--s2-text-muted);
    background: var(--s2-hover-bg);
    transition: background-color var(--s2-transition);
}

.s2-top5-rank.r1 {
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);
}

.s2-top5-rank.r2 {
    color: var(--brand);
    background: var(--brand-bg);
}

.s2-top5-rank.r3 {
    color: var(--tx);
    background: color-mix(in srgb, var(--tx) 12%, transparent);
}

.s2-top5-main {
    flex: 1;
    min-width: 0;
}

.s2-top5-line {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 12px;
}

.s2-top5-line .muted {
    color: var(--s2-text-muted);
}

/* Bidirectional ratio bar: rx / tx segments joined, the two segments sum to that row's total length relative to the first place */
.s2-top5-bar {
    display: flex;
    height: 8px;
    margin-top: 4px;
    border-radius: 999px;
    background: var(--s2-border-light);
    overflow: hidden;
    transition: background-color var(--s2-transition);
}

.s2-top5-seg {
    height: 100%;
    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.s2-top5-seg--rx {
    background: var(--rx);
}

.s2-top5-seg--tx {
    background: var(--tx);
}

/* rx / tx color key dots: shared by the legend and the in-row breakdown */
.s2-top5-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    flex-shrink: 0;
    display: inline-block;
}

.s2-top5-dot--rx {
    background: var(--rx);
}

.s2-top5-dot--tx {
    background: var(--tx);
}

.s2-top5-empty {
    padding: 16px 0;
    text-align: center;
    color: var(--s2-text-muted);
    font-size: 13px;
}

@media (--mobile) {
    .s2-bottom {
        flex-direction: column;
        max-height: none;
    }
    .s2-bottom-col {
        border-left: none;
        border-top: 1px solid var(--s2-border);
        padding: 12px 0 0;
        max-height: 160px;
    }
    .s2-bottom-col:first-child {
        border-top: none;
        padding-top: 0;
    }
    /* The list column is not bound by the chart height cap, it expands with its content (badge + ratio bar need about 190px) */
    .s2-bottom-col--list {
        max-height: none;
    }
}
</style>
