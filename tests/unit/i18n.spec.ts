import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPinia, disposePinia, getActivePinia, setActivePinia } from 'pinia';

import {
    DEFAULT_LOCALE,
    LOCALE_DAYJS,
    SUPPORTED_LOCALES,
    isAppLocale,
    resolveAppLocale,
    type AppLocale,
} from '@/config/locales';
import enUS from '@/locales/en-US';
import zhCN from '@/locales/zh-CN';
import zhHK from '@/locales/zh-HK';
import jaJP from '@/locales/ja-JP';
import ruRU from '@/locales/ru-RU';
import deDE from '@/locales/de-DE';
import esES from '@/locales/es-ES';
import dayjs from '@/plugins/dayjs';
import { i18n, setI18nLocale } from '@/plugins/i18n';
import { useLocaleStore } from '@/stores/locale';

/** Collect every leaf key path in a message catalog (dotted, e.g. "overview.columns.name"). */
function leafKeys(node: unknown, prefix = ''): string[] {
    if (node === null || typeof node !== 'object' || Array.isArray(node)) return [prefix];
    return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
        leafKeys(value, prefix ? `${prefix}.${key}` : key),
    );
}

const catalogs: Record<AppLocale, Record<string, unknown>> = {
    'zh-CN': zhCN,
    'zh-HK': zhHK,
    'en-US': enUS,
    'ja-JP': jaJP,
    'ru-RU': ruRU,
    'de-DE': deDE,
    'es-ES': esES,
};

function messageAt(locale: AppLocale, path: string): string {
    const value = path
        .split('.')
        .reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], catalogs[locale]);
    expect(typeof value, `${locale}: ${path}`).toBe('string');
    return value as string;
}

function placeholders(message: string): string[] {
    return [...new Set([...message.matchAll(/\{(\w+)\}/g)].map((match) => match[1]!))].sort();
}

// Explicit expectations independent of the plugin's Intl-based rule, including decimals.
const pluralCases = [
    { count: 0, russianBranch: 2 },
    { count: 1, russianBranch: 0 },
    { count: 2, russianBranch: 1 },
    { count: 4, russianBranch: 1 },
    { count: 5, russianBranch: 2 },
    { count: 11, russianBranch: 2 },
    { count: 12, russianBranch: 2 },
    { count: 14, russianBranch: 2 },
    { count: 21, russianBranch: 0 },
    { count: 22, russianBranch: 1 },
    { count: 25, russianBranch: 2 },
    { count: 101, russianBranch: 0 },
    { count: 111, russianBranch: 2 },
    { count: 1001, russianBranch: 0 },
    { count: 1.5, russianBranch: 3 },
    { count: 2.5, russianBranch: 3 },
    { count: 0.5, russianBranch: 3 },
    { count: -1, russianBranch: 0 },
    { count: -2, russianBranch: 1 },
];

const countKeys = [
    'live.header.samples',
    'live.sidebar.days',
    'period.stats.total.day',
    'period.stats.total.month',
    'period.stats.total.year',
];
const daysKeys = [
    'overview.trend.title',
    'overview.trend.noData',
    'chart.movingAverage',
    'period.insights.day.avgOnly',
    'period.insights.day.avgWithCompare',
];
const LOCALE_KEY = 's2-locale';
const originalHtmlLang = document.documentElement.lang;
const originalDayjsLocale = dayjs.locale();
const originalStoredLocale = localStorage.getItem(LOCALE_KEY);

afterEach(() => {
    const pinia = getActivePinia();
    if (pinia) disposePinia(pinia);
    setActivePinia(undefined);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    setI18nLocale(DEFAULT_LOCALE);
    dayjs.locale(originalDayjsLocale);
    document.documentElement.lang = originalHtmlLang;
    if (originalStoredLocale === null) localStorage.removeItem(LOCALE_KEY);
    else localStorage.setItem(LOCALE_KEY, originalStoredLocale);
});

describe('locale config', () => {
    it('falls back to the default locale for unknown values', () => {
        expect(DEFAULT_LOCALE).toBe('en-US');
        expect(isAppLocale('zh-HK')).toBe(true);
        expect(isAppLocale('fr-FR')).toBe(false);
        expect(isAppLocale(null)).toBe(false);
    });

    it('resolves regional variants onto their supported representative', () => {
        expect(resolveAppLocale('zh-HK')).toBe('zh-HK');
        expect(resolveAppLocale('zh-TW')).toBe('zh-HK');
        expect(resolveAppLocale('zh_MO')).toBe('zh-HK');
        expect(resolveAppLocale('zh-Hant-CN')).toBe('zh-HK');
        expect(resolveAppLocale('zh')).toBe('zh-CN');
        expect(resolveAppLocale('zh-SG')).toBe('zh-CN');
        expect(resolveAppLocale('zh-Hans-TW')).toBe('zh-CN');
        expect(resolveAppLocale('en')).toBe('en-US');
        expect(resolveAppLocale('en-GB')).toBe('en-US');
        expect(resolveAppLocale('ja')).toBe('ja-JP');
        expect(resolveAppLocale('ru-BY')).toBe('ru-RU');
        expect(resolveAppLocale('de_CH')).toBe('de-DE');
        expect(resolveAppLocale('es-419')).toBe('es-ES');
        expect(resolveAppLocale('fr-FR')).toBe('en-US');
        expect(resolveAppLocale(null)).toBe('en-US');
        expect(resolveAppLocale(undefined)).toBe('en-US');
    });

    it('declares exactly the supported catalogs', () => {
        expect(Object.keys(catalogs).sort()).toEqual([...SUPPORTED_LOCALES].sort());
        expect(i18n.global.availableLocales.sort()).toEqual([...SUPPORTED_LOCALES].sort());
    });
});

describe('message catalogs', () => {
    it.each(SUPPORTED_LOCALES)('catalog %s contains all 292 keys and replaces samplesSuffix', (locale) => {
        const keys = leafKeys(catalogs[locale]).sort();
        expect(keys).toHaveLength(292);
        expect(keys).toEqual(leafKeys(catalogs[DEFAULT_LOCALE]).sort());
        expect(keys).toContain('live.header.samples');
        expect(keys).not.toContain('live.header.samplesSuffix');
    });

    it.each(SUPPORTED_LOCALES)('catalog %s has no unexpected empty messages or plural branches', (locale) => {
        for (const path of leafKeys(catalogs[locale])) {
            const message = messageAt(locale, path);
            if (path === 'overview.metrics.counterSuffix' || path === 'top.metrics.counterSuffix') continue;
            for (const branch of message.split('|')) {
                expect(branch.trim(), `${locale}: ${path}`).not.toBe('');
            }
        }
    });

    it.each(SUPPORTED_LOCALES)('catalog %s matches the placeholder set in every plural branch', (locale) => {
        for (const path of leafKeys(catalogs[DEFAULT_LOCALE])) {
            const expected = placeholders(messageAt(DEFAULT_LOCALE, path).split('|')[0]!);
            for (const branch of messageAt(locale, path).split('|')) {
                // Sets, not occurrence counts: a translation may repeat a parameter.
                expect(placeholders(branch), `${locale}: ${path}: ${branch}`).toEqual(expected);
            }
        }
    });
});

describe('locale store browser detection', () => {
    function stubNavigatorLanguage(language: string | undefined, languages?: string[]) {
        vi.stubGlobal('navigator', { language, languages });
    }

    function freshStoreWithBrowserLanguage(language: string | undefined, languages?: string[]) {
        const pinia = getActivePinia();
        if (pinia) disposePinia(pinia);
        localStorage.removeItem(LOCALE_KEY);
        stubNavigatorLanguage(language, languages);
        setActivePinia(createPinia());
        return useLocaleStore();
    }

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

    function expectLocaleConsumers(locale: AppLocale) {
        expect(i18n.global.locale.value).toBe(locale);
        expect(document.documentElement.lang).toBe(locale);
        expect(dayjs.locale()).toBe(LOCALE_DAYJS[locale]);
        expect(dayjs('2026-01-05').format('MMMM')).toBe(
            dayjs('2026-01-05').locale(LOCALE_DAYJS[locale]).format('MMMM'),
        );
        expect(localStorage.getItem(LOCALE_KEY)).toBe(locale);
    }

    it.each(SUPPORTED_LOCALES)('initializes all locale consumers from stored %s', (locale) => {
        localStorage.setItem(LOCALE_KEY, locale);
        stubNavigatorLanguage('fr-FR');
        setActivePinia(createPinia());
        expect(useLocaleStore().locale).toBe(locale);
        expectLocaleConsumers(locale);
    });

    it.each(SUPPORTED_LOCALES)('switches all locale consumers and plural rendering to %s', (locale) => {
        const store = freshStoreWithBrowserLanguage(locale === DEFAULT_LOCALE ? 'ja' : 'en');
        store.setLocale(locale);
        expect(store.locale).toBe(locale);
        expectLocaleConsumers(locale);
        const samples = {
            'zh-CN': '22 条采样',
            'zh-HK': '22 條採樣',
            'en-US': '22 samples',
            'ja-JP': '22 サンプル',
            'ru-RU': '22 выборки',
            'de-DE': '22 Messwerte',
            'es-ES': '22 muestras',
        };
        expect(i18n.global.t('live.header.samples', { count: '22' }, 22)).toBe(samples[locale]);
    });
});

describe('i18n instance', () => {
    it.each(SUPPORTED_LOCALES)('compiles and interpolates all messages and plural branches in %s', (locale) => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        setI18nLocale(locale);
        for (const path of leafKeys(catalogs[locale])) {
            expect(i18n.global.te(path, locale), `${locale}: ${path}`).toBe(true);
            const message = messageAt(locale, path);
            const branches = message.includes('|') ? message.split('|').map((branch) => branch.trim()) : [message];
            const visited = new Set<number>();
            for (const { count, russianBranch } of pluralCases) {
                const branchIndex =
                    branches.length === 1 ? 0 : locale === 'ru-RU' ? russianBranch : Math.abs(count) === 1 ? 0 : 1;
                visited.add(branchIndex);
                const branch = branches[branchIndex]!;
                const params = Object.fromEntries(placeholders(message).map((name) => [name, `__${name}__`]));
                // Both numeric placeholders can be formatted strings; the third argument selects the form.
                if ('count' in params) params.count = new Intl.NumberFormat(locale).format(count);
                if ('days' in params) params.days = new Intl.NumberFormat(locale).format(count);
                const rendered = i18n.global.t(path, params, count);
                expect(rendered, `${locale}: ${path} (${count})`).toBe(
                    branch.replace(/\{(\w+)\}/g, (_, name: string) => params[name]!),
                );
                expect(rendered, `${locale}: ${path} (${count})`).not.toBe(path);
                expect(rendered).not.toMatch(/\{\w+\}|\|/);
            }
            expect([...visited].sort(), `${locale}: ${path}: all branches compiled`).toEqual(
                branches.map((_, index) => index),
            );
        }
        expect(warn.mock.calls).toEqual([]);
        expect(error.mock.calls).toEqual([]);
    });

    it.each(SUPPORTED_LOCALES)('resolves a parameterised message in %s', (locale) => {
        const titles = {
            'zh-CN': '全部接口 · 近 30 天趋势',
            'zh-HK': '全部介面 · 近 30 天趨勢',
            'en-US': 'All interfaces · last 30 days',
            'ja-JP': '全インターフェース · 過去 30 日',
            'ru-RU': 'Все интерфейсы · за 30 дней',
            'de-DE': 'Alle Schnittstellen · letzte 30 Tage',
            'es-ES': 'Todas las interfaces · últimos 30 días',
        };
        setI18nLocale(locale);
        expect(i18n.global.t('overview.trend.title', { days: 30 }, 30)).toBe(titles[locale]);
    });

    it.each(SUPPORTED_LOCALES)('keeps the CJK counters only in the Chinese catalogs (%s)', (locale) => {
        setI18nLocale(locale);
        const expected = locale === 'zh-CN' ? ' 个' : locale === 'zh-HK' ? ' 個' : '';
        expect(i18n.global.t('overview.metrics.counterSuffix')).toBe(expected);
        const topExpected = locale === 'zh-CN' ? '条' : locale === 'zh-HK' ? '條' : '';
        expect(i18n.global.t('top.metrics.counterSuffix')).toBe(topExpected);
    });

    it.each(SUPPORTED_LOCALES)('accepts an explicit count with separately formatted display values in %s', (locale) => {
        setI18nLocale(locale);
        for (const key of countKeys) {
            expect(placeholders(messageAt(locale, key))).toEqual(['count']);
            expect(i18n.global.t(key, { count: '1,001' }, 1001)).toContain('1,001');
        }
        for (const key of daysKeys) {
            const params = { days: '1,001', avg: '10 GiB', change: '+5' };
            expect(i18n.global.t(key, params, 1001)).toContain('1,001');
        }
    });

    it.each(pluralCases)(
        'uses Russian noun forms for $count including fractional counts',
        ({ count, russianBranch }) => {
            setI18nLocale('ru-RU');
            const display = new Intl.NumberFormat('ru-RU').format(count);
            const forms = {
                'live.header.samples': ['выборка', 'выборки', 'выборок', 'выборки'],
                'live.sidebar.days': ['день', 'дня', 'дней', 'дня'],
                'period.stats.total.day': ['день', 'дня', 'дней', 'дня'],
                'period.stats.total.month': ['месяц', 'месяца', 'месяцев', 'месяца'],
                'period.stats.total.year': ['год', 'года', 'лет', 'года'],
            };
            for (const [key, nouns] of Object.entries(forms)) {
                const prefix = key.startsWith('period.') ? 'Итог за ' : '';
                expect(i18n.global.t(key, { count: display }, count)).toBe(
                    `${prefix}${display} ${nouns[russianBranch]}`,
                );
            }
        },
    );

    it('uses neutral Russian ratios even when traffic is below the historical average', () => {
        setI18nLocale('ru-RU');
        const params = { total: '10 GiB', speed: '1 Mbps', ratio: '0,5' };
        expect(i18n.global.t('period.insights.hour.recent', params)).toBe(
            'Итог за последние 24 ч: 10 GiB, 0,5× от исторического суточного среднего',
        );
        expect(i18n.global.t('period.insights.hour.recentWithSpeed', params)).toBe(
            'Итог за последние 24 ч: 10 GiB, средняя скорость 1 Mbps, 0,5× от исторического суточного среднего',
        );
    });

    it('uses idiomatic Spanish replay and traffic quota labels', () => {
        setI18nLocale('es-ES');
        expect(i18n.global.t('live.chart.exitReplay')).toBe('Volver al modo en directo');
        for (const key of ['panelTitle', 'inputLabel', 'adjust', 'set']) {
            expect(i18n.global.t(`period.quota.${key}`)).toContain('tráfico');
        }
        expect(i18n.global.t('period.quota.inputLabel')).not.toContain('Importe');
    });

    it('enables missing and fallback warnings only in development', () => {
        expect(i18n.global.missingWarn).toBe(import.meta.env.DEV);
        expect(i18n.global.fallbackWarn).toBe(import.meta.env.DEV);
    });
});
