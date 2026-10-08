import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { nextTick } from 'vue';

import LiveHeader from '@/components/live/LiveHeader.vue';
import LiveChartArea from '@/components/live/LiveChartArea.vue';
import { DAYJS_KEY } from '@/composables/useDayjs';
import dayjs from '@/plugins/dayjs';
import { i18n, setI18nLocale } from '@/plugins/i18n';

const originalLocale = i18n.global.locale.value;
const wrappers: VueWrapper[] = [];
afterEach(() => {
    wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
    setI18nLocale(originalLocale);
});

describe('live count localization', () => {
    it('renders complete sample messages with plural selection, formatted counts and no stale suffix', async () => {
        setI18nLocale('en-US');
        const wrapper = mount(LiveHeader, {
            props: {
                liveUsage: { rx: { formatted: '1 Mbps' }, tx: { formatted: '1 Mbps' } },
                todayTotal: '1 GiB',
                formattedNow: '1:00 PM',
                interfaceName: 'eth0',
                totalSamples: 1,
            },
            global: { plugins: [i18n] },
        });
        wrappers.push(wrapper);
        expect(wrapper.text()).toContain('1 sample');
        expect(wrapper.text()).not.toContain('1 samples');
        await wrapper.setProps({ totalSamples: 12345 });
        expect(wrapper.text()).toContain('12,345 samples');
        setI18nLocale('de-DE');
        await nextTick();
        expect(wrapper.text()).toContain('12.345 Messwerte');
        setI18nLocale('ru-RU');
        for (const [count, text] of [
            [1, '1 выборка'],
            [2, '2 выборки'],
            [5, '5 выборок'],
            [21, '21 выборка'],
            [22, '22 выборки'],
        ] as const) {
            await wrapper.setProps({ totalSamples: count });
            expect(wrapper.text()).toContain(text);
        }
    });

    it('shows the live dot only while connected and updates a rate without a settle class', async () => {
        setI18nLocale('en-US');
        const wrapper = mount(LiveHeader, {
            props: {
                liveUsage: { rx: { formatted: '-' }, tx: { formatted: '-' } },
                todayTotal: '1 GiB',
                formattedNow: '1:00 PM',
                interfaceName: 'eth0',
                totalSamples: 1,
                connected: false,
            },
            global: { plugins: [i18n] },
        });
        wrappers.push(wrapper);

        expect(wrapper.find('.s2-live-dot').exists()).toBe(false);
        await wrapper.setProps({ connected: true });
        expect(wrapper.find('.s2-live-dot').exists()).toBe(true);

        await wrapper.setProps({ liveUsage: { rx: { formatted: '2 Mbps' }, tx: { formatted: '-' } } });
        expect(wrapper.find('.s2-stat-value--rx').text()).toBe('2 Mbps');
        expect(wrapper.find('.s2-stat-value--rx').classes()).not.toContain('s2-live-settle');
        expect(wrapper.find('.s2-stat-value--tx').classes()).not.toContain('s2-live-settle');
    });

    it('switches uptime plurals without new traffic and preserves unavailable uptime', async () => {
        setI18nLocale('en-US');
        const wrapper = mount(LiveChartArea, {
            props: {
                latestTraffic: null,
                isDark: false,
                fiveMinuteItems: [],
                peakValue: '-',
                peakTimeStr: '-',
                troughValue: '-',
                troughTimeStr: '-',
                minMaxWindow: '',
                fiveMinTotal: '-',
                daysSinceCreation: 1,
                createdDate: '-',
                monthlyTotal: { formatted: '-' },
                grandTotal: { formatted: '-' },
            },
            global: {
                plugins: [i18n, createTestingPinia({ createSpy: vi.fn })],
                provide: { [DAYJS_KEY as symbol]: dayjs },
                stubs: { RealTimeLine: true },
            },
        });
        wrappers.push(wrapper);
        const uptime = () => wrapper.findAll('.s2-sidebar-value')[3]!.text();
        expect(uptime()).toContain('1 day');
        expect(uptime()).not.toContain('1 days');
        setI18nLocale('de-DE');
        await nextTick();
        expect(uptime()).toContain('1 Tag');
        await wrapper.setProps({ daysSinceCreation: 2 });
        expect(uptime()).toContain('2 Tage');
        await wrapper.setProps({ daysSinceCreation: null });
        expect(uptime()).toBe('-');
    });
});
