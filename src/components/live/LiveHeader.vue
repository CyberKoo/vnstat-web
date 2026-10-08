<template>
    <div class="s2-metric-band">
        <div class="s2-metric">
            <div class="s2-stat-value s2-stat-value--rx s2-live-value">
                {{ liveUsage.rx.formatted }}
            </div>
            <div class="s2-stat-label s2-live-rx-label">
                {{ t('live.header.rxLabel') }}
                <span v-if="connected" class="s2-live-dot" aria-hidden="true" />
            </div>
        </div>
        <div class="s2-metric">
            <div class="s2-stat-value s2-stat-value--tx s2-live-value">
                {{ liveUsage.tx.formatted }}
            </div>
            <div class="s2-stat-label">{{ t('live.header.txLabel') }}</div>
        </div>
        <div class="s2-metric">
            <div class="s2-stat-value s2-live-value">{{ todayTotal }}</div>
            <div class="s2-stat-label">{{ t('live.header.todayTotal') }}</div>
        </div>
        <div class="s2-metric s2-live-meta">
            <div class="s2-live-meta-line">
                {{ t('common.updated') }} <span class="mono">{{ formattedNow }}</span>
            </div>
            <div class="s2-live-meta-line">
                {{ interfaceName }} &middot;
                <i18n-t keypath="live.header.samples" :plural="totalSamples" scope="global" tag="span">
                    <template #count>
                        <span class="mono">{{ formatNumber(totalSamples, { useGrouping: true }) }}</span>
                    </template>
                </i18n-t>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { formatNumber } from '@/utils/numbers';

const { t } = useI18n();

withDefaults(
    defineProps<{
        liveUsage: { rx: { formatted: string }; tx: { formatted: string } };
        todayTotal: string;
        formattedNow: string;
        interfaceName: string;
        totalSamples: number;
        /** SSE is open. The RX dot breathes only while this is true. */
        connected?: boolean;
    }>(),
    { connected: false },
);
</script>

<style scoped>
/* The homepage rate is the visual anchor, with a font size above the global .s2-stat-value default */
.s2-live-value {
    font-size: clamp(24px, 2.2vw, 34px);
}

/* Right meta: last metric slot, no divider, right-aligned muted small text */
.s2-live-meta {
    border-left: none;
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: right;
}

.s2-live-meta-line {
    font-size: 12px;
    color: var(--s2-text-muted);
    line-height: 1.8;
    white-space: nowrap;
}

.s2-live-meta-line .mono {
    color: var(--s2-text);
    font-weight: 500;
}

/* One living mark on the page: a 6px RX dot, only while the stream is open. */
.s2-live-rx-label {
    display: flex;
    align-items: center;
    gap: 6px;
}

.s2-live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--rx);
    animation: s2-live-dot 2.4s ease-in-out infinite;
}

@keyframes s2-live-dot {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.4;
    }
}

@media (prefers-reduced-motion: reduce) {
    .s2-live-dot {
        animation: none;
    }
}

@media (--mobile) {
    /* Match the global 20px mobile stat value: an 11-char rate (e.g. "246.78 Kbps")
       does not fit the 50%-wide metric card at 24px. */
    .s2-live-value {
        font-size: 20px;
    }

    .s2-live-meta {
        text-align: left;
    }
}
</style>
