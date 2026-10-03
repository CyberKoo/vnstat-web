/**
 * Locales supported by the app.
 *
 * Adding a language means: extend this tuple, add a matching catalog under
 * `src/locales/`, register it in `src/plugins/i18n.ts`, and map it to a
 * dayjs locale (see `LOCALE_DAYJS`).
 */
export const SUPPORTED_LOCALES = ['zh-CN', 'zh-HK', 'en-US', 'ja-JP', 'ru-RU', 'de-DE', 'es-ES'] as const;

/** Locale the app falls back to; also the source of truth for all message catalogs. */
export const DEFAULT_LOCALE = 'en-US';

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

/** dayjs locale name for each app locale; keeps date formatting aligned with the UI language. */
export const LOCALE_DAYJS: Record<AppLocale, string> = {
    'zh-CN': 'zh-cn',
    'zh-HK': 'zh-hk',
    'en-US': 'en',
    'ja-JP': 'ja',
    'ru-RU': 'ru',
    'de-DE': 'de',
    'es-ES': 'es',
};

export function isAppLocale(value: unknown): value is AppLocale {
    return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Match an arbitrary language tag against the supported app locales.
 *
 * Same mapping as resolveAppLocale, but returns null for unsupported tags instead
 * of falling back to DEFAULT_LOCALE — used by browser-language detection, where an
 * unsupported primary language must not mask a supported secondary one, and where
 * a real en-US primary must win over a later zh-* entry.
 */
export function matchAppLocale(value: unknown): AppLocale | null {
    if (isAppLocale(value)) return value;
    if (typeof value !== 'string') return null;

    const tag = value.toLowerCase().replace(/_/g, '-');
    if (tag === 'zh' || /^zh-(cn|sg|my)(-|$)/.test(tag) || (tag.startsWith('zh-') && tag.includes('hans'))) {
        return 'zh-CN';
    }
    if (/^zh-(hk|tw|mo)(-|$)/.test(tag) || (tag.startsWith('zh-') && tag.includes('hant'))) {
        return 'zh-HK';
    }
    if (tag === 'en' || tag.startsWith('en-')) {
        return 'en-US';
    }
    if (tag === 'ja' || tag.startsWith('ja-')) {
        return 'ja-JP';
    }
    if (tag === 'ru' || tag.startsWith('ru-')) {
        return 'ru-RU';
    }
    if (tag === 'de' || tag.startsWith('de-')) {
        return 'de-DE';
    }
    if (tag === 'es' || tag.startsWith('es-')) {
        return 'es-ES';
    }
    return null;
}

/**
 * Resolve an arbitrary language tag (localStorage value, browser setting) to a
 * supported app locale.
 *
 * Regional variants of the same language map onto their supported representative
 * instead of falling straight to the default locale:
 * - Traditional Chinese (zh-TW / zh-MO / any `zh-*-Hant` tag) → zh-HK
 * - Simplified Chinese (bare `zh` / zh-SG / any `zh-*-Hans` tag) → zh-CN
 * - any other `en-*` variant → en-US
 * - any `ja-*` / `ru-*` / `de-*` / `es-*` variant → ja-JP / ru-RU / de-DE / es-ES
 */
export function resolveAppLocale(value: unknown): AppLocale {
    return matchAppLocale(value) ?? DEFAULT_LOCALE;
}
