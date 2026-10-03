<template>
    <div>
        <h2 class="s2-section-label">
            {{ resolvedTitle }}
        </h2>
        <div class="s2-table-scroll s2-table-scroll--sheet">
            <table class="s2-table">
                <caption class="s2-visually-hidden">
                    {{
                        resolvedTitle
                    }}
                </caption>
                <colgroup v-if="!isMobile">
                    <col v-for="col in columns" :key="col.key" :style="{ width: col.width }" />
                </colgroup>
                <thead>
                    <tr>
                        <th v-for="col in columns" :key="col.key" scope="col">{{ col.title }}</th>
                    </tr>
                </thead>
                <tbody>
                    <template v-for="(row, i) in data" :key="i">
                        <tr
                            v-if="dateLabels && dateLabels[i] && (i === 0 || dateLabels[i] !== dateLabels[i - 1])"
                            class="s2-date-split"
                        >
                            <th scope="colgroup" :colspan="columns.length">{{ dateLabels[i] }}</th>
                        </tr>
                        <tr>
                            <th scope="row">{{ row.period }}</th>
                            <td v-for="col in dataColumns" :key="col.key">{{ row[col.key as keyof TrafficTable] }}</td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMobile } from '@/composables/useMobile';
import type { TrafficTable } from '@/utils/trafficTable';

/**
 * Column definition: the key maps to a TrafficTable field, title is the header text, width is optional.
 */
export interface TrafficColumn {
    key: keyof TrafficTable;
    title: string;
    width?: string;
}

const props = withDefaults(
    defineProps<{
        /** Table column definitions */
        columns: TrafficColumn[];
        /** Table data (already formatted TrafficTable[]) */
        data: TrafficTable[];
        /** Date group labels (optional), must correspond one to one with each element of the data array */
        dateLabels?: string[];
        /** Section title */
        title?: string;
    }>(),
    { title: undefined, dateLabels: () => [] },
);

const { t } = useI18n();

/** The callers omit the title and let the table render its own default (kept reactive for locale switches) */
const resolvedTitle = computed(() => props.title ?? t('chart.table.detailTitle'));

/** Body cells only: the first column (period) is rendered separately as the row header */
const dataColumns = computed(() => props.columns.slice(1));

const { isMobile } = useMobile();
</script>

<style scoped>
/* sheet-section already provides the padding, so the table scroll area adds no extra padding */
.s2-table-scroll--sheet {
    padding: 0;
}
</style>
