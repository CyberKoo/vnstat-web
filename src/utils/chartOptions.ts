import { type ChartData, type ChartOptions, type Scale, type Tick, type TooltipItem } from 'chart.js';
import { BYTES_UNITS, BYTES_UNITS_DESC, type ByteUnit, compareUnit } from '@/constants';
import { i18n } from '@/plugins/i18n';
import type { ChartTheme } from '@/types/chart';
import { formatDecimal } from '@/utils/numbers';

/**
 * Chooses a unified display unit automatically from the maximum value in the dataset
 *
 * Algorithm:
 * 1. Find the maximum value among all values
 * 2. Walk the byte units from largest to smallest (EiB -> PiB -> TiB -> GiB -> MiB -> KiB -> B)
 * 3. Pick the first unit that satisfies "max value >= unit threshold"
 * 4. If no unit satisfies it, fall back to B
 *
 * @param values - Array of values to analyze (in bytes)
 * @returns An object holding the unit label and the unit size
 *
 * @example
 * ```typescript
 * // The maximum value is 2048 bytes
 * const result = decideUnitByMax([512, 1024, 2048]);
 * // Returns: { unitLabel: 'KiB', unitSize: 1024 }
 * ```
 */
function decideUnitByMax(values: number[]): {
    unitLabel: ByteUnit;
    unitSize: number;
} {
    // Validate the data: check the input is a non-empty array of non-negative finite numbers
    if (!Array.isArray(values) || values.length === 0 || values.some((v) => !Number.isFinite(v) || v < 0)) {
        // Fall back to B for invalid or negative values
        return { unitLabel: 'B', unitSize: 1 };
    }

    // Find the maximum value in the dataset
    const maxValueBytes = Math.max(...values);

    // Walk from largest to smallest (BYTES_UNITS_DESC = EiB -> PiB -> ... -> B) and pick the first match
    for (const u of BYTES_UNITS_DESC) {
        if (maxValueBytes >= u.size) {
            return { unitLabel: u.label, unitSize: u.size };
        }
    }

    // Reached when maxValueBytes is below 1 (i.e. 0)
    return { unitLabel: 'B', unitSize: 1 };
}

/**
 * Applies a minimum unit constraint
 *
 * If the automatically chosen unit is smaller than the given minimum unit, force the minimum unit.
 * This is useful in cases where values should always be shown in KB even when the data is small.
 *
 * @param unitLabel - The automatically chosen unit label
 * @param minUnit - Optional minimum unit constraint
 * @returns The unit information after the constraint is applied
 *
 * @example
 * ```typescript
 * // The automatic choice is B, but the minimum unit requires KiB
 * const result = applyMinUnit('B', 'KiB');
 * // Returns: { unitLabel: 'KiB', unitSize: 1024 }
 * ```
 */
function applyMinUnit(unitLabel: ByteUnit, minUnit?: ByteUnit): { unitLabel: ByteUnit; unitSize: number } {
    // A minimum unit is given and the current unit is smaller than it
    if (minUnit && compareUnit(unitLabel, minUnit) < 0) {
        // Look up the configuration of the minimum unit
        const u = BYTES_UNITS.find((u) => u.label === minUnit);
        return { unitLabel: minUnit, unitSize: u!.size };
    }

    // Otherwise keep the original unit
    const finalUnit = BYTES_UNITS.find((u) => u.label === unitLabel)!;
    return { unitLabel: finalUnit.label, unitSize: finalUnit.size };
}

/**
 * Creates a bar chart configuration with adaptive byte units
 *
 * This function produces a complete Chart.js bar chart configuration with the following features:
 * - Automatically selects a suitable byte unit based on the data range
 * - Supports stacked bars
 * - Custom theme colors
 * - Custom tooltip and axis labels
 * - Responsive design
 *
 * @param params - Configuration parameter object
 * @param params.theme - Canvas-rendered theme colours (see `useChartTheme`)
 * @param params.datasets - Chart datasets; each one holds a label, data, and an optional background color
 * @param params.tooltipTitle - Optional custom tooltip title function
 * @param params.xAxis - X axis configuration options
 * @param params.xAxis.formatter - Formatter for the X axis tick labels
 * @param params.xAxis.text - X axis title text
 * @param params.yTitle - Y axis title, defaults to "Traffic (unit)"
 * @param params.minUnit - Minimum display unit constraint
 *
 * @returns The complete Chart.js bar chart configuration object
 *
 * @example
 * ```typescript
 * const chartOptions = createAdaptiveBarChartOptions({
 *   theme: chartTheme,
 *   datasets: [
 *     {
 *       label: 'Upload traffic',
 *       data: [1024, 2048, 4096], // in bytes
 *       backgroundColor: '#3b82f6'
 *     }
 *   ],
 *   xAxis: {
 *     text: 'Time span',
 *     formatter: (value, index) => `Day ${index + 1}`
 *   },
 *   yTitle: 'Network traffic',
 *   minUnit: 'KiB'
 * });
 * ```
 */
export function createAdaptiveBarChartOptions(params: {
    theme: ChartTheme;
    data: ChartData<'bar'>;
    tooltipTitle?: (tooltipItems: TooltipItem<'bar'>[]) => string;
    xAxis?: {
        formatter?: (this: Scale, tickValue: string | number, index: number, values: Tick[]) => string;
        text?: string;
        maxTicksLimit?: number;
        /** Hide the x axis tick labels */
        hideTicks?: boolean;
    };
    yTitle?: string;
    minUnit?: ByteUnit;
}): ChartOptions<'bar'> {
    const { theme, data, yTitle, minUnit, tooltipTitle, xAxis } = params;

    // Extract the rx and tx data
    const rx = (data.datasets[0]?.data as number[]) || [];
    const tx = (data.datasets[1]?.data as number[]) || [];

    // Compute the total traffic of each day
    const allValues = rx.map((v, idx) => (Number(v) || 0) + (Number(tx[idx]) || 0));

    // Choose the display unit automatically from the maximum data value
    const decided = decideUnitByMax(allValues);
    // Apply the minimum unit constraint
    const { unitLabel, unitSize } = applyMinUnit(decided.unitLabel, minUnit);

    return {
        responsive: true, // Responsive chart
        maintainAspectRatio: false, // Do not keep a fixed aspect ratio
        // Animation configuration
        animation: {
            duration: 600, // Animation duration in milliseconds
            easing: 'linear', // Linear animation easing
        },
        // Plugin configuration
        plugins: {
            // Legend configuration
            legend: {
                display: true,
                position: 'top',
                labels: {
                    color: theme.textColor, // Use the theme text color
                },
            },
            // Tooltip configuration
            tooltip: {
                enabled: true,
                callbacks: {
                    // Use the custom title function when one is provided
                    ...(tooltipTitle && { title: tooltipTitle }),
                    // Custom label display format
                    label: function (context: TooltipItem<'bar'>) {
                        // Convert the raw byte value to the selected unit
                        const valueBytes = (context.parsed.y || 0) / unitSize;
                        return `${context.dataset.label}: ${formatDecimal(valueBytes, 2)} ${unitLabel}`;
                    },
                },
            },
            // Hide the main title
            title: {
                display: false,
            },
        },
        // Layout configuration
        layout: {
            padding: {
                right: 25, // Leave room on the right so labels are not clipped
            },
        },
        // Axis configuration
        scales: {
            // X axis configuration
            x: {
                stacked: true, // Enable stacking
                title: {
                    display: !!xAxis?.text,
                    text: xAxis?.text ?? '',
                    color: theme.textColor,
                },
                grid: {
                    color: theme.gridColor,
                },
                ticks: {
                    display: !xAxis?.hideTicks,
                    maxTicksLimit: xAxis?.maxTicksLimit ?? 10,
                    color: theme.textColor,
                    // Apply the formatter when one is provided
                    ...(xAxis?.formatter && {
                        callback: xAxis.formatter,
                    }),
                },
                type: 'category', // Category axis type
            },
            // Y axis configuration
            y: {
                stacked: true, // Enable stacking
                type: 'linear', // Linear axis
                grid: {
                    color: theme.gridColor, // Grid line color
                },
                title: {
                    display: !!yTitle,
                    text: yTitle ?? i18n.global.t('chart.trafficWithUnit', { unit: unitLabel }), // Default title includes the unit
                    color: theme.textColor,
                },
                beginAtZero: true, // Start at 0
                ticks: {
                    maxTicksLimit: 6, // Maximum number of ticks
                    stepSize: unitSize, // Keep tick values multiples of unitSize so labels do not repeat after rounding
                    color: theme.textColor,
                    // Custom Y axis tick label format
                    callback(this, tickValue) {
                        // Handle tick values of both string and number type
                        const vBytes = typeof tickValue === 'string' ? Number(tickValue) : tickValue;
                        // Convert to the selected unit and format (integer, since stepSize keeps values as
                        // multiples of unitSize)
                        const v = vBytes / unitSize;
                        return `${formatDecimal(v, 0)} ${unitLabel}`;
                    },
                },
            },
        },
    };
}
