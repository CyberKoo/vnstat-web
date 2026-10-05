<template>
    <header class="s2-header-bar">
        <button
            v-if="isMobile"
            type="button"
            class="s2-mobile-menu-btn"
            :aria-label="t('layout.mainNav')"
            aria-haspopup="dialog"
            @click="$emit('openDrawer')"
        >
            <icon-mdi-menu :size="22" />
        </button>

        <AppBreadcrumb />

        <div class="s2-header-actions">
            <button
                class="s2-header-btn s2-unit-toggle"
                :title="settingsStore.speedUnit === 'bits' ? t('header.unitBitsTitle') : t('header.unitBytesTitle')"
                :aria-label="
                    settingsStore.speedUnit === 'bits' ? t('header.unitBitsTitle') : t('header.unitBytesTitle')
                "
                :aria-pressed="settingsStore.speedUnit === 'bits'"
                @click="settingsStore.toggleSpeedUnit()"
            >
                <span class="s2-unit-label">{{ settingsStore.speedUnit === 'bits' ? 'Mbps' : 'MiB/s' }}</span>
            </button>

            <DropdownMenu :options="localeOptions" :active-key="localeStore.locale" @select="onSelectLocale">
                <template #trigger="{ open }">
                    <button
                        class="s2-header-btn"
                        :title="t('header.switchLanguage')"
                        :aria-label="t('header.switchLanguage')"
                        aria-haspopup="menu"
                        :aria-expanded="open"
                    >
                        <icon-mdi-translate :size="18" />
                    </button>
                </template>
            </DropdownMenu>

            <button
                class="s2-header-btn"
                :class="{ 's2-spin': refreshing }"
                :title="refreshing ? t('header.refreshing') : t('header.refresh')"
                :aria-label="refreshing ? t('header.refreshing') : t('header.refresh')"
                :disabled="refreshing"
                @click="$emit('refresh')"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
            </button>

            <button
                class="s2-header-btn"
                :title="isDark ? t('header.toLight') : t('header.toDark')"
                :aria-label="isDark ? t('header.toLight') : t('header.toDark')"
                @click="$emit('toggleDark', $event)"
            >
                <svg
                    v-if="isDark"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
                <svg
                    v-else
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
            </button>
        </div>
    </header>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { useSettingsStore } from '@/stores/settings';
import { useLocaleStore } from '@/stores/locale';
import { SUPPORTED_LOCALES, type AppLocale } from '@/config/locales';
import DropdownMenu from '@/components/ui/DropdownMenu.vue';

const { t } = useI18n();

const settingsStore = useSettingsStore();
const localeStore = useLocaleStore();

const localeOptions = computed(() =>
    SUPPORTED_LOCALES.map((locale) => ({ label: t(`localeNames.${locale}`), key: locale })),
);

function onSelectLocale(key: string) {
    localeStore.setLocale(key as AppLocale);
}

defineProps<{
    isMobile: boolean;
    isDark: boolean;
    refreshing: boolean;
}>();

defineEmits<{
    refresh: [];
    toggleDark: [event: MouseEvent];
    openDrawer: [];
}>();
</script>

<style scoped>
/* Height is declared once, on .s2-app-header in BaseLayout (60px + safe-area-inset-top).
   Declaring it here too would make the result depend on bundle order: both selectors have
   the same specificity and land on the same element. */
.s2-header-bar {
    display: flex;
    align-items: center;
    padding: 0 24px;
    padding-top: env(safe-area-inset-top);
    gap: var(--std-gap);
    box-sizing: border-box;
    border-bottom: 1px solid var(--s2-glass-border, rgba(255, 255, 255, 0.7));
    background: var(--s2-glass-bg-strong, rgba(255, 255, 255, 0.62));
    backdrop-filter: blur(var(--s2-glass-blur, 18px)) saturate(var(--s2-glass-saturate, 180%));
    -webkit-backdrop-filter: blur(var(--s2-glass-blur, 18px)) saturate(var(--s2-glass-saturate, 180%));
    transition:
        background var(--s2-transition, 0.3s ease),
        border-color var(--s2-transition, 0.3s ease),
        left var(--s2-transition, 0.3s ease),
        filter 0.2s ease-out;
    flex-shrink: 0;
}

/* Mobile menu button: icon-only, tinted surface. 12px side padding over a 22px glyph keeps the
   box at 46x34, the size this control has always occupied in the bar. */
.s2-mobile-menu-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    height: 34px;
    padding: 0 12px;
    border: none;
    border-radius: var(--s2-radius-sm, 10px);
    background: var(--s2-btn-surface, rgba(28, 35, 51, 0.05));
    color: var(--s2-nav-text, #333639);
    cursor: pointer;
    transition:
        color var(--s2-transition, 0.3s cubic-bezier(0.4, 0, 0.2, 1)),
        background-color var(--s2-transition, 0.3s cubic-bezier(0.4, 0, 0.2, 1));
}

.s2-mobile-menu-btn:hover {
    background: var(--s2-btn-surface-hover, rgba(28, 35, 51, 0.09));
}

@media (--mobile) {
    .s2-header-bar {
        padding: 0 12px;
        /* The shorthand above would reset padding-top to 0; keep the safe-area inset so the
           fixed-height bar (60px + inset) is left with exactly 60px of safe content box. */
        padding-top: env(safe-area-inset-top);
        gap: 6px;
    }
}

.s2-header-actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    flex-shrink: 0;
    gap: var(--std-gap);
}

/* S2 header button */
.s2-header-btn {
    width: 36px;
    height: 36px;
    border-radius: var(--s2-radius-sm, 10px);
    border: 1px solid transparent;
    background: transparent;
    color: var(--s2-text-muted, #646c82);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
        color var(--s2-transition, 0.3s cubic-bezier(0.4, 0, 0.2, 1)),
        background-color var(--s2-transition, 0.3s cubic-bezier(0.4, 0, 0.2, 1)),
        border-color var(--s2-transition, 0.3s cubic-bezier(0.4, 0, 0.2, 1));
}

/* Unit toggle button: takes the form of a text label */
.s2-unit-toggle {
    width: auto;
    padding: 0 10px;
}

.s2-unit-label {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.02em;
}

@media (--mobile) {
    .s2-unit-toggle {
        display: none;
    }
}

.s2-header-btn:hover:not(:disabled) {
    border-color: var(--s2-border, #d8dce8);
    background: var(--s2-hover-bg, rgba(28, 35, 51, 0.04));
    color: var(--s2-text, #1c2333);
}

/* disabled opacity/cursor come from the shared control-state rules in theme-s2.css */

/* ── Refresh spin ── */
.s2-header-btn.s2-spin svg {
    animation: s2-btn-spin 0.6s linear infinite;
}

@keyframes s2-btn-spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
