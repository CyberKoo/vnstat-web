import { computed, type ComputedRef } from 'vue';
import { useI18n } from 'vue-i18n';
import type { UnitType } from 'dayjs';

import type { PeriodDataContext } from '@/composables/usePeriodData';
import { useMobile } from '@/composables/useMobile';
import { useSpeedFormat } from '@/composables/useSpeedFormat';
import { MS_IN_SECOND } from '@/constants';
import { computeInterval, formatTimestamp } from '@/utils/datetime';
import { buildTrafficTable, type TrafficTable } from '@/utils/trafficTable';
import type { TrafficItem } from '@/types/network';

/** The traffic table of a period page */
export interface PeriodTable {
    /** Formatted date labels above the table, undefined when the period has no date column */
    tableDateLabels: ComputedRef<string[] | undefined>;
    /** Column definitions (mobile collapses to three columns) */
    tableColumns: ComputedRef<{ key: keyof TrafficTable; title: string; width?: string }[]>;
    /** Table rows */
    tableData: ComputedRef<TrafficTable[]>;
}

/**
 * The traffic table of a period page: the date label strip, the responsive column set and the rows.
 *
 * Row building is delegated to `buildTrafficTable`; what lives here is the page-specific part — the
 * period wording of the first column and the average-rate unit, which follows the global unit
 * preference rather than being fixed.
 *
 * @param data Shared data context from {@link usePeriodData}
 * @returns Date labels, columns and rows
 */
export function usePeriodTable(data: PeriodDataContext): PeriodTable {
    const { config, viewItems, tableLimit } = data;
    const { t } = useI18n();
    const { isMobile } = useMobile();
    const { formatSpeed } = useSpeedFormat();

    const tableDateLabels = computed<string[] | undefined>(() => {
        const key = config.tableDateLabelFormatKey;
        // Yearly has no date labels
        if (!key) return undefined;
        const items: TrafficItem[] = viewItems.value;
        const sliced = items.slice(-tableLimit.value);
        return [...sliced]
            .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
            .map((item) => formatTimestamp(item.timestamp, t(key)));
    });

    const tableColumns = computed<{ key: keyof TrafficTable; title: string; width?: string }[]>(() => {
        const periodTitle =
            config.dataField === 'hour'
                ? t('period.table.columns.periodHour')
                : config.dataField === 'day'
                  ? t('period.table.columns.periodDay')
                  : t(`periods.${config.dataField}.label`);
        if (isMobile.value) {
            return [
                { key: 'period', title: periodTitle, width: '30%' },
                { key: 'total', title: t('period.table.columns.total'), width: '40%' },
                { key: 'avgSpeed', title: t('period.table.columns.avgSpeed'), width: '30%' },
            ];
        }
        return [
            { key: 'period', title: t('period.table.columns.period'), width: '16%' },
            { key: 'received', title: t('period.table.columns.received'), width: '22%' },
            { key: 'sent', title: t('period.table.columns.sent'), width: '22%' },
            { key: 'total', title: t('period.table.columns.total'), width: '22%' },
            { key: 'avgSpeed', title: t('period.table.columns.avgSpeed'), width: '18%' },
        ];
    });

    const tableData = computed(() => {
        const items: TrafficItem[] = viewItems.value;
        return buildTrafficTable<TrafficItem>({
            items,
            limit: tableLimit.value,
            samplingTime: (m) => computeInterval(m.timestamp * MS_IN_SECOND, config.intervalUnit as UnitType),
            sortByTimestampDesc: true,
            getPeriod: (m) => formatTimestamp(m.timestamp, t(config.tablePeriodFormatKey)),
            // Average rate follows the global unit preference in the top bar (bits / bytes)
            formatAvgSpeed: (bytesPerSec) => formatSpeed(bytesPerSec, 2),
        });
    });

    return { tableDateLabels, tableColumns, tableData };
}
