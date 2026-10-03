import { describe, expect, it } from 'vitest';
import { ref } from 'vue';

import { useRovingCells } from '@/composables/useRovingCells';

/** Build a grid of `n` cells in document order, plus the roving instance bound to it */
function setup(n: number, steps: { horizontal: number; vertical: number | (() => number) }) {
    const gridEl = document.createElement('div');
    for (let i = 0; i < n; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.tabIndex = -1;
        gridEl.appendChild(cell);
    }
    document.body.appendChild(gridEl);
    const grid = ref<HTMLElement | undefined>(gridEl);
    const roving = useRovingCells(grid, '.cell', () => n, steps);
    const cells = Array.from(gridEl.querySelectorAll<HTMLElement>('.cell'));
    return { roving, cells, cleanup: () => gridEl.remove() };
}

function key(k: string): KeyboardEvent {
    return new KeyboardEvent('keydown', { key: k, cancelable: true });
}

describe('useRovingCells', () => {
    it('moves by the configured DOM-order steps', () => {
        // Row-major matrix geometry (WeekHourHeatmap): 7 rows × 24 columns
        const { roving, cells, cleanup } = setup(168, { horizontal: 1, vertical: 24 });
        cells[26].focus();
        roving.syncActive(26);

        roving.onKeydown(key('ArrowRight'), 26);
        expect(roving.active.value).toBe(27);
        expect(document.activeElement).toBe(cells[27]);

        roving.onKeydown(key('ArrowDown'), 27);
        expect(roving.active.value).toBe(51);
        expect(document.activeElement).toBe(cells[51]);

        roving.onKeydown(key('ArrowUp'), 51);
        expect(roving.active.value).toBe(27);

        roving.onKeydown(key('ArrowLeft'), 27);
        expect(roving.active.value).toBe(26);
        cleanup();
    });

    it('stays at the grid edges instead of clamping onto a non-adjacent cell', () => {
        // First row of the matrix: ArrowUp must not jump mid-row (the old clamp landed on index 0)
        const { roving, cells, cleanup } = setup(168, { horizontal: 1, vertical: 24 });
        cells[10].focus();
        roving.syncActive(10);

        roving.onKeydown(key('ArrowUp'), 10);
        expect(roving.active.value).toBe(10);
        expect(document.activeElement).toBe(cells[10]);

        // Last row: ArrowDown past the end stays put as well
        cells[160].focus();
        roving.syncActive(160);
        roving.onKeydown(key('ArrowDown'), 160);
        expect(roving.active.value).toBe(160);
        expect(document.activeElement).toBe(cells[160]);
        cleanup();
    });

    it('stays at the first column of a column-major grid (calendar geometry)', () => {
        // Column-major week columns: ArrowLeft from the first column must not jump inside it
        const { roving, cells, cleanup } = setup(364, { horizontal: 7, vertical: 1 });
        cells[3].focus();
        roving.syncActive(3);

        roving.onKeydown(key('ArrowLeft'), 3);
        expect(roving.active.value).toBe(3);
        expect(document.activeElement).toBe(cells[3]);
        cleanup();
    });

    it('Home/End still make the long jumps', () => {
        const { roving, cells, cleanup } = setup(24, { horizontal: 1, vertical: 0 });
        cells[7].focus();
        roving.syncActive(7);

        roving.onKeydown(key('Home'), 7);
        expect(roving.active.value).toBe(0);
        expect(document.activeElement).toBe(cells[0]);

        roving.onKeydown(key('End'), 0);
        expect(roving.active.value).toBe(23);
        expect(document.activeElement).toBe(cells[23]);
        cleanup();
    });

    it('evaluates a getter vertical step per keypress (responsive card grids)', () => {
        // YearCards geometry: DOM order is card-major, one visual row = columns × 12 months
        let columns = 2;
        const { roving, cells, cleanup } = setup(48, { horizontal: 1, vertical: () => columns * 12 });
        cells[5].focus();
        roving.syncActive(5);

        roving.onKeydown(key('ArrowDown'), 5);
        expect(roving.active.value).toBe(29);

        columns = 4;
        roving.onKeydown(key('ArrowUp'), 29);
        expect(roving.active.value).toBe(29); // 29 - 48 < 0 → stays at the edge
        cleanup();
    });

    it('prevents the default scroll on handled keys and ignores everything else', () => {
        const { roving, cleanup } = setup(10, { horizontal: 1, vertical: 0 });
        const arrow = key('ArrowRight');
        roving.onKeydown(arrow, 3);
        expect(arrow.defaultPrevented).toBe(true);

        const letter = key('a');
        roving.onKeydown(letter, 3);
        expect(letter.defaultPrevented).toBe(false);
        expect(roving.active.value).toBe(4); // untouched (the arrow above moved 3 → 4)
        cleanup();
    });
});
