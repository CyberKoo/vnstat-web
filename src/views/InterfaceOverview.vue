<template>
    <!-- Unified glass sheet -->
    <div class="s2-sheet">
        <!-- Overview metrics -->
        <div class="s2-sheet-section">
            <div class="s2-metric-band">
                <div class="s2-metric">
                    <div class="s2-stat-value s2-stat-value--brand">{{ stats.totalInterfaces }}</div>
                    <div class="s2-stat-label">
                        {{ t('overview.metrics.totalInterfaces')
                        }}<span class="s2-stat-sub">{{ t('overview.metrics.counterSuffix') }}</span>
                    </div>
                </div>
                <div class="s2-metric">
                    <div class="s2-stat-value s2-stat-value--rx">{{ totalRxFormatted }}</div>
                    <div class="s2-stat-label">{{ t('overview.metrics.totalRx') }}</div>
                </div>
                <div class="s2-metric">
                    <div class="s2-stat-value s2-stat-value--tx">{{ totalTxFormatted }}</div>
                    <div class="s2-stat-label">{{ t('overview.metrics.totalTx') }}</div>
                </div>
            </div>
        </div>

        <!-- All-interfaces aggregate trend -->
        <section class="s2-sheet-section">
            <AggregateTrendChart ref="trendChartRef" />
        </section>

        <!-- Interface total share bar -->
        <section v-if="summaries.length > 1" class="s2-sheet-section">
            <InterfaceShareBar :interfaces="summaries" />
        </section>

        <!-- Interface detail table (desktop) -->
        <section v-if="!isMobile" class="s2-sheet-section">
            <h2 class="s2-section-label">{{ t('overview.detailSection') }}</h2>
            <div class="ov-table-wrap">
                <table class="s2-table">
                    <caption class="s2-visually-hidden">
                        {{
                            $t('overview.detailSection')
                        }}
                    </caption>
                    <colgroup>
                        <col v-for="col in tableColumns" :key="col.key" :style="{ width: col.width }" />
                    </colgroup>
                    <thead>
                        <tr>
                            <th v-for="col in tableColumns" :key="col.key" scope="col">{{ col.title }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in tableRows" :key="row.name">
                            <th scope="row">
                                <div class="ov-name-cell">
                                    <span class="s2-iface-name">{{ row.name }}</span>
                                    <span class="ov-spark">
                                        <span v-if="row.spark === 'loading'" class="s2-skeleton ov-spark-fill" />
                                        <Sparkline
                                            v-else-if="Array.isArray(row.spark)"
                                            class="ov-spark-fill"
                                            :data="row.spark"
                                            :color="row.color"
                                            :height="24"
                                        />
                                    </span>
                                </div>
                            </th>
                            <td v-for="col in dataColumns" :key="col.key">
                                <template v-if="col.key === 'todayProgress'">
                                    <span v-if="row.ringLoading" class="s2-skeleton ov-ring-skeleton" />
                                    <TodayRing
                                        v-else
                                        :percent="row.ring?.percent ?? null"
                                        :over="row.ring?.over ?? false"
                                        :title="row.ringTitle"
                                    />
                                </template>
                                <template v-else>{{ cellValue(row, col.key) }}</template>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- Interface detail rows (mobile) -->
        <section v-else class="s2-sheet-section">
            <h2 class="s2-section-label">{{ t('overview.detailSection') }}</h2>
            <div class="ov-iface-list">
                <div v-for="row in tableRows" :key="row.name" class="s2-iface-card">
                    <div class="s2-iface-card-top">
                        <div>
                            <span class="s2-iface-name">{{ row.name }}</span>
                            <span v-if="row.alias" class="muted s2-iface-alias">{{ row.alias }}</span>
                        </div>
                        <span class="ov-card-pct">{{
                            t('overview.card.shareOfTotal', { percent: formatDecimal(row.share, 1) })
                        }}</span>
                    </div>
                    <div v-if="row.spark === 'loading'" class="ov-card-spark">
                        <span class="s2-skeleton ov-card-spark-fill" />
                    </div>
                    <Sparkline
                        v-else-if="Array.isArray(row.spark)"
                        class="ov-card-spark"
                        :data="row.spark"
                        :color="row.color"
                        :height="24"
                    />
                    <div class="s2-iface-card-stats">
                        <div>
                            <div class="s2-stat-label">{{ t('overview.card.totalRx') }}</div>
                            <div class="s2-stat-value s2-stat-value--rx s2-stat-value--md">
                                {{ formatBytes(row.total.rx).formatted }}
                            </div>
                        </div>
                        <div>
                            <div class="s2-stat-label">{{ t('overview.card.totalTx') }}</div>
                            <div class="s2-stat-value s2-stat-value--tx s2-stat-value--md">
                                {{ formatBytes(row.total.tx).formatted }}
                            </div>
                        </div>
                        <div>
                            <div class="s2-stat-label">{{ t('overview.card.todayRx') }}</div>
                            <div class="s2-stat-value s2-stat-value--md">
                                {{ formatBytes(row.todayRx).formatted }}
                            </div>
                        </div>
                        <div>
                            <div class="s2-stat-label">{{ t('overview.card.todayTx') }}</div>
                            <div class="s2-stat-value s2-stat-value--md">
                                {{ formatBytes(row.todayTx).formatted }}
                            </div>
                        </div>
                    </div>
                    <div class="ov-card-today">
                        <span v-if="row.ringLoading" class="s2-skeleton ov-ring-skeleton" />
                        <template v-else>
                            <TodayRing
                                :percent="row.ring?.percent ?? null"
                                :over="row.ring?.over ?? false"
                                :title="row.ringTitle"
                            />
                            <span class="ov-card-today-text">{{ row.ringText }}</span>
                        </template>
                    </div>
                    <div class="s2-iface-card-updated">
                        {{ t('overview.card.updated') }}
                        {{
                            row.updatedTimestamp
                                ? dayjs.unix(row.updatedTimestamp).format(t('common.format.dateTime'))
                                : '-'
                        }}
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { SPARKLINE_MAX_INTERFACES, useInterfaceOverview } from '@/composables/useInterfaceOverview';
import { computeTodayRing, type TodayProgress, type TodayRingResult } from '@/composables/useTodayProgress';
import { useSpeedFormat } from '@/composables/useSpeedFormat';
import { formatBytes } from '@/utils/bytes';
import { formatDecimal } from '@/utils/numbers';
import { useDayjs } from '@/composables/useDayjs';
import { useMobile } from '@/composables/useMobile';
import AggregateTrendChart from '@/components/overview/AggregateTrendChart.vue';
import InterfaceShareBar from '@/components/overview/InterfaceShareBar.vue';
import TodayRing from '@/components/overview/TodayRing.vue';
import Sparkline from '@/components/charts/Sparkline.vue';
import { interfaceCategoryHex } from '@/components/overview/interfaceColors';
import type { InterfaceSummary } from '@/types/network';

// The Sparkline component does not import the uPlot styles itself (a shared component should stay untouched), so they are imported here by the consumer following RealTimeLine's convention
import 'uplot/dist/uPlot.min.css';

const dayjs = useDayjs();
const { t } = useI18n();
const { isMobile } = useMobile();
const { formatSpeed } = useSpeedFormat();

/** All-interfaces trend section instance (refreshed on polling through the exposed refresh) */
const trendChartRef = ref<InstanceType<typeof AggregateTrendChart> | null>(null);

/**
 * Every request this page makes lives in useInterfaceOverview: the summary + stats pair, the polling
 * and the per-row details. The trend section is a child component, so its ref is handed down as a
 * callback instead of the composable reaching into a component.
 */
const { summaries, stats, sparklineState, todayProgressState } = useInterfaceOverview({
    refreshTrend: (signal) => trendChartRef.value?.refresh(signal),
});

const totalRxFormatted = computed(() => formatBytes(stats.value.totalRx).formatted);
const totalTxFormatted = computed(() => formatBytes(stats.value.totalTx).formatted);

/** Seconds elapsed today, used to convert today's usage into today's average rate */
const secondsToday = computed(() => Math.max(1, dayjs().diff(dayjs().startOf('day'), 'second')));

/** Today's average rate (wired to the global speedUnit, so it updates automatically with the top bar toggle) */
function formatTodaySpeed(todayBytes: number): string {
    return formatSpeed(todayBytes / secondsToday.value, 1);
}

/** Cumulative total across all interfaces (sum of rx+tx), the denominator for the share calculation */
const grandTotal = computed(() => summaries.value.reduce((sum, item) => sum + item.total.rx + item.total.tx, 0));

type SummaryColumnKey =
    'name' | 'alias' | 'totalRx' | 'totalTx' | 'todayRx' | 'todayTx' | 'todayProgress' | 'updatedTimestamp';

/**
 * Table column definitions.
 * Titles are resolved through i18n and therefore have to be computed so a locale
 * switch re-renders the header; widths are static.
 */
const tableColumns = computed<{ key: SummaryColumnKey; title: string; width: string }[]>(() => [
    { key: 'name', title: t('overview.columns.name'), width: '15%' },
    { key: 'alias', title: t('overview.columns.alias'), width: '12%' },
    { key: 'totalRx', title: t('overview.columns.totalRx'), width: '13%' },
    { key: 'totalTx', title: t('overview.columns.totalTx'), width: '13%' },
    { key: 'todayRx', title: t('overview.columns.todayRx'), width: '11%' },
    { key: 'todayTx', title: t('overview.columns.todayTx'), width: '11%' },
    { key: 'todayProgress', title: t('overview.columns.todayProgress'), width: '11%' },
    { key: 'updatedTimestamp', title: t('overview.columns.updated'), width: '14%' },
]);

/** Body cells only: the first column (name) is rendered separately as the row header */
const dataColumns = computed(() => tableColumns.value.slice(1));

/** Render the cell content by column key (todayProgress is rendered by the share ring branch inside the template) */
function cellValue(row: InterfaceSummary, key: SummaryColumnKey): string {
    if (key === 'name') return row.name;
    if (key === 'alias') return row.alias;
    if (key === 'totalRx') return formatBytes(row.total.rx).formatted;
    if (key === 'totalTx') return formatBytes(row.total.tx).formatted;
    if (key === 'todayRx') return formatBytes(row.todayRx).formatted;
    if (key === 'todayTx') return formatBytes(row.todayTx).formatted;
    if (key === 'todayProgress') return '';
    return row.updatedTimestamp ? dayjs.unix(row.updatedTimestamp).format(t('common.format.dateTime')) : '-';
}

/** Share ring tooltip text: the actual today / daily average values + today's average rate (following the global speedUnit) */
function ringTitleFor(progress: TodayProgress | null, loading: boolean): string {
    if (loading) return t('overview.ring.loading');
    if (!progress) return t('overview.ring.unavailable');
    return t('overview.ring.detail', {
        today: formatBytes(progress.todayBytes).formatted,
        avg: formatBytes(progress.avgBytes).formatted,
        speed: formatTodaySpeed(progress.todayBytes),
    });
}

/** Text beside the share ring (mobile card) */
function ringTextFor(progress: TodayProgress | null, ring: TodayRingResult | null): string {
    if (!progress || !ring || ring.percent === null) return t('overview.ring.noHistory');
    const base = t('overview.ring.reachedAvg', { percent: ring.percent });
    const speed = t('overview.ring.speed', { speed: formatTodaySpeed(progress.todayBytes) });
    return ring.over ? `${base} · ${t('overview.ring.overAvg')} · ${speed}` : `${base} · ${speed}`;
}

/** Unified row model for the table / mobile cards: adds the category color, in-row sparkline state, share of the grand total and today's progress ring */
const tableRows = computed(() =>
    summaries.value.map((item, index) => {
        const withinLimit = index < SPARKLINE_MAX_INTERFACES;
        const progress = withinLimit ? (todayProgressState[item.name] ?? null) : null;
        const ring = progress ? computeTodayRing(progress.todayBytes, progress.avgBytes) : null;
        const ringLoading = withinLimit && !(item.name in todayProgressState);
        return {
            ...item,
            color: interfaceCategoryHex(index),
            spark: withinLimit ? (sparklineState[item.name] ?? 'loading') : null,
            share: grandTotal.value > 0 ? ((item.total.rx + item.total.tx) / grandTotal.value) * 100 : 0,
            ring,
            ringLoading,
            ringTitle: ringTitleFor(progress, ringLoading),
            ringText: ringTextFor(progress, ring),
        };
    }),
);
</script>

<style scoped>
/* ── Table container: scrolls horizontally on narrow screens ── */
.ov-table-wrap {
    overflow-x: auto;
}

/* ── Mobile open row list (divided by hairlines, no card frame) ── */
.ov-iface-list {
    display: flex;
    flex-direction: column;
}

.s2-iface-card {
    padding: 14px 0;
}

.s2-iface-card:first-child {
    padding-top: 0;
}

.s2-iface-card:last-child {
    padding-bottom: 0;
}

.s2-iface-card + .s2-iface-card {
    border-top: 1px solid var(--s2-border-light);
    transition: border-color var(--s2-transition);
}

.s2-iface-card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.s2-iface-card-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 16px;
}

.s2-iface-card-updated {
    margin-top: 8px;
    padding-top: 6px;
    border-top: 1px solid var(--s2-border-light);
    transition: border-color var(--s2-transition);
    font-size: 12px;
    color: var(--s2-text-muted);
}

/* ── Table "Interface" column: name + 7 day sparkline ── */
.ov-name-cell {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}

.ov-name-cell .s2-iface-name {
    flex-shrink: 0;
}

.ov-spark {
    display: inline-flex;
    width: 72px;
    height: 24px;
    flex-shrink: 0;
}

.ov-spark-fill {
    width: 100%;
    height: 100%;
    border-radius: var(--s2-radius-xs);
}

/* ── Mobile row: share small text + sparkline ── */
.ov-card-pct {
    flex-shrink: 0;
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--s2-text-muted);
}

.ov-card-spark {
    width: 100%;
    height: 24px;
    margin-bottom: 10px;
}

.ov-card-spark-fill {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: var(--s2-radius-xs);
}

/* ── Today share ring: loading skeleton (same size as the ring) ── */
.ov-ring-skeleton {
    display: inline-block;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    flex-shrink: 0;
}

/* ── Mobile row: today's progress (ring + text) ── */
.ov-card-today {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--s2-border-light);
    transition: border-color var(--s2-transition);
}

.ov-card-today-text {
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--s2-text-muted);
}
</style>
