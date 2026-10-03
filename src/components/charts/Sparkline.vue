<template>
    <div ref="containerRef" class="s2-sparkline" :style="{ height: `${height}px` }" aria-hidden="true" />
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import uPlot from 'uplot';

import { palette } from '@/config/colors';
import { hexToRgba } from '@/utils/color';

/**
 * Mini trend chart (Sparkline) — an axis-free uPlot gradient area line.
 * Used for trend hints in tight spaces such as stat cards and table rows.
 */
const props = withDefaults(
    defineProps<{
        /** Numeric series (ascending by time) */
        data: number[];
        /** Line color, defaults to the primary color */
        color?: string;
        /** Height (px) */
        height?: number;
    }>(),
    {
        color: palette.sparkline,
        height: 28,
    },
);

const containerRef = ref<HTMLDivElement>();
let chart: uPlot | null = null;
let resizeObserver: ResizeObserver | null = null;

/** Resolve a var(--token) into a concrete color value (canvas gradients do not accept CSS variables) */
function resolveColor(color: string): string {
    const m = /^var\(\s*(--[\w-]+)\s*\)$/.exec(color.trim());
    if (!m) return color;
    const resolved = getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim();
    return resolved || palette.sparkline;
}

function buildData(): uPlot.AlignedData {
    return [props.data.map((_, i) => i), [...props.data]];
}

function create() {
    const el = containerRef.value;
    if (!el || props.data.length < 2) return;
    const color = resolveColor(props.color);
    chart = new uPlot(
        {
            width: el.clientWidth || 120,
            height: props.height,
            mode: 1,
            cursor: { show: false },
            select: { show: false, left: 0, top: 0, width: 0, height: 0 },
            legend: { show: false },
            scales: { x: { time: false } },
            axes: [{ show: false }, { show: false }],
            series: [
                {},
                {
                    stroke: color,
                    width: 1.5,
                    points: { show: false },
                    paths: uPlot.paths.spline!(),
                    fill: (self: uPlot) => {
                        const g = self.ctx.createLinearGradient(0, 0, 0, self.bbox.height);
                        g.addColorStop(0, hexToRgba(color, 0.28));
                        g.addColorStop(1, hexToRgba(color, 0));
                        return g;
                    },
                },
            ],
        },
        buildData(),
        el,
    );
}

onMounted(() => {
    create();
    resizeObserver = new ResizeObserver(() => {
        const el = containerRef.value;
        // Skip collapsed containers (display:none): a 0 width would blank the canvas until the next resize
        if (chart && el && el.clientWidth > 0) chart.setSize({ width: el.clientWidth, height: props.height });
    });
    if (containerRef.value) resizeObserver.observe(containerRef.value);
});

watch(
    () => props.data,
    () => {
        if (chart) {
            chart.setData(buildData());
        } else {
            create();
        }
    },
    { deep: false },
);

onBeforeUnmount(() => {
    resizeObserver?.disconnect();
    resizeObserver = null;
    chart?.destroy();
    chart = null;
});
</script>

<style scoped>
.s2-sparkline {
    width: 100%;
    min-width: 0;
    overflow: hidden;
}
</style>
