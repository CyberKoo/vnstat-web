import { describe, expect, it } from 'vitest';

import { buildTrafficTable } from '@/utils/trafficTable';

interface Row {
    timestamp: number;
    rx: number;
    tx: number;
}

const rows: Row[] = [
    { timestamp: 100, rx: 1000, tx: 2000 },
    { timestamp: 200, rx: 2000, tx: 4000 },
    { timestamp: 300, rx: 4000, tx: 8000 },
];

describe('buildTrafficTable', () => {
    it('takes the last N entries by default (reversed)', () => {
        const table = buildTrafficTable<Row>({
            items: rows,
            limit: 2,
            samplingTime: () => 3600,
            getPeriod: (r) => String(r.timestamp),
        });
        expect(table).toHaveLength(2);
        expect(table[0].period).toBe('200'); // sliced from the end, keeping the original ascending order
        expect(table[1].period).toBe('300');
    });

    it('takes the first N entries when reversed=false', () => {
        const table = buildTrafficTable<Row>({
            items: rows,
            limit: 2,
            reversed: false,
            samplingTime: () => 3600,
            getPeriod: (r) => String(r.timestamp),
        });
        expect(table[0].period).toBe('100');
        expect(table[1].period).toBe('200');
    });

    it('sortByTimestampDesc sorts by time descending', () => {
        const table = buildTrafficTable<Row>({
            items: rows,
            limit: 3,
            sortByTimestampDesc: true,
            samplingTime: () => 3600,
            getPeriod: (r) => String(r.timestamp),
        });
        expect(table.map((r) => r.period)).toEqual(['300', '200', '100']);
    });

    it('formats rx/tx/total/avgSpeed', () => {
        const table = buildTrafficTable<Row>({
            items: [rows[0]],
            limit: 1,
            samplingTime: () => 3600,
            getPeriod: () => 'P1',
        });
        expect(table[0]).toEqual({
            period: 'P1',
            received: '1000.00 B',
            sent: '1.95 KiB',
            total: '2.93 KiB',
            avgSpeed: '6.67 bps',
        });
    });

    it('supports custom getRx/getTx', () => {
        const items = [{ timestamp: 1, in: 500, out: 500 }];
        const table = buildTrafficTable<{ timestamp: number; in: number; out: number }>({
            items,
            limit: 1,
            getRx: (r) => r.in,
            getTx: (r) => r.out,
            samplingTime: () => 1,
            getPeriod: () => 'P',
        });
        expect(table[0].received).toBe('500.00 B');
        expect(table[0].total).toBe('1000.00 B');
    });
});
