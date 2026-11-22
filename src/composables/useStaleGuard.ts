import { onScopeDispose } from 'vue';

/**
 * Guard for async results that may arrive after they stopped being relevant.
 *
 * Two things can make a late result unwanted: a newer round of the same work has started (the
 * generation counter), and the owning scope is gone (the disposal flag). Both are folded into the
 * single `isCurrent` predicate this returns, so a caller writes one condition instead of two.
 *
 * @returns begin starts a new round and hands back the guard for that round
 *
 * @example
 * ```ts
 * const guard = useStaleGuard();
 *
 * async function load() {
 *     const isCurrent = guard.begin();
 *     const data = await fetchSomething();
 *     if (!isCurrent()) return;
 *     apply(data);
 * }
 * ```
 */
export function useStaleGuard() {
    /** Generation of the current round: incremented by every begin() */
    let generation = 0;
    /** Whether the owning scope is gone: all late results are ignored after that */
    let disposed = false;

    onScopeDispose(() => {
        disposed = true;
    });

    /**
     * Starts a new round and returns the guard for it.
     *
     * @returns A predicate that reports whether the results of this round are still current
     */
    function begin(): () => boolean {
        const gen = ++generation;
        return () => !disposed && gen === generation;
    }

    return { begin };
}
