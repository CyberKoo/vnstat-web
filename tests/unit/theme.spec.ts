import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { useThemeStore } from '@/stores/theme';

const THEME_KEY = 's2-theme';

/** Stub matchMedia the way happy-dom does not let us set directly. */
function stubSystemDark(matches: boolean) {
    Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        writable: true,
        value: () => ({
            matches,
            media: '(prefers-color-scheme: dark)',
            addEventListener: () => {},
            removeEventListener: () => {},
        }),
    });
}

function freshStore(systemDark: boolean, stored: string | null) {
    if (stored === null) localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, stored);
    stubSystemDark(systemDark);
    setActivePinia(createPinia());
    return useThemeStore();
}

describe('theme store persistence', () => {
    beforeEach(() => {
        localStorage.removeItem(THEME_KEY);
    });

    it('follows the system theme when nothing is stored', () => {
        expect(freshStore(false, null).isDark).toBe(false);
        expect(freshStore(true, null).isDark).toBe(true);
    });

    it('restores a stored dark override even on a light system', () => {
        const store = freshStore(false, 'dark');
        expect(store.isDark).toBe(true);
        expect(store.isForced).toBe(true);
    });

    it('restores a stored light override even on a dark system', () => {
        const store = freshStore(true, 'light');
        expect(store.isDark).toBe(false);
        expect(store.isForced).toBe(true);
    });

    it('ignores a garbage stored value and follows the system', () => {
        const store = freshStore(true, 'klingon');
        expect(store.isDark).toBe(true);
        expect(store.isForced).toBe(false);
    });

    it('persists a manual toggle and removes the key when returning to system', () => {
        const store = freshStore(false, null);

        store.toggleDark(); // light system -> force dark
        expect(store.isDark).toBe(true);
        expect(store.isForced).toBe(true);
        expect(localStorage.getItem(THEME_KEY)).toBe('dark');

        store.toggleDark(); // back to following the system
        expect(store.isDark).toBe(false);
        expect(store.isForced).toBe(false);
        expect(localStorage.getItem(THEME_KEY)).toBeNull();
    });

    it('persists a light override when toggling on a dark system', () => {
        const store = freshStore(true, null);
        store.toggleDark();
        expect(store.isDark).toBe(false);
        expect(localStorage.getItem(THEME_KEY)).toBe('light');
    });

    it('keeps the dark class on <html> in sync with the restored override', () => {
        document.documentElement.classList.remove('dark');
        freshStore(false, 'dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);

        freshStore(false, null);
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
});
