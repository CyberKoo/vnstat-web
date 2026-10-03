import { defineStore } from 'pinia';
import { ref, watchEffect } from 'vue';

const THEME_KEY = 's2-theme';

/** Persisted manual override; null (or an absent key) means follow the system theme. */
type StoredTheme = 'dark' | 'light' | null;

function readStoredTheme(): StoredTheme {
    try {
        const raw = globalThis.localStorage?.getItem(THEME_KEY);
        return raw === 'dark' || raw === 'light' ? raw : null;
    } catch {
        return null;
    }
}

function persistTheme(value: StoredTheme) {
    try {
        if (value == null) globalThis.localStorage?.removeItem(THEME_KEY);
        else globalThis.localStorage?.setItem(THEME_KEY, value);
    } catch {
        // Keep the in-memory state only when localStorage is unavailable
    }
}

/**
 * Theme Pinia store.
 *
 * Follows the system colour scheme until the user switches manually, and keeps the `dark` class on
 * the `<html>` element in sync so the CSS custom properties in `theme-s2.css` switch over. The
 * blocking script in `index.html` applies the same class before first paint, so there is no flash.
 *
 * A manual override is persisted to localStorage (`s2-theme`: 'dark' | 'light'); returning to
 * "follow system" removes the key. The blocking script in `index.html` reads the same key before
 * first paint, so a restored override does not flash either.
 *
 * @example
 * const themeStore = useThemeStore();
 * themeStore.toggleDark(); // Switch the theme
 * console.log(themeStore.isDark.value); // Current theme state
 */
export const useThemeStore = defineStore('theme', () => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const stored = readStoredTheme();
    const isForced = ref(stored != null);
    const isDark = ref(stored === 'dark');

    /** Restores following the system theme (called after a manual switch) */
    function syncToSystem() {
        isForced.value = false;
        isDark.value = media.matches;
    }

    // React to the system unless the user has taken over
    watchEffect(() => {
        if (!isForced.value) syncToSystem();

        // Sync the dark CSS class to <html>, in step with the blocking script in index.html
        if (isDark.value) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // The single theme-color meta follows the app's actual theme (values mirror --s2-bg);
        // the same assignment runs pre-paint in the blocking script in index.html
        document
            .querySelector('meta[name="theme-color"]')
            ?.setAttribute('content', isDark.value ? '#0b0e15' : '#eef1f7');
    });

    // Follow the OS only while the user has not made an explicit choice. The bootstrap script in
    // index.html has its own system listener that always applies the OS theme, so it is told to
    // stand down once this store exists — otherwise an OS change would stomp a manual override.
    (window as unknown as Record<string, boolean>).__vnstatThemeManaged = true;
    media.addEventListener('change', () => {
        if (!isForced.value) syncToSystem();
    });

    // Manually toggle dark mode: the first click forces the opposite theme (persisted), the
    // second click returns to following the system (persisted key removed).
    function toggleDark() {
        if (!isForced.value) {
            isForced.value = true;
            isDark.value = !isDark.value;
            persistTheme(isDark.value ? 'dark' : 'light');
        } else {
            syncToSystem();
            persistTheme(null);
        }
    }

    return {
        isDark,
        isForced,
        toggleDark,
    };
});
