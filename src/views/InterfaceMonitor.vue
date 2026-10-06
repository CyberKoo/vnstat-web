<template>
    <div class="s2-sheet">
        <div class="s2-sheet-section">
            <LiveHeader
                :live-usage="liveUsage"
                :today-total="todayTotal"
                :formatted-now="formattedNow"
                :interface-name="interfaceName"
                :total-samples="totalSamples"
            />
        </div>

        <section class="s2-sheet-section">
            <CompactTrafficCard
                :compact-data="s2CompactData"
                :compact-options="s2CompactOptions"
                :compact-stats="compactStats"
                :max-bandwidth="maxBandwidth"
                :link-speed-loading="linkSpeedLoading"
                :rx-util-pct="rxUtilPct"
                :tx-util-pct="txUtilPct"
            />
        </section>

        <section class="s2-sheet-section">
            <LiveChartArea
                :latest-traffic="latestTraffic"
                :is-dark="themeStore.isDark"
                :five-minute-items="fiveMinuteItems"
                :peak-value="peakValue"
                :peak-time-str="peakTimeStr"
                :trough-value="troughValue"
                :trough-time-str="troughTimeStr"
                :min-max-window="minMaxWindow"
                :five-min-total="fiveMinTotal"
                :days-since-creation="interfaceMeta.daysSinceCreation"
                :created-date="createdDate"
                :monthly-total="monthlyTotal"
                :grand-total="grandTotal"
            />
        </section>

        <div class="s2-sheet-section">
            <BottomCards
                :pps-donut-data="ppsDonutData"
                :pps-donut-options="ppsDonutOptions"
                :pps-total="ppsTotal"
                :pps-stats="ppsStats"
                :mini-bar-data="s2MiniBarData"
                :mini-bar-options="s2MiniBarOptions"
                :top5="top5"
            />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, shallowRef, toRef, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

import LiveHeader from '@/components/live/LiveHeader.vue';
import CompactTrafficCard from '@/components/live/CompactTrafficCard.vue';
import LiveChartArea from '@/components/live/LiveChartArea.vue';
import BottomCards from '@/components/live/BottomCards.vue';

import { APP_MAX_POINTS } from '@/config';
import { useInterfaceStore } from '@/stores/interface';
import { useInterfaceDetailStore } from '@/stores/interfaceDetail';
import { useLinkSpeedStore } from '@/stores/linkSpeed';

import { useInterfaceMeta } from '@/composables/useInterfaceMeta';
import { useSummaryData } from '@/composables/useSummaryData';
import { useLiveExtremes } from '@/composables/useLiveExtremes';
import { useLiveNetworkStats } from '@/composables/useLiveNetworkStats';
import { useLiveChartOptions } from '@/composables/useLiveChartOptions';
import { useDayjs } from '@/composables/useDayjs';

import { useThemeStore } from '@/stores/theme.ts';

// ── stores ──
const themeStore = useThemeStore();
const { t } = useI18n();
const interfaceStore = useInterfaceStore();
const interfaceDetailStore = useInterfaceDetailStore();
const linkSpeedStore = useLinkSpeedStore();
const { value: detailRef } = storeToRefs(interfaceDetailStore);
const { linkSpeed, loading: linkSpeedLoading } = storeToRefs(linkSpeedStore);

// ── composables ──
const dayjs = useDayjs();

const { usage: liveUsage, latest: latestTraffic } = useLiveNetworkStats(
    toRef(interfaceStore, 'selected'),
    APP_MAX_POINTS,
);

const { fiveMinTotal, todayTotal, monthlyTotal, grandTotal } = useSummaryData(detailRef);
const interfaceMeta = useInterfaceMeta(detailRef);

/** fiveminute history (≈48 hours, 5 minute interval), for the replay timeline and peak/trough stats */
const fiveMinuteItems = computed(() => detailRef.value?.traffic?.fiveminute ?? []);
const minMaxSlice = computed(() => fiveMinuteItems.value.slice(-26, -1));

const { peakValue, peakTimeStr, troughValue, troughTimeStr, minMaxWindow } = useLiveExtremes(minMaxSlice);

// Fetch the link speed on demand when the interface changes (cached per interface in the store), falling back to the configured default on failure
watch(toRef(interfaceStore, 'selected'), (name) => linkSpeedStore.load(name), { immediate: true });

const {
    ppsDonutData,
    ppsDonutOptions,
    ppsTotal,
    ppsStats,
    s2CompactData,
    s2CompactOptions,
    compactStats,
    maxBandwidth,
    rxUtilPct,
    txUtilPct,
    s2MiniBarData,
    s2MiniBarOptions,
} = useLiveChartOptions(latestTraffic, detailRef, linkSpeed);

// ── S2 computed data ──

/** Local receipt time, initialized even before the first sample arrives. */
const lastReceivedAt = shallowRef(Date.now());
watch(latestTraffic, () => {
    lastReceivedAt.value = Date.now();
});
const formattedNow = computed(() => dayjs(lastReceivedAt.value).format(t('common.format.timeSeconds')));

/** Interface name */
const interfaceName = computed(() => detailRef.value?.name ?? '-');

/** Sample count */
const totalSamples = computed(() => interfaceMeta.value.totalSamples ?? 0);

/** Creation date */
const createdDate = computed(() => {
    if (!interfaceMeta.value.created) return '-';
    return dayjs.unix(interfaceMeta.value.created).format(t('common.format.date'));
});

/** Top 5 */
const top5 = computed(() => detailRef.value?.traffic?.top?.slice(0, 5) ?? []);
</script>
