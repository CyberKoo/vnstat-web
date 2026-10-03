import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import dayjs from '@/plugins/dayjs';
import { setI18nLocale } from '@/plugins/i18n';
import { DEFAULT_LOCALE, LOCALE_DAYJS, matchAppLocale, type AppLocale } from '@/config/locales';

const LOCALE_KEY = 's2-locale';

function readLocale(): AppLocale {
    try {
        const stored = globalThis.localStorage?.getItem(LOCALE_KEY);
        // Garbage stored values fall through to browser detection rather than the default locale
        const matched = matchAppLocale(stored);
        if (matched) return matched;
    } catch {
        // localStorage unavailable — fall through to browser detection
    }
    return detectBrowserLocale();
}

/**
 * Pick a locale from the browser's language list on first visit.
 *
 * `navigator.languages` is tried in order and the first tag that maps onto a
 * supported app locale wins; anything unsupported is skipped so a secondary
 * language can still match. Falls back to `DEFAULT_LOCALE` when nothing
 * matches.
 */
function detectBrowserLocale(): AppLocale {
    const nav = globalThis.navigator;
    const candidates = nav?.languages?.length ? [...nav.languages] : nav?.language ? [nav.language] : [];
    const match = candidates.map((tag) => matchAppLocale(tag)).find((locale) => locale !== null);
    return match ?? DEFAULT_LOCALE;
}

/**
 * UI language preference store.
 *
 * Owns the single source of truth for the active locale and pushes it to the
 * consumers that must stay in sync:
 * - the vue-i18n instance (message lookup)
 * - the dayjs global locale (date formatting)
 * - `<html lang>` (screen-reader pronunciation, :lang() selectors)
 */
export const useLocaleStore = defineStore('locale', () => {
    const locale = ref<AppLocale>(readLocale());

    watch(
        locale,
        (value) => {
            setI18nLocale(value);
            dayjs.locale(LOCALE_DAYJS[value]);
            document.documentElement.lang = value;
            try {
                globalThis.localStorage?.setItem(LOCALE_KEY, value);
            } catch {
                // Keep the in-memory state only when localStorage is unavailable
            }
        },
        { flush: 'sync', immediate: true },
    );

    function setLocale(value: AppLocale) {
        locale.value = value;
    }

    return { locale, setLocale };
});
