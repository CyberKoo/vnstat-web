import { afterEach, describe, expect, it } from 'vitest';
import { computed } from 'vue';

import { SUPPORTED_LOCALES } from '@/config/locales';
import { i18n, setI18nLocale } from '@/plugins/i18n';
import { formatDecimal, formatNumber } from '@/utils/numbers';
import { bytesToRate, formatByteRate, formatBytes } from '@/utils/bytes';

const originalLocale = i18n.global.locale.value;
afterEach(() => setI18nLocale(originalLocale));

describe('number formatting', () => {
    it.each(SUPPORTED_LOCALES)('uses app locale %s for display while retaining parseable values', (locale) => {
        setI18nLocale(locale);
        const decimal = new Intl.NumberFormat(locale, {
            useGrouping: false,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(1.5);
        expect(formatDecimal(1.5, 2)).toBe(decimal);
        expect(formatNumber(12345, { useGrouping: true })).toBe(new Intl.NumberFormat(locale).format(12345));
        expect(formatBytes(1536).formatted).toBe(`${decimal} KiB`);
        expect(formatBytes(1536).value).toBe('1.50');
        expect(formatBytes(1536).raw).toBe(1536);
        expect(bytesToRate(187500).formatted).toBe(`${decimal} Mbps`);
        expect(bytesToRate(187500).value).toBe('1.50');
        expect(formatByteRate(1536, 2)).toBe(`${decimal} KiB/s`);
    });

    it('invalidates formatted rates and byte totals without new data', () => {
        setI18nLocale('en-US');
        const formatted = computed(() => [formatBytes(1536).formatted, bytesToRate(187500).formatted]);
        expect(formatted.value).toEqual(['1.50 KiB', '1.50 Mbps']);
        setI18nLocale('de-DE');
        expect(formatted.value).toEqual(['1,50 KiB', '1,50 Mbps']);
        setI18nLocale('en-US');
        expect(formatted.value).toEqual(['1.50 KiB', '1.50 Mbps']);
    });

    it('preserves empty values and requested precision without grouping', () => {
        setI18nLocale('de-DE');
        expect(formatBytes(undefined).formatted).toBe('0 B');
        expect(bytesToRate(0).formatted).toBe('0 bps');
        expect(formatBytes(1500, 3).formatted).toBe('1,465 KiB');
        expect(formatDecimal(12345, 1)).toBe('12345,0');
    });
});
