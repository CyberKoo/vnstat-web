import { nextTick } from 'vue';

/**
 * Runs `apply` (the theme flip) inside a View Transition with an "iris" effect anchored at the
 * click point, direction-aware:
 *
 * - to dark (expand): the new dark snapshot sits on top and its circle grows from 0 to cover the
 *   viewport;
 * - to light (retract): the new light snapshot sits underneath fully visible while the old dark
 *   snapshot on top shrinks back into the click point — the reverse playback of the expand.
 *
 * Falls back to an instant switch when the API is missing (older browsers, jsdom), the user
 * prefers reduced motion, or the UA matches the WebKit/iOS heuristic below. This deliberately
 * broad fallback avoids observed Safari rendering issues: fixed layers like the glass header
 * dropping out of the root snapshot (bugs.webkit.org 279172) and clip-path animation flickering
 * to black. It does not detect whether the current browser is actually affected.
 *
 * While the transition runs, `<html>` carries the `s2-theme-iris` class (see theme-s2.css): the
 * new snapshot is captured the instant the `dark` class flips, so theme-driven property
 * transitions (background/color fading over `--s2-transition`) must be frozen, or old-theme
 * pixels would be captured into the revealed circle.
 */
export function revealThemeTransition(event: MouseEvent, apply: () => void) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || isWebKit() || typeof document.startViewTransition !== 'function') {
        apply();
        return;
    }

    // Keyboard-triggered clicks carry no pointer coordinates; reveal from the button's center
    const rect = (event.currentTarget as HTMLElement | null)?.getBoundingClientRect();
    const x = event.clientX || (rect ? rect.left + rect.width / 2 : window.innerWidth / 2);
    const y = event.clientY || (rect ? rect.top + rect.height / 2 : window.innerHeight / 2);

    // Far-corner distance: the radius at which the circle covers the whole viewport
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    const root = document.documentElement;
    const toDark = !root.classList.contains('dark');
    // Pre-clip coordinates for the CSS fallback: ::view-transition-new(root) starts fully clipped
    // away, so a browser that paints the new snapshot before the WAAPI animation's first frame
    // shows the old theme instead of flashing the new one full-screen.
    root.style.setProperty('--iris-x', `${x}px`);
    root.style.setProperty('--iris-y', `${y}px`);

    let transition: ViewTransition;
    try {
        transition = document.startViewTransition(async () => {
            root.classList.add('s2-theme-iris');
            // Retract direction: flips the snapshot stacking in CSS (old on top, new unclipped)
            if (!toDark) root.classList.add('s2-theme-iris-retract');
            apply();
            // The theme store flips the `dark` class from a pre-flush watcher; wait for Vue to
            // flush so the new snapshot already paints the new theme
            await nextTick();
        });
    } catch {
        root.style.removeProperty('--iris-x');
        root.style.removeProperty('--iris-y');
        apply();
        return;
    }

    void transition.ready
        .then(() => {
            const clipFrom = `circle(${toDark ? '0px' : `${radius}px`} at ${x}px ${y}px)`;
            const clipTo = `circle(${toDark ? `${radius}px` : '0px'} at ${x}px ${y}px)`;
            root.animate(
                { clipPath: [clipFrom, clipTo] },
                {
                    duration: 500,
                    easing: 'ease-in-out',
                    // both: before the first frame the clip holds its start value (the pre-start
                    // gap), after the last frame it holds the end value until the pseudo tree is
                    // removed, so neither direction can flash the unclipped snapshot
                    fill: 'both',
                    // Expand clips the incoming snapshot in; retract clips the outgoing one away
                    pseudoElement: toDark ? '::view-transition-new(root)' : '::view-transition-old(root)',
                },
            );
        })
        .catch(() => {
            // Skipped (e.g. tab hidden): the theme still switched, just without the reveal
        });

    void transition.finished
        .catch(() => {})
        .finally(() => {
            root.classList.remove('s2-theme-iris', 's2-theme-iris-retract');
            root.style.removeProperty('--iris-x');
            root.style.removeProperty('--iris-y');
        });
}

/**
 * UA-based WebKit/iOS heuristic, not an engine capability test. All matching iOS device UAs
 * are excluded regardless of engine. Macintosh UAs with multiple touch points are also
 * excluded to cover iPadOS desktop mode. Otherwise, an AppleWebKit token without the listed
 * exclusion tokens is treated as WebKit; unusual or spoofed UAs may be misclassified.
 */
function isWebKit(): boolean {
    const ua = navigator.userAgent;
    if (/iP(hone|ad|od)/.test(ua)) return true;
    if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return true;
    return /AppleWebKit/.test(ua) && !/(Chrome|Chromium|Edg|OPR|Android|jsdom)/.test(ua);
}
