import { describe, expect, it } from 'vitest';

import { hexToRgba } from '@/utils/color';

describe('hexToRgba', () => {
    it('parses #rrggbb', () => {
        expect(hexToRgba('#4c6fff', 0.35)).toBe('rgba(76, 111, 255, 0.35)');
    });

    it('parses three-digit shorthand and ignores case and whitespace', () => {
        expect(hexToRgba('  #abc ', 1)).toBe('rgba(170, 187, 204, 1)');
    });

    it('keeps the original string and the alpha value when it cannot be parsed', () => {
        expect(hexToRgba('var(--brand)', 0.2)).toBe('rgba(var(--brand), 0.2)');
    });
});
