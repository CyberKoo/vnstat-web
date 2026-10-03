import { describe, expect, it } from 'vitest';

import { bytesToRate, formatByteRate, formatBytes } from '@/utils/bytes';

describe('formatBytes', () => {
    it('handles undefined and values below 1, returning 0 B', () => {
        expect(formatBytes(undefined).formatted).toBe('0 B');
        expect(formatBytes(0).formatted).toBe('0 B');
        expect(formatBytes(0.5).formatted).toBe('0 B');
        expect(formatBytes(undefined).unit).toBe('B');
        expect(formatBytes(undefined).raw).toBe(0);
    });

    it('picks the unit using base 1024', () => {
        expect(formatBytes(1).formatted).toBe('1.00 B');
        expect(formatBytes(1023).formatted).toBe('1023.00 B');
        expect(formatBytes(1024).formatted).toBe('1.00 KiB');
        expect(formatBytes(1024 ** 2).formatted).toBe('1.00 MiB');
        expect(formatBytes(1024 ** 3).formatted).toBe('1.00 GiB');
        expect(formatBytes(1024 ** 4).formatted).toBe('1.00 TiB');
    });

    it('returns the full result object', () => {
        const r = formatBytes(2048);
        expect(r.raw).toBe(2048);
        expect(r.value).toBe('2.00');
        expect(r.unit).toBe('KiB');
        expect(r.exponent).toBe(1);
    });

    it('supports a custom number of decimal places', () => {
        expect(formatBytes(1500, 0).formatted).toBe('1 KiB');
        expect(formatBytes(1500, 3).formatted).toBe('1.465 KiB');
    });

    it('caps at EiB when the value exceeds the unit table', () => {
        expect(formatBytes(1024 ** 7).unit).toBe('EiB');
        expect(formatBytes(1024 ** 10).formatted).toMatch(/EiB$/);
    });
});

describe('bytesToRate', () => {
    it('handles undefined and 0, returning 0 bps', () => {
        expect(bytesToRate(undefined).formatted).toBe('0 bps');
        expect(bytesToRate(0).formatted).toBe('0 bps');
        expect(bytesToRate(0).raw).toBe(0);
    });

    it('picks the rate unit using base 1000 (bits)', () => {
        // 1024 bytes / 1s = 8192 bit/s = 8.19 Kbps
        expect(bytesToRate(1024, 1).formatted).toBe('8.19 Kbps');
        // 125000 bytes / 1s = 1,000,000 bit/s = 1.00 Mbps
        expect(bytesToRate(125000, 1).formatted).toBe('1.00 Mbps');
    });

    it('takes interval into account when converting the rate', () => {
        // 2000 bytes / 2s = 8000 bit/s = 8.00 Kbps
        expect(bytesToRate(2000, 2).formatted).toBe('8.00 Kbps');
    });

    it('throws when interval is invalid', () => {
        expect(() => bytesToRate(100, 0)).toThrow('interval must be greater than 0');
        expect(() => bytesToRate(100, -1)).toThrow();
    });

    it('raw returns the original byte count', () => {
        expect(bytesToRate(2048, 1).raw).toBe(2048);
    });
});

describe('formatByteRate', () => {
    it('formats with IEC units (B/s, KiB/s, MiB/s, GiB/s)', () => {
        expect(formatByteRate(0)).toBe('0 B/s');
        expect(formatByteRate(500)).toBe('500 B/s');
        expect(formatByteRate(1024)).toBe('1 KiB/s');
        expect(formatByteRate(1024 ** 2)).toBe('1 MiB/s');
        expect(formatByteRate(1024 ** 3)).toBe('1 GiB/s');
    });

    it('supports decimal places', () => {
        expect(formatByteRate(1536, 1)).toBe('1.5 KiB/s');
    });
});
