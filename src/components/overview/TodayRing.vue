<template>
    <span
        class="today-ring"
        :style="{ width: size + 'px', height: size + 'px' }"
        :title="title || undefined"
        role="img"
        :aria-label="ariaLabel"
    >
        <svg class="today-ring-svg" :viewBox="`0 0 ${size} ${size}`" aria-hidden="true">
            <circle
                class="today-ring-track"
                :cx="size / 2"
                :cy="size / 2"
                :r="radius"
                fill="none"
                :stroke-width="stroke"
            />
            <circle
                class="today-ring-bar"
                :class="{ 'today-ring-bar--over': over }"
                :cx="size / 2"
                :cy="size / 2"
                :r="radius"
                fill="none"
                :stroke-width="stroke"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="dashOffset"
            />
        </svg>
        <span class="today-ring-val" :class="{ 'today-ring-val--over': over }">{{ displayText }}</span>
    </span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

/**
 * Today's usage share ring — shows today's usage ÷ the daily average over the last 30 days, as a percentage.
 * Pure SVG implementation (no canvas), 44px diameter by default, with the percentage in the ring center;
 * shows "-" when there is no historical data (percent is null). Above 100% it is clamped to a full ring and hinted with the accent color.
 */
const props = withDefaults(
    defineProps<{
        /** Today's usage as a percentage of the daily average (rounded 0-100); null means no historical data */
        percent: number | null;
        /** Whether the daily average is exceeded (accent color hint "over daily average") */
        over: boolean;
        /** Diameter (px), defaults to 44 */
        size?: number;
        /** Ring thickness (px), defaults to 5 */
        stroke?: number;
        /** Tooltip (the actual today / daily average values) */
        title?: string;
    }>(),
    { size: 44, stroke: 5, title: '' },
);

const radius = computed(() => (props.size - props.stroke) / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
/** Map progress 0-100 to dashoffset (the CSS transition handles the smooth animation) */
const dashOffset = computed(() => {
    if (props.percent === null) return circumference.value;
    return circumference.value * (1 - Math.min(100, Math.max(0, props.percent)) / 100);
});
const displayText = computed(() => (props.percent === null ? '-' : `${props.percent}%`));
const ariaLabel = computed(() =>
    props.percent === null ? t('overview.ring.ariaNoData') : t('overview.ring.ariaReached', { percent: props.percent }),
);
</script>

<style scoped>
.today-ring {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.today-ring-svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
}

.today-ring-track {
    stroke: var(--s2-hover-bg);
    transition: stroke var(--s2-transition);
}

.today-ring-bar {
    stroke: var(--brand);
    stroke-linecap: round;
    transition:
        stroke-dashoffset var(--s2-transition),
        stroke var(--s2-transition);
}

.today-ring-bar--over {
    stroke: var(--accent);
}

.today-ring-val {
    position: absolute;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 10px;
    font-weight: 600;
    color: var(--s2-text);
}

.today-ring-val--over {
    color: var(--accent);
}
</style>
