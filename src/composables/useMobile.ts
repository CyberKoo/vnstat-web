import { ref } from 'vue';
import { BREAKPOINTS } from '@/constants/breakpoints';

/**
 * Shared viewport state.
 *
 * Every consumer reads these module-level refs, so the whole app pays for exactly one
 * matchMedia listener (mobile flag, in sync with the `--mobile` custom media) and one
 * resize listener (raw width for the wide-screen display limits), no matter how many
 * components subscribe.
 */
const mobileQuery = window.matchMedia(`(max-width: ${BREAKPOINTS.MOBILE_MAX}px)`);

const isMobile = ref(mobileQuery.matches);
const viewportWidth = ref(window.innerWidth);

mobileQuery.addEventListener('change', (event) => {
    isMobile.value = event.matches;
});

window.addEventListener('resize', () => {
    viewportWidth.value = window.innerWidth;
});

/**
 * Reactively provide the shared isMobile state (viewport narrower than the desktop breakpoint).
 * Can be used independently in any component; the underlying listener is registered once per app.
 */
export function useMobile() {
    return { isMobile };
}

/** Reactively provide the shared viewport width in px (drives the wide-screen display limits) */
export function useViewportWidth() {
    return { viewportWidth };
}
