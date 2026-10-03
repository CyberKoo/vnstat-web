<template>
    <div class="s2-sheet">
        <!-- Stat metrics + auto insights + quota / record progress -->
        <div class="s2-sheet-section">
            <TrafficStatsHeader :stats="statsHeader" />
            <div v-if="insights.length" class="s2-insight-strip">
                <span v-for="(text, i) in insights" :key="i" class="s2-insight">
                    <svg
                        class="s2-insight-icon"
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                    >
                        <path
                            d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"
                        />
                    </svg>
                    <span>{{ text }}</span>
                </span>
            </div>

            <!-- Today vs historical record (Daily only) -->
            <div v-if="recordProgress" class="s2-progress-block">
                <div class="s2-progress-head">
                    <span class="s2-progress-title">
                        <i18n-t keypath="period.record.title" tag="span">
                            <template #today>
                                <b>{{ formatBytes(recordProgress.todayBytes, 1).formatted }}</b>
                            </template>
                            <template #record>{{ formatBytes(recordProgress.recordBytes, 1).formatted }}</template>
                            <template #percent>{{ recordProgress.percent }}</template>
                        </i18n-t>
                    </span>
                    <span class="s2-progress-hint">
                        {{
                            recordProgress.reached
                                ? t('period.record.reached')
                                : t('period.record.remaining', {
                                      remaining: formatBytes(recordProgress.remainingBytes, 1).formatted,
                                  })
                        }}
                    </span>
                </div>
                <div class="s2-progress-track">
                    <div class="s2-progress-fill" :style="{ width: recordFillWidth }" />
                </div>
            </div>

            <!-- Monthly quota (Monthly only) -->
            <div v-if="quotaBlock" class="s2-progress-block s2-quota-block">
                <div class="s2-progress-head">
                    <span class="s2-progress-title">
                        <template v-if="quotaBlock.progress">
                            <i18n-t keypath="period.quota.used" tag="span">
                                <template #month>
                                    {{
                                        quotaBlock.isCurrentMonth ? t('period.quota.thisMonth') : quotaBlock.monthLabel
                                    }}
                                </template>
                                <template #used>
                                    <b>{{ formatBytes(quotaBlock.used, 1).formatted }}</b>
                                </template>
                                <template #quota>{{ quotaBlock.progress.quotaBytes / BYTES_IN_GIB }}</template>
                                <template #percent>{{ quotaBlock.progress.percent }}</template>
                            </i18n-t>
                        </template>
                        <template v-else>{{ t('period.quota.notSet') }}</template>
                    </span>
                    <button ref="quotaBtn" class="s2-drill-btn" :aria-expanded="quotaOpen" @click="toggleQuotaPanel">
                        {{ quotaBlock.quotaSet ? t('period.quota.adjust') : t('period.quota.set') }}
                    </button>
                </div>
                <div v-if="quotaBlock.progress" class="s2-progress-track">
                    <div class="s2-progress-fill" :class="quotaBarClass" :style="{ width: quotaFillWidth }" />
                </div>
                <div
                    v-if="quotaProjectionLine"
                    class="s2-quota-proj"
                    :class="{ 's2-quota-proj--over': quotaProjectionOver }"
                >
                    {{ quotaProjectionLine }}
                </div>

                <!-- Quota settings popover (mirrors the realtime page threshold panel). Teleported to
                     <body>: inside the sheet, backdrop-filter would make the card the containing block
                     for the fixed mask, so clicks outside the card never reached it -->
                <Teleport to="body">
                    <template v-if="quotaOpen">
                        <div class="s2-quota-mask" @click="closeQuotaPanel" />
                        <div
                            ref="quotaPanel"
                            class="s2-quota-panel"
                            :style="quotaPanelStyle"
                            role="group"
                            :aria-label="t('period.quota.panelTitle')"
                            @keydown.esc="closeQuotaPanel"
                            @keydown="onQuotaPanelKeydown"
                            @focusout="onQuotaFocusout"
                        >
                            <div class="s2-quota-panel-title">{{ t('period.quota.panelTitle') }}</div>
                            <div class="s2-quota-row">
                                <input
                                    ref="quotaInputEl"
                                    v-model="quotaInput"
                                    type="number"
                                    min="0"
                                    step="1"
                                    class="s2-quota-input"
                                    :placeholder="t('period.quota.placeholder')"
                                    :aria-label="t('period.quota.inputLabel')"
                                    :aria-describedby="quotaUnitId"
                                    @change="applyQuotaInput"
                                />
                                <span :id="quotaUnitId" class="s2-quota-unit">GiB</span>
                            </div>
                            <div class="s2-quota-foot">
                                <button class="s2-quota-clear" :disabled="!quotaBlock.quotaSet" @click="clearQuota">
                                    {{ t('period.quota.clear') }}
                                </button>
                                <span class="s2-quota-state">
                                    {{
                                        quotaBlock.quotaSet
                                            ? t('period.quota.stateSet', { quota: settingsStore.monthlyQuotaGiB })
                                            : t('period.quota.stateUnset')
                                    }}
                                </span>
                            </div>
                        </div>
                    </template>
                </Teleport>
            </div>
        </div>

        <!-- Calendar heatmap (Daily only) -->
        <section v-if="period === 'day'" class="s2-sheet-section">
            <h2 class="s2-section-label">{{ t('period.calendar.title') }}</h2>
            <CalendarHeatmap :data="calendarData" />
        </section>

        <!-- Hour-of-day profile + weekday × hour matrix (Hourly only) -->
        <section v-if="period === 'hour'" class="s2-sheet-section">
            <h2 class="s2-section-label">{{ t('period.hourly.profileTitle') }}</h2>
            <HourlyProfile />
            <h3 class="s2-section-label s2-sub-label">{{ t('period.hourly.weekHourTitle') }}</h3>
            <WeekHourHeatmap />
        </section>

        <!-- Year comparison cards (Yearly only) -->
        <section v-if="period === 'year' && yearCards.length" class="s2-sheet-section">
            <h2 class="s2-section-label">{{ t('period.yearCompare.title') }}</h2>
            <YearCards :cards="yearCards" />
        </section>

        <!-- Traffic trend + Glass sidebar -->
        <section class="s2-sheet-section">
            <TrafficChartPanel
                :chart-data="chartData"
                :chart-options="chartOptions"
                :chart-height="chartHeight"
                :chart-title="chartTitle"
                :donut-data="donutData"
                :rx-percent="sideStats.rxPercent"
                :detail-rows="detailRows"
                :allow-cumulative="supportsCumulative"
            />
        </section>

        <!-- Peak hour bar (Hourly only) -->
        <div v-if="config.hasPeakStrip && peakPeriods.length" class="s2-sheet-section s2-peak-section">
            <div class="s2-peak-strip">
                <span class="s2-peak-label">{{ t('period.peakStrip.label') }}</span>
                <span v-for="(p, i) in peakPeriods" :key="i" class="s2-peak-chip">
                    <span class="mono s2-peak-time">{{ p.time }}</span>
                    <span class="s2-peak-val">{{ p.total }}</span>
                </span>
            </div>
        </div>

        <!-- Data detail (the title is rendered by TrafficDataTable) -->
        <section class="s2-sheet-section">
            <TrafficDataTable :columns="tableColumns" :data="tableData" :date-labels="tableDateLabels" />
        </section>
    </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, useId } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

import type { PeriodType } from '@/config/trafficPeriods';
import { useTrafficPeriod } from '@/composables/useTrafficPeriod';
import { useAnchoredPanel } from '@/composables/useAnchoredPanel';
import { useInterfaceDetailStore } from '@/stores/interfaceDetail';
import { useSettingsStore } from '@/stores/settings';
import { formatBytes } from '@/utils/bytes';
import { focusNeighbor } from '@/utils/focus';

import TrafficStatsHeader from '@/components/TrafficStatsHeader.vue';
import TrafficDataTable from '@/components/TrafficDataTable.vue';
import TrafficChartPanel from '@/components/TrafficChartPanel.vue';
import CalendarHeatmap from '@/components/CalendarHeatmap.vue';
import HourlyProfile from '@/components/charts/HourlyProfile.vue';
import WeekHourHeatmap from '@/components/charts/WeekHourHeatmap.vue';
import YearCards from '@/components/charts/YearCards.vue';

const { t } = useI18n();

/** 1 GiB (bytes), used to convert the quota bytes back to GiB for display */
const BYTES_IN_GIB = 1024 ** 3;

const props = defineProps<{
    period: PeriodType;
}>();

const {
    config,
    chartHeight,
    statsHeader,
    chartData,
    chartOptions,
    donutData,
    sideStats,
    detailRows,
    peakPeriods,
    tableDateLabels,
    tableColumns,
    tableData,
    insights,
    supportsCumulative,
    quotaBlock,
    recordProgress,
    yearCards,
} = useTrafficPeriod(props.period);

const interfaceDetailStore = useInterfaceDetailStore();
const { value: interfaceDetail } = storeToRefs(interfaceDetailStore);

/** Settings store (monthly quota read/write) */
const settingsStore = useSettingsStore();

/** Chart title of the current period (follows the UI locale) */
const chartTitle = computed(() => t(`periods.${props.period}.chartTitle`));

/** Calendar heatmap data (day traffic on the Daily page) */
const calendarData = computed(() => interfaceDetail.value?.traffic?.day ?? []);

/** Record progress bar width (capped at 100%) */
const recordFillWidth = computed(() => `${Math.min(100, recordProgress.value?.percent ?? 0)}%`);

/** Quota progress bar width (capped at 100%, the percentage text still shows the real value) */
const quotaFillWidth = computed(() => `${Math.min(100, quotaBlock.value?.progress?.percent ?? 0)}%`);

/** Quota progress bar color: >90% warns (accent), ≥100% is over quota (danger) */
const quotaBarClass = computed(() => {
    const percent = quotaBlock.value?.progress?.percent ?? 0;
    if (percent >= 100) return 's2-progress-fill--over';
    if (percent > 90) return 's2-progress-fill--warn';
    return '';
});

/** Month-end forecast text (only shown when a quota is set and it is the current month) */
const quotaProjectionLine = computed(() => {
    const block = quotaBlock.value;
    if (!block?.projection || !block.quotaSet) return '';
    const projected = formatBytes(block.projection.projectedBytes, 1).formatted;
    if (block.projPercent != null) {
        return t('period.quota.projectionWithPercent', { projected, percent: block.projPercent });
    }
    return t('period.quota.projection', { projected });
});

/** Highlighted when the quota is expected to be exceeded */
const quotaProjectionOver = computed(() => (quotaBlock.value?.projPercent ?? 0) > 100);

// ── Quota settings popover ──

const quotaOpen = ref(false);
const quotaInput = ref('');
const quotaBtn = ref<HTMLElement>();
const quotaPanel = ref<HTMLElement>();
const quotaInputEl = ref<HTMLInputElement>();
const quotaUnitId = useId();
const { panelStyle: quotaPanelStyle } = useAnchoredPanel(quotaBtn, quotaPanel, quotaOpen);

function toggleQuotaPanel() {
    quotaOpen.value = !quotaOpen.value;
    if (quotaOpen.value) {
        quotaInput.value = settingsStore.monthlyQuotaGiB?.toString() ?? '';
        // The panel is teleported to the end of <body>, so without this a keyboard user would
        // have to Tab through the rest of the page to reach it
        void nextTick(() => quotaInputEl.value?.focus());
    }
}

/** Escape / mask click: close and return focus to the trigger button */
function closeQuotaPanel() {
    quotaOpen.value = false;
    quotaBtn.value?.focus();
}

/** Last Tab direction inside the panel — tells the focusout handoff which way to walk */
let quotaTabDirection: 'forward' | 'backward' = 'forward';

function onQuotaPanelKeydown(event: KeyboardEvent) {
    if (event.key === 'Tab') quotaTabDirection = event.shiftKey ? 'backward' : 'forward';
}

/**
 * Non-modal popover: focus leaving the panel dismisses it. The panel is teleported to <body>'s
 * end, so the native tab order would leave the page (Tab past the last element strands focus on
 * the browser chrome) — hand it to the trigger's neighbor in the Tab direction instead, after the
 * panel has unmounted so its own controls cannot be chosen.
 */
function onQuotaFocusout(event: FocusEvent) {
    if (quotaPanel.value?.contains(event.relatedTarget as Node)) return;
    quotaOpen.value = false;
    void nextTick(() => {
        if (!focusNeighbor(quotaBtn.value, quotaTabDirection)) quotaBtn.value?.focus();
    });
}

/** Applied input: blank = remove the quota; invalid / non-positive values are not written */
function applyQuotaInput() {
    const raw = String(quotaInput.value ?? '').trim();
    if (raw === '') {
        settingsStore.monthlyQuotaGiB = null;
        return;
    }
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) return;
    settingsStore.monthlyQuotaGiB = value;
}

function clearQuota() {
    settingsStore.monthlyQuotaGiB = null;
    quotaInput.value = '';
}
</script>

<style scoped>
/* Add spacing between the second section title in the same section and the content above it */
.s2-sub-label {
    margin-top: 22px;
}

/* Peak hour bar (Hourly only): more compact vertical padding inside the section */
.s2-peak-section {
    padding-top: 14px;
    padding-bottom: 14px;
}
.s2-peak-strip {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}
.s2-peak-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--s2-text-muted);
    white-space: nowrap;
    font-family: var(--font-sans);
}
.s2-peak-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border-radius: 4px;
    border: 1px solid var(--s2-border);
    font-size: 13px;
    transition: border-color var(--s2-transition);
}
.s2-peak-time {
    font-weight: 600;
    font-size: 12px;
}
.s2-peak-val {
    color: var(--s2-text-muted);
    font-size: 11px;
}

/* Shared small bordered button (quota set / adjust) */
.s2-drill-btn {
    flex-shrink: 0;
    padding: 4px 12px;
    border: 1px solid var(--s2-border);
    border-radius: var(--s2-radius-xs);
    background: transparent;
    color: var(--s2-text-muted);
    font-size: 12px;
    font-family: var(--font-sans);
    cursor: pointer;
    transition: all var(--s2-transition);
}
.s2-drill-btn:hover:not(:disabled) {
    border-color: var(--brand);
    color: var(--brand);
    background: var(--s2-hover-bg);
}

/* Auto insight: a single row below the stat band, separated by a hairline and shown in a muted way */
.s2-insight-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 24px;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--s2-border-light);
    transition: border-color var(--s2-transition);
}
.s2-insight {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--s2-text-muted);
    font-family: var(--font-sans);
}
.s2-insight-icon {
    flex-shrink: 0;
    color: var(--brand);
}

/* Compact progress sections (today vs record / monthly quota): the same divider as the insight row */
.s2-progress-block {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--s2-border-light);
    font-family: var(--font-sans);
    transition: border-color var(--s2-transition);
}
/* Shares the divider when it directly follows the insight row */
.s2-insight-strip + .s2-progress-block {
    margin-top: 12px;
}
.s2-progress-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
}
.s2-progress-title {
    font-size: 12px;
    color: var(--s2-text-muted);
}
.s2-progress-title b {
    color: var(--s2-text);
    font-family: var(--font-mono);
    font-weight: 600;
}
.s2-progress-hint {
    font-size: 11px;
    color: var(--s2-text-muted);
    white-space: nowrap;
}
.s2-progress-track {
    margin-top: 8px;
    height: 6px;
    border-radius: 999px;
    background: var(--s2-track);
    overflow: hidden;
    transition: background-color var(--s2-transition);
}
.s2-progress-fill {
    height: 100%;
    border-radius: 999px;
    background: var(--brand);
    transition:
        width var(--s2-transition),
        background-color var(--s2-transition);
}
.s2-progress-fill--warn {
    background: var(--accent);
}
.s2-progress-fill--over {
    background: var(--danger);
}

.s2-quota-proj {
    margin-top: 8px;
    font-size: 12px;
    color: var(--s2-text-muted);
}
.s2-quota-proj--over {
    color: var(--danger);
    font-weight: 600;
}

/* Quota settings popover (mirrors the realtime page threshold panel). Teleported to <body>;
   the inline style from useAnchoredPanel supplies top/left */
.s2-quota-mask {
    position: fixed;
    inset: 0;
    z-index: 29;
}
.s2-quota-panel {
    position: fixed;
    z-index: 30;
    width: 208px;
    padding: 12px;
    background: var(--s2-glass-bg-strong);
    backdrop-filter: blur(var(--s2-glass-blur)) saturate(var(--s2-glass-saturate));
    -webkit-backdrop-filter: blur(var(--s2-glass-blur)) saturate(var(--s2-glass-saturate));
    border: 1px solid var(--s2-glass-border);
    border-radius: var(--s2-radius-sm);
    box-shadow: var(--s2-shadow-lg);
}
.s2-quota-panel-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--s2-text);
    margin-bottom: 8px;
}
.s2-quota-row {
    display: flex;
    align-items: center;
    gap: 8px;
}
.s2-quota-input {
    flex: 1;
    min-width: 0;
    height: 28px;
    padding: 0 8px;
    border: 1px solid var(--s2-border);
    border-radius: var(--s2-radius-xs);
    background: var(--s2-card);
    color: var(--s2-text);
    font-family: var(--font-mono);
    font-size: 12px;
    outline: none;
    transition: border-color var(--s2-transition);
}
.s2-quota-input:focus {
    border-color: var(--brand);
}
.s2-quota-unit {
    font-size: 11px;
    color: var(--s2-text-muted);
    flex-shrink: 0;
}
.s2-quota-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
}
.s2-quota-clear {
    padding: 3px 10px;
    border: 1px solid var(--s2-border);
    border-radius: var(--s2-radius-xs);
    background: transparent;
    color: var(--s2-text-muted);
    font-size: 12px;
    font-family: var(--font-sans);
    cursor: pointer;
    transition: all var(--s2-transition);
}
.s2-quota-clear:hover:not(:disabled) {
    border-color: var(--danger);
    color: var(--danger);
}
/* disabled opacity/cursor come from the shared control-state rules in theme-s2.css */
.s2-quota-state {
    font-size: 11px;
    color: var(--s2-text-muted);
}
</style>
