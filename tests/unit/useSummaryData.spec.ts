import { describe, expect, it } from 'vitest';
import { ref } from 'vue';

import { useSummaryData } from '@/composables/useSummaryData';
import { formatBytes } from '@/utils/bytes';
import type { TrafficItem, VnstatInterfaceDetail } from '@/types/network';

/** Minimal traffic record; only rx/tx/timestamp matter to useSummaryData */
function rec(rx: number, tx: number, timestamp: number): TrafficItem {
    return { rx, tx, timestamp, id: timestamp, date: { year: 2026, month: 1, day: 1 } };
}

/** Minimal interface detail; only the traffic arrays matter to useSummaryData */
function makeDetail(traffic: Partial<VnstatInterfaceDetail['traffic']> = {}): VnstatInterfaceDetail {
    return {
        alias: 'eth0',
        name: 'eth0',
        created: { date: { year: 2026, month: 1, day: 1 }, timestamp: 1_700_000_000 },
        updated: { date: { year: 2026, month: 1, day: 1 }, timestamp: 1_700_000_000 },
        traffic: {
            day: [],
            fiveminute: [],
            hour: [],
            month: [],
            top: [],
            year: [],
            total: { rx: 0, tx: 0 },
            ...traffic,
        },
    } as unknown as VnstatInterfaceDetail;
}

describe('useSummaryData', () => {
    it('shows "-" (not a fake zero) while the detail has not loaded', () => {
        const source = ref<VnstatInterfaceDetail | null>(null);
        const { todayTotal, fiveMinTotal, monthlyTotal, grandTotal } = useSummaryData(source);
        expect(todayTotal.value).toBe('-');
        expect(fiveMinTotal.value).toBe('-');
        expect(monthlyTotal.value.formatted).toBe('-');
        expect(grandTotal.value.formatted).toBe('-');
    });

    it('sums the last record of each period once loaded', () => {
        const source = ref<VnstatInterfaceDetail | null>(
            makeDetail({
                day: [rec(1, 1, 1), rec(1000, 500, 2)],
                fiveminute: [rec(100, 20, 1)],
                month: [rec(10_000, 5_000, 1)],
                total: { rx: 999, tx: 1 },
            }),
        );
        const { todayTotal, fiveMinTotal, monthlyTotal, grandTotal } = useSummaryData(source);
        // Two day records: only the last one counts
        expect(todayTotal.value).toBe(formatBytes(1500).formatted);
        expect(fiveMinTotal.value).toBe(formatBytes(120).formatted);
        expect(monthlyTotal.value.formatted).toBe(formatBytes(15_000).formatted);
        expect(grandTotal.value.formatted).toBe(formatBytes(1000).formatted);
    });

    it('a loaded-but-empty history is an honest "0 B", distinct from the not-loaded "-"', () => {
        const source = ref<VnstatInterfaceDetail | null>(makeDetail());
        const { todayTotal, fiveMinTotal, monthlyTotal, grandTotal } = useSummaryData(source);
        expect(todayTotal.value).toBe('0 B');
        expect(fiveMinTotal.value).toBe('0 B');
        expect(monthlyTotal.value.formatted).toBe('0 B');
        expect(grandTotal.value.formatted).toBe('0 B');
    });

    it('reacts when the detail arrives', () => {
        const source = ref<VnstatInterfaceDetail | null>(null);
        const { todayTotal } = useSummaryData(source);
        expect(todayTotal.value).toBe('-');
        source.value = makeDetail({ day: [rec(8, 8, 1)] });
        expect(todayTotal.value).toBe(formatBytes(16).formatted);
    });
});
