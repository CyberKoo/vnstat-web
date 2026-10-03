import { afterEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { DEFAULT_LOCALE, SUPPORTED_LOCALES, isAppLocale, resolveAppLocale } from '@/config/locales';
import enUS from '@/locales/en-US';
import { i18n, setI18nLocale } from '@/plugins/i18n';
import { useLocaleStore } from '@/stores/locale';
import zhCN from '@/locales/zh-CN';
import zhHK from '@/locales/zh-HK';
import jaJP from '@/locales/ja-JP';
import ruRU from '@/locales/ru-RU';
import deDE from '@/locales/de-DE';
import esES from '@/locales/es-ES';

/** Collect every leaf key path in a message catalog (dotted, e.g. "overview.columns.name"). */
function leafKeys(node: unknown, prefix = ''): string[] {
    if (node === null || typeof node !== 'object' || Array.isArray(node)) return [prefix];
    return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
        leafKeys(value, prefix ? `${prefix}.${key}` : key),
    );
}

const catalogs: Record<string, Record<string, unknown>> = {
    'zh-CN': zhCN as Record<string, unknown>,
    'zh-HK': zhHK as Record<string, unknown>,
    'en-US': enUS as Record<string, unknown>,
    'ja-JP': jaJP as Record<string, unknown>,
    'ru-RU': ruRU as Record<string, unknown>,
    'de-DE': deDE as Record<string, unknown>,
    'es-ES': esES as Record<string, unknown>,
};

describe('locale config', () => {
    it('falls back to the default locale for unknown values', () => {
        expect(DEFAULT_LOCALE).toBe('en-US');
        expect(isAppLocale('zh-HK')).toBe(true);
        expect(isAppLocale('fr-FR')).toBe(false);
        expect(isAppLocale(null)).toBe(false);
    });

    it('resolves regional variants onto their supported representative', () => {
        // Traditional Chinese variants share the zh-HK catalog
        expect(resolveAppLocale('zh-HK')).toBe('zh-HK');
        expect(resolveAppLocale('zh-TW')).toBe('zh-HK');
        expect(resolveAppLocale('zh_MO')).toBe('zh-HK');
        expect(resolveAppLocale('zh-Hant-CN')).toBe('zh-HK');

        // Simplified Chinese variants share the zh-CN catalog
        expect(resolveAppLocale('zh')).toBe('zh-CN');
        expect(resolveAppLocale('zh-SG')).toBe('zh-CN');
        expect(resolveAppLocale('zh-Hans-TW')).toBe('zh-CN');

        // English variants share the en-US catalog
        expect(resolveAppLocale('en')).toBe('en-US');
        expect(resolveAppLocale('en-GB')).toBe('en-US');

        // ja / ru / de / es variants map onto their supported catalog
        expect(resolveAppLocale('ja')).toBe('ja-JP');
        expect(resolveAppLocale('ru-BY')).toBe('ru-RU');
        expect(resolveAppLocale('de_CH')).toBe('de-DE');
        expect(resolveAppLocale('es-419')).toBe('es-ES');

        // Anything else falls back to the default locale
        expect(resolveAppLocale('fr-FR')).toBe('en-US');
        expect(resolveAppLocale(null)).toBe('en-US');
        expect(resolveAppLocale(undefined)).toBe('en-US');
    });

    it('declares a catalog for every supported locale', () => {
        for (const locale of SUPPORTED_LOCALES) {
            expect(catalogs[locale], `missing catalog for ${locale}`).toBeDefined();
        }
    });
});

describe('message catalogs', () => {
    // The migration is incremental, so a key that exists in one catalog but not
    // another silently renders in the fallback language. This guard turns
    // that invisible failure into a test failure.
    it.each(SUPPORTED_LOCALES.filter((l) => l !== DEFAULT_LOCALE))(
        'catalog %s has exactly the same key structure as the default locale',
        (locale) => {
            expect(leafKeys(catalogs[locale]).sort()).toEqual(leafKeys(catalogs[DEFAULT_LOCALE]).sort());
        },
    );

    it.each(SUPPORTED_LOCALES)('catalog %s has no empty message values', (locale) => {
        // The only value allowed to be empty is a locale-specific counter that
        // has no equivalent in that language.
        const empty = leafKeys(catalogs[locale])
            .filter((path) => {
                const value = path
                    .split('.')
                    .reduce<unknown>((acc, part) => (acc as Record<string, unknown>)?.[part], catalogs[locale]);
                return typeof value === 'string' && value.trim() === '';
            })
            .filter((path) => !path.endsWith('counterSuffix'));
        expect(empty).toEqual([]);
    });
});

describe('locale store browser detection', () => {
    const LOCALE_KEY = 's2-locale';

    /** Stub the browser language list the way happy-dom does not let us set directly. */
    function stubNavigatorLanguage(language: string | undefined, languages?: string[]) {
        Object.defineProperty(globalThis.navigator, 'language', { configurable: true, value: language });
        Object.defineProperty(globalThis.navigator, 'languages', { configurable: true, value: languages });
    }

    function freshStoreWithBrowserLanguage(language: string | undefined, languages?: string[]) {
        localStorage.removeItem(LOCALE_KEY);
        stubNavigatorLanguage(language, languages);
        setActivePinia(createPinia());
        return useLocaleStore();
    }

    afterEach(() => {
        localStorage.removeItem(LOCALE_KEY);
        setI18nLocale(DEFAULT_LOCALE);
    });

    it('picks the browser language on first visit', () => {
        expect(freshStoreWithBrowserLanguage('zh-TW').locale).toBe('zh-HK');
        expect(freshStoreWithBrowserLanguage('zh-SG').locale).toBe('zh-CN');
        expect(freshStoreWithBrowserLanguage('en-GB').locale).toBe('en-US');
    });

    it('scans the whole language list and skips unsupported tags', () => {
        expect(freshStoreWithBrowserLanguage('fr-FR', ['fr-FR', 'zh-Hans']).locale).toBe('zh-CN');
    });

    it('falls back to the default locale when nothing matches', () => {
        expect(freshStoreWithBrowserLanguage('fr-FR', ['fr-FR', 'pt-BR']).locale).toBe(DEFAULT_LOCALE);
    });

    it('lets a stored preference win over the browser language', () => {
        localStorage.setItem(LOCALE_KEY, 'zh-CN');
        stubNavigatorLanguage('en-GB');
        setActivePinia(createPinia());
        expect(useLocaleStore().locale).toBe('zh-CN');
    });
});

describe('i18n instance', () => {
    it('resolves a parameterised message in every locale', () => {
        setI18nLocale('zh-CN');
        expect(i18n.global.t('overview.trend.title', { days: 30 })).toBe('全部接口 · 近 30 天趋势');

        setI18nLocale('zh-HK');
        expect(i18n.global.t('overview.trend.title', { days: 30 })).toBe('全部介面 · 近 30 天趨勢');

        setI18nLocale('en-US');
        expect(i18n.global.t('overview.trend.title', { days: 30 })).toBe('All interfaces · last 30 days');
    });

    it('keeps the CJK counter only in the Chinese catalogs', () => {
        setI18nLocale('zh-CN');
        expect(i18n.global.t('overview.metrics.counterSuffix')).toBe(' 个');

        setI18nLocale('zh-HK');
        expect(i18n.global.t('overview.metrics.counterSuffix')).toBe(' 個');

        setI18nLocale('en-US');
        expect(i18n.global.t('overview.metrics.counterSuffix')).toBe('');
    });

    afterEach(() => {
        setI18nLocale(DEFAULT_LOCALE);
    });
});
