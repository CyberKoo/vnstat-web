<template>
    <div class="s2-metric-band">
        <div v-for="stat in stats" :key="stat.label" class="s2-metric">
            <div class="s2-metric-value" :style="stat.color ? { color: stat.color } : undefined">
                {{ stat.value }}
            </div>
            <Sparkline
                v-if="stat.sparkline && stat.sparkline.length > 1"
                class="s2-metric-sparkline"
                :data="stat.sparkline"
                :color="stat.color"
                :height="24"
            />
            <div class="s2-stat-label">
                {{ stat.label
                }}<span v-if="stat.sub != null" class="s2-stat-sub" :class="{ 's2-nowrap': stat.subNoWrap }"
                    >{{ stat.subSep ?? ' ' }}{{ stat.sub }}</span
                >
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import Sparkline from '@/components/charts/Sparkline.vue';
import type { TrafficStatItem } from '@/types/chart';

// The Sparkline component does not import the uPlot styles itself (a shared component should stay untouched), so they are imported here by the consumer following RealTimeLine's convention
import 'uplot/dist/uPlot.min.css';

defineProps<{
    /** Stat metric array */
    stats: TrafficStatItem[];
}>();
</script>

<style scoped>
/* Values: the open metric band uses a larger font size (replacing the original s2-stat-value grid card dimensions) */
.s2-metric-value {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: clamp(20px, 2vw, 30px);
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.15;
}

.s2-metric .s2-stat-label {
    margin-top: 4px;
}

.s2-metric-sparkline {
    width: 150px;
    max-width: 100%;
    height: 24px;
    margin-top: 6px;
    pointer-events: none;
    opacity: 0.9;
}

@media (--mobile) {
    .s2-metric-value {
        font-size: 20px;
    }
    .s2-metric-sparkline {
        width: 100%;
    }
}
</style>
