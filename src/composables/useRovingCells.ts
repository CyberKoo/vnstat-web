import { ref, watchEffect, type Ref } from 'vue';

/**
 * Roving tabindex for cell grids (heatmaps, mini bars): the whole grid is a single Tab stop and
 * arrow keys (plus Home/End) move between cells, so a keyboard user never has to Tab through
 * hundreds of cells to get past a chart.
 *
 * Steps are DOM-order offsets per arrow direction, so row-major and column-major grids both work;
 * a `vertical` step of 0 disables Up/Down (single-row grids), and a getter form is accepted for
 * grids whose visual row pitch changes with layout (responsive card grids).
 *
 * Arrows stop at the grid's edges; Home/End make the long jumps.
 *
 * @param grid - the container element holding the cells
 * @param cellSelector - matches exactly the participating cells (e.g. only the clickable ones)
 * @param count - reactive getter for the number of participating cells
 */
export function useRovingCells(
    grid: Ref<HTMLElement | undefined>,
    cellSelector: string,
    count: () => number,
    steps: { horizontal: number; vertical: number | (() => number) },
) {
    /** DOM-order index (among `cellSelector` matches) currently holding the grid's Tab stop */
    const active = ref(0);

    // Data refreshes can shrink the cell set (a retention window sliding); keep the stop valid
    watchEffect(() => {
        if (active.value >= count()) active.value = 0;
    });

    /** tabindex binding for the cell at DOM-order index `i` */
    function tabIndex(i: number): 0 | -1 {
        return i === active.value ? 0 : -1;
    }

    /** Move the Tab stop onto the cell the user actually reached (click, focus) */
    function syncActive(i: number) {
        active.value = i;
    }

    function focusCell(i: number) {
        grid.value?.querySelectorAll<HTMLElement>(cellSelector).item(i)?.focus();
    }

    /** Keydown handler to call from every participating cell; `i` is the cell's DOM-order index */
    function onKeydown(e: KeyboardEvent, i: number) {
        const n = count();
        if (!n) return;
        const vertical = typeof steps.vertical === 'function' ? steps.vertical() : steps.vertical;
        let next: number;
        if (e.key === 'ArrowRight') next = i + steps.horizontal;
        else if (e.key === 'ArrowLeft') next = i - steps.horizontal;
        else if (e.key === 'ArrowDown' && vertical) next = i + vertical;
        else if (e.key === 'ArrowUp' && vertical) next = i - vertical;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = n - 1;
        else return;
        e.preventDefault();
        // Arrows stay at the grid's edges: clamping here would jump focus to a cell that is not
        // the visual neighbor (e.g. ArrowUp on a matrix's first row landing mid-row)
        if (next < 0 || next > n - 1 || next === i) return;
        active.value = next;
        // Programmatic focus lands while the target still wears tabindex="-1"; the roving flip
        // patches the attributes afterwards without disturbing the focused element
        focusCell(next);
    }

    return { active, tabIndex, syncActive, onKeydown };
}
