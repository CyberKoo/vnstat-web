import { createI18n } from 'vue-i18n';

import { DEFAULT_LOCALE } from '@/config/locales';
import enUS from '@/locales/en-US';
import zhCN from '@/locales/zh-CN';
import zhHK from '@/locales/zh-HK';
import jaJP from '@/locales/ja-JP';
import ruRU from '@/locales/ru-RU';
import deDE from '@/locales/de-DE';
import esES from '@/locales/es-ES';

import type { AppLocale } from '@/config/locales';

/**
 * Global i18n instance.
 *
 * `legacy: false` enables the Composition API (`useI18n` / `$t` in templates).
 * `missingWarn` is silenced because the migration is incremental: views that
 * have not been converted yet keep their inline copy, and a missing key should
 * not spam the console while that is the case.
 */
export const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: DEFAULT_LOCALE,
    fallbackLocale: DEFAULT_LOCALE,
    missingWarn: false,
    fallbackWarn: false,
    messages: {
        'zh-CN': zhCN,
        'zh-HK': zhHK,
        'en-US': enUS,
        'ja-JP': jaJP,
        'ru-RU': ruRU,
        'de-DE': deDE,
        'es-ES': esES,
    },
});

/** Switch the active locale on the global instance. */
export function setI18nLocale(locale: AppLocale) {
    i18n.global.locale.value = locale;
}

export default i18n;
