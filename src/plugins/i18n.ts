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

const russianPluralRules = new Intl.PluralRules('ru-RU');

/**
 * Global Composition API instance; missing translations warn in development.
 * Count messages use t(key, { count: formattedCount }, numericCount) so display
 * formatting does not affect plural selection. Russian branches are one/few/many/other.
 */
export const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: DEFAULT_LOCALE,
    fallbackLocale: DEFAULT_LOCALE,
    missingWarn: import.meta.env.DEV,
    fallbackWarn: import.meta.env.DEV,
    pluralRules: {
        'ru-RU': (count) => {
            const category = russianPluralRules.select(count);
            return category === 'one' ? 0 : category === 'few' ? 1 : category === 'many' ? 2 : 3;
        },
    },
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
