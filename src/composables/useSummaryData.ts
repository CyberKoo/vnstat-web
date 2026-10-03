import { computed, type Ref } from 'vue';
import type { VnstatInterfaceDetail } from '@/types/network';
import { formatBytes } from '@/utils/bytes';

/**
 * Extract the various traffic statistics summaries from the interface detail data and return the
 * formatted display values.
 *
 * @param interfaceDetailStore - Reactive ref of the single interface detail
 * @returns The computed ref of each statistic, which can be destructured directly
 */
export function useSummaryData(interfaceDetailStore: Ref<VnstatInterfaceDetail | null>) {
    const todayTotal = computed(() => {
        const detail = interfaceDetailStore.value;
        // Not loaded yet: "-" (a real but empty history further down is an honest "0 B")
        if (!detail) return '-';
        const days = detail.traffic?.day;
        if (!days?.length) return '0 B';
        return formatBytes((days[days.length - 1].rx ?? 0) + (days[days.length - 1].tx ?? 0)).formatted;
    });

    const fiveMinTotal = computed(() => {
        const detail = interfaceDetailStore.value;
        if (!detail) return '-';
        const fm = detail.traffic?.fiveminute?.at(-1);
        if (!fm) return '0 B';
        return formatBytes((fm.rx ?? 0) + (fm.tx ?? 0)).formatted;
    });

    const monthlyTotal = computed(() => {
        const detail = interfaceDetailStore.value;
        if (!detail) return { formatted: '-', value: 0, unit: 'B' };
        const m = detail.traffic?.month?.at(-1);
        if (!m) return { formatted: '0 B', value: 0, unit: 'B' };
        return formatBytes((m.rx ?? 0) + (m.tx ?? 0));
    });

    const grandTotal = computed(() => {
        const detail = interfaceDetailStore.value;
        if (!detail) return { formatted: '-', value: 0, unit: 'B' };
        const t = detail.traffic?.total;
        if (!t) return { formatted: '0 B', value: 0, unit: 'B' };
        return formatBytes((t.rx ?? 0) + (t.tx ?? 0));
    });

    return { fiveMinTotal, todayTotal, monthlyTotal, grandTotal };
}
