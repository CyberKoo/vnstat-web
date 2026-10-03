<template>
    <div class="s2-metric-band">
        <div class="s2-metric">
            <div class="s2-stat-value s2-stat-value--rx s2-live-value">{{ liveUsage.rx.formatted }}</div>
            <div class="s2-stat-label">{{ t('live.header.rxLabel') }}</div>
        </div>
        <div class="s2-metric">
            <div class="s2-stat-value s2-stat-value--tx s2-live-value">{{ liveUsage.tx.formatted }}</div>
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
                {{ interfaceName }} &middot; <span class="mono">{{ totalSamples }}</span>
                {{ t('live.header.samplesSuffix') }}
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps<{
    liveUsage: { rx: { formatted: string }; tx: { formatted: string } };
    todayTotal: string;
    formattedNow: string;
    interfaceName: string;
    totalSamples: number;
}>();
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
