<template>
    <div class="s2-compact">
        <h2 class="s2-section-label s2-compact-label">
            {{ t('live.compact.title') }}
            <span class="s2-section-hint s2-compact-hint">
                {{ t('live.compact.total') }} <span class="mono">{{ compactStats.total }}</span>
                <span class="s2-rx-dot"></span> RX {{ compactStats.rxPct }}% <span class="s2-tx-dot"></span> TX
                {{ compactStats.txPct }}%
            </span>
        </h2>
        <div class="s2-compact-body">
            <div class="s2-compact-chart">
                <Bar :data="compactData" :options="compactOptions" />
            </div>
            <div class="s2-compact-util">
                <div class="s2-compact-util-head">
                    <span class="s2-sidebar-label">{{ t('live.compact.vsRecentPeak') }}</span>
                    <Transition name="s2-fade" mode="out-in">
                        <!-- Link speed loading → skeleton, then fade in the real value on success to avoid the default value flashing -->
                        <span
                            v-if="linkSpeedLoading"
                            key="skeleton"
                            class="s2-skeleton s2-util-skeleton"
                            aria-hidden="true"
                        />
                        <span v-else key="value" class="mono s2-util-value">{{ maxBandwidth }}</span>
                    </Transition>
                </div>
                <div class="s2-util-bars">
                    <div class="s2-util-row">
                        <span class="s2-util-label">RX</span>
                        <div class="s2-util-track">
                            <div class="s2-util-fill" :style="{ width: rxPeakPct + '%' }"></div>
                            <span class="s2-util-num mono s2-util-num-inner">{{ rxRate }}</span>
                        </div>
                        <span class="s2-util-num mono s2-util-num-outer">{{ rxRate }}</span>
                    </div>
                    <div class="s2-util-row">
                        <span class="s2-util-label">TX</span>
                        <div class="s2-util-track">
                            <div class="s2-util-fill tx" :style="{ width: txPeakPct + '%' }"></div>
                            <span class="s2-util-num mono s2-util-num-inner">{{ txRate }}</span>
                        </div>
                        <span class="s2-util-num mono s2-util-num-outer">{{ txRate }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { Bar } from '@/plugins/chartjs';
import type { ChartData, ChartOptions } from 'chart.js';

const { t } = useI18n();

defineProps<{
    compactData: ChartData<'bar'>;
    compactOptions: ChartOptions<'bar'>;
    compactStats: { total: string; rxPct: number; txPct: number };
    maxBandwidth: string;
    linkSpeedLoading: boolean;
    /** Current rate as a share of the recent (≈3h) peak, 0-100 */
    rxPeakPct: number;
    txPeakPct: number;
    /** Current RX/TX rates, formatted (e.g. "28.0 Kbps") */
    rxRate: string;
    txRate: string;
}>();
</script>

<style scoped>
.s2-compact-label {
    row-gap: 6px;
}

.s2-compact-hint {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--s2-text-muted);
    white-space: nowrap;
}

.s2-compact-hint .mono {
    color: var(--s2-text);
    font-weight: 500;
}

.s2-compact-body {
    display: flex;
    gap: 24px;
    align-items: stretch;
}

.s2-compact-chart {
    flex: 2;
    min-width: 0;
    min-height: 0;
    position: relative;
}

.s2-compact-chart :deep(canvas) {
    position: absolute;
    inset: 0;
}

.s2-compact-util {
    flex: 1;
    min-width: 0;
    padding-left: 20px;
    border-left: 1px solid var(--s2-border);
    display: flex;
    flex-direction: column;
    transition: border-color var(--s2-transition);
}

.s2-compact-util-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.s2-util-value {
    font-size: 11px;
    font-weight: 500;
    color: var(--s2-text-muted);
}

/* ── Link speed loading skeleton (width approximates the real value to avoid layout shift) ── */
.s2-util-skeleton {
    display: inline-block;
    width: 64px;
    height: 12px;
    border-radius: 3px;
}

/* Value fades in after loading succeeds */
.s2-fade-enter-active,
.s2-fade-leave-active {
    transition: opacity 0.3s ease;
}

.s2-fade-enter-from,
.s2-fade-leave-to {
    opacity: 0;
}

.s2-util-bars {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    justify-content: center;
}

.s2-util-row {
    display: flex;
    align-items: center;
    gap: 6px;
}

.s2-util-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--s2-text-muted);
    width: 22px;
    flex-shrink: 0;
}

.s2-util-track {
    flex: 1;
    height: 6px;
    background: var(--s2-track);
    border-radius: 999px;
    overflow: hidden;
    transition: background-color var(--s2-transition);
}

.s2-util-fill {
    height: 100%;
    background: var(--rx);
    border-radius: 999px;
    transition: width 0.4s ease;
}

.s2-util-fill.tx {
    background: var(--tx);
}

.s2-util-num-inner {
    display: none;
}

.s2-util-num-outer {
    font-size: 11px;
    font-weight: 600;
    min-width: 60px;
    text-align: right;
    flex-shrink: 0;
    white-space: nowrap;
    color: var(--s2-text);
}

.s2-rx-dot,
.s2-tx-dot {
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
}

.s2-rx-dot {
    background: var(--rx);
}
.s2-tx-dot {
    background: var(--tx);
}

@media (--mobile) {
    .s2-compact-body {
        flex-direction: column;
        gap: 16px;
    }
    .s2-compact-chart {
        flex: none;
        height: 42px;
    }
    .s2-compact-util {
        border-left: none;
        border-top: 1px solid var(--s2-border);
        padding-left: 0;
        padding-top: 16px;
    }
    .s2-compact-hint {
        white-space: normal;
    }
    .s2-util-row {
        gap: 4px;
    }
    .s2-util-track {
        height: 14px;
        position: relative;
    }
    .s2-util-num-inner {
        display: block;
        position: absolute;
        right: 4px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        font-weight: 600;
        color: var(--s2-text);
        white-space: nowrap;
    }
    .s2-util-num-outer {
        display: none;
    }
}
</style>
