import { afterEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { DEFAULT_LOCALE, matchAppLocale } from '@/config/locales';
import { setI18nLocale } from '@/plugins/i18n';
import { useLocaleStore } from '@/stores/locale';

describe('matchAppLocale', () => {
    it.each([
        ['en-US', 'en-US'],
        ['en-GB', 'en-US'],
        ['en', 'en-US'],
    ] as const)('maps English tag %s onto %s, never null', (tag, expected) => {
        // The browser-detection bug came from en-* tags being indistinguishable
        // from unsupported ones; a real English primary must win over a later
        // zh-* entry, so these have to return en-US rather than null.
        expect(matchAppLocale(tag)).toBe(expected);
    });

    it.each([
        ['zh-CN', 'zh-CN'],
        ['zh', 'zh-CN'],
        ['zh-SG', 'zh-CN'],
        ['zh-Hans-TW', 'zh-CN'],
    ] as const)('maps Simplified Chinese tag %s onto %s', (tag, expected) => {
        expect(matchAppLocale(tag)).toBe(expected);
    });

    it.each([
        ['zh-HK', 'zh-HK'],
        ['zh-TW', 'zh-HK'],
        ['zh-Hant', 'zh-HK'],
    ] as const)('maps Traditional Chinese tag %s onto %s', (tag, expected) => {
        expect(matchAppLocale(tag)).toBe(expected);
    });

    it.each([
        ['ja-JP', 'ja-JP'],
        ['ja', 'ja-JP'],
        ['ru', 'ru-RU'],
        ['ru-BY', 'ru-RU'],
        ['de', 'de-DE'],
        ['de-AT', 'de-DE'],
        ['es', 'es-ES'],
        ['es-MX', 'es-ES'],
    ] as const)('maps tag %s onto supported locale %s', (tag, expected) => {
        expect(matchAppLocale(tag)).toBe(expected);
    });

    it.each(['fr-FR', 'pt', '', null, undefined])('returns null for unsupported tag %s', (tag) => {
        expect(matchAppLocale(tag)).toBeNull();
    });
});

describe('locale store browser detection', () => {
    const LOCALE_KEY = 's2-locale';

    /** Stub the browser language list the way happy-dom does not let us set directly. */
    function stubNavigatorLanguage(language: string | undefined, languages?: string[]) {
        Object.defineProperty(globalThis.navigator, 'language', { configurable: true, value: language });
        Object.defineProperty(globalThis.navigator, 'languages', { configurable: true, value: languages });
    }

    function freshStore(languages: string[], stored: string | null) {
        if (stored === null) localStorage.removeItem(LOCALE_KEY);
        else localStorage.setItem(LOCALE_KEY, stored);
        stubNavigatorLanguage(languages[0], languages);
        setActivePinia(createPinia());
        return useLocaleStore();
    }

    afterEach(() => {
        localStorage.removeItem(LOCALE_KEY);
        setI18nLocale(DEFAULT_LOCALE);
    });

    it('prefers the primary browser language over a supported secondary one', () => {
        // Regression: the old resolveAppLocale-based scan treated en-US as the
        // fallback value, so ['en-US', 'zh-CN'] wrongly picked zh-CN.
        expect(freshStore(['en-US', 'zh-CN'], null).locale).toBe('en-US');
    });

    it('skips an unsupported primary language instead of letting it mask a supported one', () => {
        expect(freshStore(['fr-FR', 'zh-TW'], null).locale).toBe('zh-HK');
    });

    it('falls back to the default locale when nothing in the list matches', () => {
        expect(freshStore(['fr-FR', 'pt-BR'], null).locale).toBe(DEFAULT_LOCALE);
    });

    it('lets a stored preference win over browser detection', () => {
        expect(freshStore(['en-US', 'zh-CN'], 'zh-HK').locale).toBe('zh-HK');
    });

    it('falls back to browser detection when the stored preference is garbage', () => {
        // A garbage value is not a valid locale: ignore it and run browser detection instead.
        expect(freshStore(['zh-CN'], 'klingon').locale).toBe('zh-CN');
    });
});
