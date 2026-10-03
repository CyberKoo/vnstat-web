import type { Plugin } from 'chart.js';

import { palette } from '@/config/colors';
import { i18n } from '@/plugins/i18n';

export interface MeanLineTheme {
    fontFamily: string;
    surfaceColor: string;
}

/**
 * Mean reference line for total traffic on a horizontal bar chart.
 *
 * The theme is read on every draw, so switching light/dark does not require rebuilding the plugin instance.
 */
export function createMeanLinePlugin(getTheme: () => MeanLineTheme): Plugin<'bar'> {
    return {
        id: 'meanLine',
        afterDatasetsDraw(chart) {
            const { ctx, chartArea, scales } = chart;
            const data = chart.data.datasets[0]?.data as number[] | undefined;
            if (!ctx || !chartArea || !data?.length) return;
            const mean = data.reduce((sum, value) => sum + (Number(value) || 0), 0) / data.length;
            if (!Number.isFinite(mean) || mean <= 0) return;
            const x = scales.x.getPixelForValue(mean);
            if (!Number.isFinite(x)) return;

            const theme = getTheme();
            ctx.save();
            ctx.strokeStyle = palette.accent;
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.moveTo(x, chartArea.top);
            ctx.lineTo(x, chartArea.bottom);
            ctx.stroke();
            ctx.setLineDash([]);
            // Resolved at draw time so the chip follows locale switches on the next redraw
            const label = i18n.global.t('top.chart.meanLine');
            ctx.font = `600 10px ${theme.fontFamily}`;
            const textWidth = ctx.measureText(label).width;
            const chipW = textWidth + 8;
            const chipH = 14;
            const chipY = chartArea.top + 1;
            let chipX: number;
            let textX: number;
            if (x > (chartArea.left + chartArea.right) / 2) {
                chipX = x - 5 - chipW;
                textX = x - 5 - chipW + 4;
            } else {
                chipX = x + 5;
                textX = x + 9;
            }
            ctx.fillStyle = theme.surfaceColor;
            ctx.beginPath();
            ctx.roundRect(chipX, chipY, chipW, chipH, 3);
            ctx.fill();
            ctx.fillStyle = palette.accent;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';
            ctx.fillText(label, textX, chipY + chipH / 2 + 0.5);
            ctx.restore();
        },
    };
}
