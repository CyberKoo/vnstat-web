/**
 * English message catalog.
 *
 * Key structure and interpolation parameters must stay in sync across all catalogs.
 *
 * Notes on structure:
 * - Composed sentences are whole messages with parameters; the word order here
 *   is not the Chinese one, which is exactly why these are not assembled from
 *   fragments.
 * - `counterSuffix` is empty because English has no CJK-style counting unit.
 * - `detail` splits the Chinese "今日 X / 日均 Y · 今日均速 Z" into an English
 *   sentence with a different order and different punctuation.
 */
export default {
    common: {
        rx: 'RX',
        tx: 'TX',
        retry: 'Retry',
        updated: 'Updated',
        /** Display date/time formats (dayjs tokens), kept per-locale so rendered timestamps follow the UI language */
        format: {
            date: 'MMM D, YYYY',
            time: 'h:mm A',
            timeSeconds: 'h:mm:ss A',
            dateTime: 'MMM D, YYYY h:mm A',
            dateTimeShort: 'MMM D h:mm A',
            monthDay: 'MMM D',
            dateWeekday: 'MMM D, YYYY ddd',
        },
    },

    overview: {
        detailSection: 'Interface details',
        metrics: {
            totalInterfaces: 'Total interfaces',
            counterSuffix: '',
            totalRx: 'Total received',
            totalTx: 'Total sent',
        },
        columns: {
            name: 'Interface',
            alias: 'Alias',
            totalRx: 'Total received',
            totalTx: 'Total sent',
            todayRx: 'Received today',
            todayTx: 'Sent today',
            todayProgress: "Today's progress",
            updated: 'Last update',
        },
        card: {
            shareOfTotal: '{percent}% of total',
            totalRx: 'Total received',
            totalTx: 'Total sent',
            todayRx: 'Received today',
            todayTx: 'Sent today',
            updated: 'Updated',
        },
        ring: {
            loading: "Loading today's progress",
            unavailable: "Today's progress is unavailable",
            detail: 'Today {today} / daily avg {avg} · avg speed {speed}',
            noHistory: "Today's progress: not enough history",
            reachedAvg: '{percent}% of daily average',
            overAvg: 'over average',
            speed: 'avg speed {speed}',
            ariaNoData: "Today's progress: no historical data",
            ariaReached: '{percent}% of the daily average reached',
        },
        trend: {
            title: 'All interfaces · last {days} day | All interfaces · last {days} days',
            rx: 'RX',
            tx: 'TX',
            loadFailed: 'Failed to load trend data',
            noData: 'No traffic in the last {days} day | No traffic in the last {days} days',
        },
        shareBar: {
            title: 'Share of total traffic',
            total: 'Total {total}',
        },
        fetchFailed: 'Failed to load interface overview',
    },

    /** Language names written in their own language (language switcher) */
    localeNames: {
        'zh-CN': 'Simplified Chinese',
        'zh-HK': 'Traditional Chinese',
        'en-US': 'English',
        'ja-JP': 'Japanese',
        'ru-RU': 'Russian',
        'de-DE': 'German',
        'es-ES': 'Spanish',
    },

    /** Top bar */
    header: {
        switchLanguage: 'Language',
        unitBitsTitle: 'Speed unit: bits (Mbps), click to switch to bytes',
        unitBytesTitle: 'Speed unit: bytes (MiB/s), click to switch to bits',
        refreshing: 'Refreshing…',
        refresh: 'Refresh page',
        toLight: 'Switch to light mode',
        toDark: 'Switch to dark mode',
    },

    /** Sidebar menu labels (mirror the route table) */
    menu: {
        liveStats: 'Live monitoring',
        trafficGroup: 'Traffic',
        hourly: 'Hourly',
        daily: 'Daily',
        monthly: 'Monthly',
        yearly: 'Yearly',
        top: 'Top traffic',
        overview: 'Overview',
        about: 'About',
        notFound: '404 Not Found',
    },

    /** Layout chrome */
    layout: {
        expandSider: 'Expand sidebar',
        collapseSider: 'Collapse sidebar',
        mainNav: 'Main navigation',
        skipToContent: 'Skip to main content',
        breadcrumb: 'Breadcrumb',
        interface: 'Interface',
    },

    /** 404 page */
    notFound: {
        title: 'Page not found',
        desc: 'The page you are looking for does not exist or has been removed.',
        home: 'Back to homepage',
    },

    /**
     * Traffic period pages (Hourly / Daily / Monthly / Yearly).
     * Keys mirror PERIOD_CONFIGS in `src/config/trafficPeriods.ts`; a period
     * only has the keys for the cards it actually shows (hour has no `avg`,
     * day has no `peak`).
     */
    periods: {
        hour: {
            label: 'Hour',
            chartTitle: 'Traffic trend',
            peak: 'Peak hour',
            trend: 'Current vs last hour',
            sideAvg: 'Total duration',
            sidePeak: 'Peak',
            /** Display date/time formats (dayjs tokens), kept per-locale so rendered timestamps follow the UI language */
            format: {
                tooltip: 'MMM D, YYYY h A',
                chart: 'h A',
                tablePeriod: 'h A',
                tableDateLabel: 'MMM D, YYYY',
            },
        },
        day: {
            label: 'Day',
            chartTitle: 'Traffic trend',
            avg: 'Daily average traffic',
            trend: 'Today vs yesterday',
            sideAvg: 'Daily avg',
            sidePeak: 'Peak day',
            /** Display date/time formats (dayjs tokens), kept per-locale so rendered timestamps follow the UI language */
            format: {
                tooltip: 'MMM D, YYYY',
                chart: 'MMM D',
                tablePeriod: 'MMM D',
                tableDateLabel: 'MMM YYYY',
            },
        },
        month: {
            label: 'Month',
            chartTitle: 'Month-by-month comparison',
            avg: 'Monthly average traffic',
            peak: 'Peak month',
            trend: 'This month vs last month',
            sideAvg: 'Monthly avg',
            sidePeak: 'Peak month',
            /** Display date/time formats (dayjs tokens), kept per-locale so rendered timestamps follow the UI language */
            format: {
                tooltip: 'MMM YYYY',
                chart: 'MMM YYYY',
                tablePeriod: 'MMM',
                tableDateLabel: 'YYYY',
            },
        },
        year: {
            label: 'Year',
            chartTitle: 'Month-by-month comparison',
            avg: 'Yearly average traffic',
            peak: 'Peak year',
            trend: 'This year vs last year',
            sideAvg: 'Yearly avg',
            sidePeak: 'Peak year',
            /** Display date/time formats (dayjs tokens), kept per-locale so rendered timestamps follow the UI language */
            format: {
                tooltip: 'YYYY',
                chart: 'YYYY',
                tablePeriod: 'YYYY',
            },
        },
    },

    /**
     * Chart copy: dataset labels, tooltips, legends and chart chrome.
     * The LABEL constants in periodChartData.ts hold these keys.
     */
    chart: {
        trafficWithUnit: 'Traffic ({unit})',
        ghostLine: 'Previous period',
        avgLine: 'Historical average',
        movingAverage: '{days}-day moving average',
        lastWeek: 'Same day last week',
        rxCumulative: 'Cumulative RX',
        txCumulative: 'Cumulative TX',
        tooltipValue: '{label}: {value}',
        tooltipNoData: '{label}: --',
        cumulativeTip: '{label}: {total} (this period {current})',
        yoy: {
            breakdownTip: '{label}: {total} (RX {rx} · TX {tx})',
            cumulativeTip: '{label}: {total} (this month {current})',
            changeTip: 'YoY {year}: {percent}',
            inProgress: 'In progress',
        },
        mode: {
            label: 'Chart mode',
            bar: 'Bar',
            area: 'Area',
            cumulative: 'Cumulative',
        },
        panel: {
            composition: 'Traffic mix',
            details: 'Details',
        },
        table: {
            detailTitle: 'Data details',
        },
        heatmap: {
            less: 'Less',
            more: 'More',
            cellTip: '{date}\nRX: {rx}\nTX: {tx}\nTotal: {total}',
        },
        legend: {
            low: 'Low',
            high: 'High',
        },
        hourlyProfile: {
            aria: '24-hour traffic profile',
            cellTip: '{time} · avg {avg}',
            cellTipToday: '{time} · avg {avg} · today {today}',
            hoverHint: "Hover to see today's actual values",
        },
        weekHour: {
            aria: 'Weekday × hour traffic heatmap',
            cellTip: '{weekday} {time} · {total}',
        },
        yearCard: {
            inProgress: 'In progress',
            yoy: 'YoY {percent}',
            monthlyAvg: 'Monthly avg {value}',
            peak: 'Peak {month} {value}',
            rxShare: 'RX {percent}%',
        },
    },

    /**
     * Traffic period pages: stat cards, side panel, record vs. today,
     * monthly quota, insights and the period table.
     */
    period: {
        format: {
            month: 'MMM YYYY',
        },
        stats: {
            total: {
                hour: '24h total',
                day: 'Total over {count} day | Total over {count} days',
                month: 'Total over {count} month | Total over {count} months',
                year: 'Total over {count} year | Total over {count} years',
            },
            compareLabel: 'vs previous period',
        },
        compare: {
            window: {
                hour: 'Last 24h vs prior 24h',
                day: 'Last 7 days vs prior 7 days',
                month: 'This month vs last month',
                year: 'This year vs last year',
            },
        },
        side: {
            total: 'Total',
            duration: '{count} h',
            rxShare: 'RX share',
        },
        table: {
            columns: {
                period: 'Period',
                periodHour: 'Time',
                periodDay: 'Date',
                received: 'Received',
                sent: 'Sent',
                total: 'Total',
                avgSpeed: 'Avg speed',
            },
        },
        insights: {
            day: {
                avgWithCompare:
                    'Daily avg over the last {days} day: {avg}, {change}% vs the prior {days} day | Daily avg over the last {days} days: {avg}, {change}% vs the prior {days} days',
                avgOnly: 'Daily avg over the last {days} day: {avg} | Daily avg over the last {days} days: {avg}',
                peak: 'Peak day {date} ({size})',
            },
            hour: {
                peakSingle: 'Peak at {start}, {share}% of the day',
                peakBand: 'Peak hours {start}–{end}, {share}% of the day',
                recent: 'Last 24h total {total}, {ratio}x the historical daily average',
                recentWithSpeed: 'Last 24h total {total}, avg speed {speed}, {ratio}x the historical daily average',
            },
            month: {
                projection: 'Daily avg this month {avg}; projected month-end total {projected}',
                pastTotal: 'Total for {month}: {total}',
                peak: 'Peak month: {month} ({size})',
            },
            year: {
                insufficient: 'Not enough yearly data yet for a reliable year-over-year comparison',
                compare: '{year} recorded {total}, {change}% vs the previous year',
                recorded: '{year} recorded {total}',
            },
        },
        record: {
            title: 'Today {today} / record {record} · {percent}%',
            reached: 'Record matched',
            remaining: '{remaining} left to reach the record',
        },
        quota: {
            thisMonth: 'This month',
            used: '{month}: {used} / {quota} GiB · {percent}%',
            notSet: 'No monthly traffic quota set',
            adjust: 'Adjust quota',
            set: 'Set quota',
            panelTitle: 'Monthly traffic quota',
            inputLabel: 'Monthly quota amount',
            placeholder: 'Leave blank to remove the quota',
            clear: 'Clear',
            stateSet: 'Set to {quota} GiB',
            stateUnset: 'Not set',
            projection: 'Projected month-end total {projected}',
            projectionWithPercent: 'Projected {projected} by month end ({percent}% of quota)',
        },
        calendar: {
            title: 'Traffic over the last year',
        },
        hourly: {
            profileTitle: '24-hour profile',
            weekHourTitle: 'Weekday × hour distribution',
        },
        yearCompare: {
            title: 'Year comparison',
        },
        peakStrip: {
            label: 'Peak hours',
        },
    },

    /** Live monitoring page: header, chart area, sidebar, bottom cards, uPlot tooltips. */
    live: {
        header: {
            rxLabel: 'RX',
            txLabel: 'TX',
            todayTotal: "Today's total",
            samples: '{count} sample | {count} samples',
        },
        compact: {
            title: 'Last 24 hours',
            total: 'Total',
            bandwidthUsage: 'Bandwidth usage',
        },
        chart: {
            title: 'Live rate',
            historyHint: 'Drag the timeline to replay the last 48 hours',
            thresholdTitle: 'Rate threshold',
            thresholdLabel: 'Rate threshold value',
            thresholdSet: 'Set rate threshold',
            thresholdActive: 'Rate threshold: {value} Mbps (click to set)',
            thresholdPlaceholder: 'Leave empty to disable',
            thresholdClear: 'Clear',
            thresholdOn: 'Enabled {value} Mbps',
            thresholdOff: 'Not set',
            replaying: 'Replaying',
            replayTag: 'Replay',
            historyTag: '48h',
            exitReplay: 'Back to live',
            replayTimeline: 'Replay timeline',
            liveTag: 'Live',
            connecting: 'Connecting…',
        },
        sidebar: {
            peak: 'Peak rate',
            trough: 'Trough rate',
            at: 'at {time}',
            fiveMinTotal: '5-min total',
            uptime: 'Uptime',
            days: '{count} day | {count} days',
            since: 'since {date}',
            monthlyTotal: 'This month / total',
            today: 'today',
        },
        bottom: {
            packetRate: 'Packet rate',
            trendTitle: 'Last 3 hours',
            top5Title: 'Top 5 days',
            noData: 'No data',
            ppsTooltip: '{label}: {value} PPS',
        },
        axis: {
            now: 'now',
        },
        tooltip: {
            rxRow: 'RX {value}',
            txRow: 'TX {value}',
        },
    },

    /** About page copy (hero, highlights, pipeline, bottom card). */
    about: {
        hero: {
            subtitle: 'Modern network traffic monitoring dashboard',
            badgeOpenSource: 'Open Source',
            toolName: 'vnStat',
            description:
                'vnStat Web is a web frontend for the {tool} traffic monitor, with real-time monitoring, historical charts from hourly to yearly, and multi-interface management in one place. The backend is written in Rust and streams per-second updates over SSE.',
        },
        highlights: {
            sectionTitle: 'Core capabilities',
            realtime: {
                label: 'Real-time monitoring',
                desc: 'SSE push, updated every second',
            },
            history: {
                label: 'Historical stats',
                desc: 'Hourly, daily, monthly and yearly views',
            },
            multiInterface: {
                label: 'Multi-interface',
                desc: 'Switch between monitored interfaces',
            },
            darkTheme: {
                label: 'Dark theme',
                desc: 'Follow the system or switch manually',
            },
        },
        pipeline: {
            sectionTitle: 'Data pipeline',
            daemon: {
                label: 'vnStat daemon',
                desc: 'Kernel interface counter collection',
            },
            backend: {
                label: 'Rust backend',
                desc: 'High-performance API service',
            },
            channel: {
                label: 'SSE real-time channel',
                desc: 'Per-second server push',
            },
            panel: {
                label: 'Web panel',
                desc: 'In-browser visualization',
            },
        },
        bottomCard: {
            sectionFeatures: 'Features',
            sectionTech: 'Tech stack',
            sectionLinks: 'Related links',
            sectionCredits: 'Credits',
            groupRealtime: 'Real-time & monitoring',
            features: {
                monitoring: {
                    desc: 'Real-time interface rates and traffic overview',
                },
                overview: {
                    desc: 'Unified multi-interface management',
                },
                autoRefresh: {
                    label: 'Auto refresh',
                    desc: 'Fetches the latest data every minute',
                },
                hourly: {
                    desc: 'Hourly traffic distribution',
                },
                daily: {
                    desc: 'Daily traffic trends',
                },
                monthly: {
                    desc: 'Monthly traffic overview',
                },
                yearly: {
                    desc: 'Yearly traffic trends',
                },
                top: {
                    desc: 'Top N traffic periods',
                },
            },
            link: {
                frontend: 'Frontend source',
                backend: 'Backend source',
                issues: 'Report issues',
                official: 'vnStat website',
            },
            credits:
                'Thanks to the open-source projects Vue 3, Chart.js, Pinia and Vite, and to {vnstat} author Teemu Toivonen for years of maintenance.',
        },
    },

    /** Top-traffic ranking page. */
    top: {
        metrics: {
            records: 'Records',
            counterSuffix: '',
            totalTraffic: 'Total traffic',
            peakShare: 'Peak share',
        },
        chart: {
            title: 'Traffic ranking',
            hint: 'Top {n} of {total}',
            meanLine: 'Mean',
        },
        donut: {
            title: 'Traffic breakdown',
        },
        side: {
            details: 'Details',
            count: 'Records',
            rxShare: 'RX share',
        },
        table: {
            title: 'Ranking details',
            hint: 'Sorted by total traffic, descending',
            rank: 'Rank',
        },
        columns: {
            date: 'Date',
            total: 'Total',
            avgSpeed: 'Avg speed',
        },
    },

    /** Toasts from the interface catalog (refresh / load failures). */
    catalog: {
        refreshed: 'Data refreshed',
        refreshFailed: 'Refresh failed',
        loadFailed: 'Failed to load interface information',
    },
};
