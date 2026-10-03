import { computed, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { minMax } from '@/utils/minMax';
import { useDayjs } from '@/composables/useDayjs';
import { useSpeedFormat } from '@/composables/useSpeedFormat';
import type { TrafficItem } from '@/types/network';

/** Interval of a fiveminute record (seconds), rate = bytes in the interval ÷ interval */
const FIVEMINUTE_SEC = 300;

/**
 * Peak / trough statistics for the sidebar of the live page (following the global rate unit).
 *
 * Finds the records with the largest / smallest rx+tx total in the given fiveminute slice and formats
 * the rate values according to the global speedUnit preference (Mbps / MiB/s).
 *
 * @param itemsRef Reactive slice of fiveminute records
 * @returns The computed refs, which can be destructured directly
 */
export function useLiveExtremes(itemsRef: Ref<TrafficItem[]>) {
    const dayjs = useDayjs();
    const { formatSpeed } = useSpeedFormat();
    const { t } = useI18n();

    const extremes = computed(() => minMax(itemsRef.value, (a, b) => a.tx + a.rx - (b.tx + b.rx)));

    /** Peak rate (global unit) */
    const peakValue = computed(() => {
        const m = extremes.value.max;
        return m ? formatSpeed(((m.tx ?? 0) + (m.rx ?? 0)) / FIVEMINUTE_SEC, 1) : '-';
    });

    /** Peak moment (locale time) */
    const peakTimeStr = computed(() => {
        const ts = extremes.value.max?.timestamp;
        return ts ? dayjs.unix(ts).format(t('common.format.time')) : t('live.sidebar.today');
    });

    /** Trough rate (global unit) */
    const troughValue = computed(() => {
        const m = extremes.value.min;
        return m ? formatSpeed(((m.tx ?? 0) + (m.rx ?? 0)) / FIVEMINUTE_SEC, 1) : '-';
    });

    /** Trough moment (locale time) */
    const troughTimeStr = computed(() => {
        const ts = extremes.value.min?.timestamp;
        return ts ? dayjs.unix(ts).format(t('common.format.time')) : '-';
    });

    /** Time range of the statistics window (locale time-locale time) */
    const minMaxWindow = computed(() => {
        const list = itemsRef.value;
        if (list.length < 2) return '';
        const s = dayjs.unix(list[0]!.timestamp).format(t('common.format.time'));
        const e = dayjs.unix(list[list.length - 1]!.timestamp).format(t('common.format.time'));
        return `${s}-${e}`;
    });

    return { peakValue, peakTimeStr, troughValue, troughTimeStr, minMaxWindow };
}
