/**
 * Chart.js registry and vue-chartjs wrapper.
 *
 * Registers on demand: only the chart types/plugins used by the project (Bar, Doughnut, Line,
 * Filler, Tooltip, Legend), to avoid pulling in unused code such as PolarArea/Radar/Scatter
 * through the full registerables bundle.
 *
 * Components that render a Chart.js chart import their vue-chartjs component from here rather
 * than from 'vue-chartjs' directly. That guarantees registration before first render, and —
 * because every importer of this module sits inside a lazily loaded route — keeps chart.js out
 * of the entry chunk: pages without charts (/about, /404) never download the chart runtime.
 */
import {
    ArcElement,
    BarController,
    BarElement,
    CategoryScale,
    Chart,
    DoughnutController,
    Filler,
    Legend,
    LinearScale,
    LineController,
    LineElement,
    PointElement,
    Tooltip,
    type Plugin,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'vue-chartjs';

/** Document touch listeners registered per chart instance (kept for removal on destroy) */
const dismissListeners = new WeakMap<object, (event: TouchEvent) => void>();

/**
 * Touch devices: a tap inside the canvas opens the tooltip, but no "mouseout" ever fires when the
 * finger leaves, so the tooltip sticks until the same canvas is tapped again. Any touch landing
 * outside this chart's canvas clears its active elements and hides the tooltip.
 */
const touchTooltipDismiss: Plugin = {
    id: 'touchTooltipDismiss',
    afterInit(chart) {
        const onTouchStart = (event: TouchEvent) => {
            const canvas = chart.canvas;
            const target = event.target;
            if (!canvas || (target instanceof Node && canvas.contains(target))) return;
            // Skip the redraw when nothing is active (most outside taps hit no tooltip at all)
            if (chart.getActiveElements().length === 0 && (chart.tooltip?.getActiveElements().length ?? 0) === 0) {
                return;
            }
            chart.setActiveElements([]);
            chart.tooltip?.setActiveElements([], { x: 0, y: 0 });
            chart.update('none');
        };
        document.addEventListener('touchstart', onTouchStart, { passive: true });
        dismissListeners.set(chart, onTouchStart);
    },
    beforeDestroy(chart) {
        const listener = dismissListeners.get(chart);
        if (listener) {
            document.removeEventListener('touchstart', listener);
            dismissListeners.delete(chart);
        }
    },
};

Chart.register(
    BarController,
    BarElement,
    DoughnutController,
    ArcElement,
    LineController,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Filler,
    Tooltip,
    Legend,
    touchTooltipDismiss,
);

export { Bar, Doughnut, Line };
