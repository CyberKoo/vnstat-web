import { i18n } from '@/plugins/i18n';

// Reuse Intl formatters: chart ticks and live rates format numbers on every redraw.
const formatters = new Map<string, Intl.NumberFormat>();

/** Display numbers in the UI language, independently of the browser's language. */
export function formatNumber(value: number, options: Intl.NumberFormatOptions = {}): string {
    const locale = i18n.global.locale.value;
    const key = JSON.stringify([locale, options]);
    let formatter = formatters.get(key);
    if (!formatter) {
        formatter = new Intl.NumberFormat(locale, { useGrouping: false, ...options });
        formatters.set(key, formatter);
    }
    return formatter.format(value);
}

/** Fixed-precision display text; never use this for CSS, input values or parsing. */
export function formatDecimal(value: number, fixed: number): string {
    return formatNumber(value, { minimumFractionDigits: fixed, maximumFractionDigits: fixed });
}
