import { nextTick, watch, type Ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useLoadingBar } from '@/composables/useLoadingBar';

/** The guards are installed only once; these references are overwritten when the layout remounts, which avoids stacking beforeEach */
let installed = false;
let closeDrawer: (() => void) | null = null;
let bar: { start: () => void; finish: () => void } | null = null;
let pageHeading: Ref<HTMLElement | null> | null = null;

/**
 * Top bar loading, closing the mobile drawer, updating the document title, scrolling back to top
 * and moving focus to the new page's heading on route changes.
 *
 * Must be called in the layout setup. The guards live here rather than in router/index.ts because
 * the loading bar is resolved from a module-scope service that the layout primes on mount.
 */
export function useRouteChrome(drawerVisible: Ref<boolean>, heading: Ref<HTMLElement | null>) {
    const loadingBar = useLoadingBar();
    const router = useRouter();
    const { t, locale } = useI18n();

    closeDrawer = () => {
        drawerVisible.value = false;
    };
    bar = loadingBar;
    pageHeading = heading;

    /** `<title>` + localized route name; index.html's static title is the pre-app fallback */
    function applyTitle() {
        const titleKey = router.currentRoute.value.meta.titleKey as string | undefined;
        document.title = titleKey ? `${t(titleKey)} · vnStat Web` : 'vnStat Web';
    }

    // Registered per layout mount (the watcher dies with the component): a language switch
    // re-renders the title of the page already on screen, which no navigation would fire for
    watch(locale, applyTitle);
    // The layout mounts only after the initial navigation has finalized, so the afterEach below
    // never sees it — cover the first load (hard refresh / bookmark / direct URL) directly
    applyTitle();

    if (installed) return;
    installed = true;

    router.beforeEach(() => {
        bar?.start();
    });

    router.afterEach(() => {
        bar?.finish();
        closeDrawer?.();
        // Every route declares meta.titleKey; without this the tab/history keeps the index.html
        // <title> forever (the first load is covered by the setup-time call above)
        applyTitle();
        void nextTick(() => {
            window.scrollTo(0, 0);
            const area = document.querySelector('.s2-content-scroll-area');
            if (area) area.scrollTop = 0;
            // The keyed page surface has been swapped, so a focused node inside the old page is
            // gone and the browser would silently drop focus to <body>; hand it to the fresh
            // page's heading instead. preventScroll leaves the scroll reset above as the single
            // authority on scroll position.
            pageHeading?.value?.focus({ preventScroll: true });
        });
    });
}
