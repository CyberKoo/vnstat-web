/**
 * Traditional Chinese (Hong Kong) message catalog.
 *
 * Key structure must stay in sync with `zh-CN.ts` (the source of truth).
 * Phrasing follows Hong Kong UI conventions (介面 / 數據 / 載入 / 位元組),
 * and is the fallback target for every other Traditional Chinese variant
 * (zh-TW / zh-MO / any `zh-*-Hant` tag — see `resolveAppLocale`).
 *
 * Notes on structure:
 * - Composed sentences are written as whole messages with named or positional
 *   parameters. Word-by-word substitution is not valid across languages.
 * - Counters that only exist in CJK (the "個" after a total) live in their own
 *   key so other locales can leave them empty instead of forcing a noun.
 */
export default {
    common: {
        rx: '接收',
        tx: '傳送',
        retry: '重試',
        updated: '更新',
        /** 展示用日期/時間格式（dayjs token），隨語言切換 */
        format: {
            date: 'YYYY-MM-DD',
            time: 'HH:mm',
            timeSeconds: 'HH:mm:ss',
            dateTime: 'YYYY-MM-DD HH:mm',
            dateTimeShort: 'MM-DD HH:mm',
            monthDay: 'MM-DD',
            dateWeekday: 'YYYY-MM-DD ddd',
        },
    },

    overview: {
        /** Section title above the per-interface table (desktop and mobile) */
        detailSection: '介面明細',
        /** Metric band */
        metrics: {
            totalInterfaces: '介面總數',
            /** Counter suffix; empty in locales that have no CJK-style counter */
            counterSuffix: ' 個',
            totalRx: '累計接收',
            totalTx: '累計傳送',
        },
        /** Per-interface table column headers */
        columns: {
            name: '介面',
            alias: '別名',
            totalRx: '累計接收',
            totalTx: '累計傳送',
            todayRx: '今日接收',
            todayTx: '今日傳送',
            todayProgress: '今日進度',
            updated: '最後更新',
        },
        /** Mobile card */
        card: {
            shareOfTotal: '佔總量 {percent}%',
            totalRx: '累計接收',
            totalTx: '累計傳送',
            todayRx: '今日接收',
            todayTx: '今日傳送',
            updated: '更新',
        },
        /** Today's progress ring: tooltip and the text beside it */
        ring: {
            loading: '今日進度載入中',
            unavailable: '今日進度數據不可用',
            /** e.g. "今日 1.20 GiB / 日均 800 MiB · 今日均速 12.06 MiB/s" */
            detail: '今日 {today} / 日均 {avg} · 今日均速 {speed}',
            noHistory: '今日進度：歷史數據不足',
            reachedAvg: '已達日均 {percent}%',
            overAvg: '超日均',
            speed: '均速 {speed}',
            ariaNoData: '今日進度：無歷史數據',
            ariaReached: '今日已達日均 {percent}%',
        },
        /** All-interfaces aggregate trend chart */
        trend: {
            title: '全部介面 · 近 {days} 天趨勢',
            rx: '接收',
            tx: '傳送',
            loadFailed: '趨勢數據載入失敗',
            noData: '近 {days} 天暫無流量數據',
        },
        /** Interface total share bar */
        shareBar: {
            title: '介面總量佔比',
            total: '合計 {total}',
        },
        /** Toast on a failed refresh */
        fetchFailed: '獲取介面概況數據失敗',
    },

    /** Language names written in their own language (language switcher) */
    localeNames: {
        'zh-CN': '簡體中文',
        'zh-HK': '繁體中文',
        'en-US': 'English',
        'ja-JP': '日語',
        'ru-RU': '俄語',
        'de-DE': '德語',
        'es-ES': '西班牙語',
    },

    /** Top bar */
    header: {
        switchLanguage: '切換語言',
        unitBitsTitle: '速率單位：位元（Mbps），點擊切換為位元組',
        unitBytesTitle: '速率單位：位元組（MiB/s），點擊切換為位元',
        refreshing: '重新整理中…',
        refresh: '重新整理頁面',
        toLight: '切換為淺色模式',
        toDark: '切換為深色模式',
    },

    /** Sidebar menu labels (mirror the route table) */
    menu: {
        liveStats: '介面監控',
        trafficGroup: '流量統計',
        hourly: '每小時流量',
        daily: '每日流量',
        monthly: '每月流量',
        yearly: '年度流量',
        top: '流量排行榜',
        overview: '介面概況',
        about: '關於',
        notFound: '404 Not Found',
    },

    /** Layout chrome */
    layout: {
        expandSider: '展開側欄',
        collapseSider: '收起側欄',
        mainNav: '主導覽',
        skipToContent: '跳到主要內容',
        breadcrumb: '麵包屑導覽',
        interface: '介面',
    },

    /** 404 page */
    notFound: {
        title: '頁面未找到',
        desc: '你訪問的頁面不存在或已被刪除。',
        home: '返回首頁',
    },

    /**
     * Traffic period pages (Hourly / Daily / Monthly / Yearly).
     * Keys mirror PERIOD_CONFIGS in `src/config/trafficPeriods.ts`; a period
     * only has the keys for the cards it actually shows (hour has no `avg`,
     * day has no `peak`).
     */
    periods: {
        hour: {
            label: '小時',
            chartTitle: '流量趨勢',
            peak: '峰值小時',
            trend: '目前 vs 上一小時',
            sideAvg: '總時長',
            sidePeak: '峰值',
            /** 展示用日期/時間格式（dayjs token），隨語言切換 */
            format: {
                tooltip: 'YYYY-MM-DD HH:00',
                chart: 'HH:00',
                tablePeriod: 'HH:00',
                tableDateLabel: 'YYYY-MM-DD',
            },
        },
        day: {
            label: '天',
            chartTitle: '流量趨勢',
            avg: '日均流量',
            trend: '今日 vs 昨日',
            sideAvg: '日均',
            sidePeak: '峰值日',
            /** 展示用日期/時間格式（dayjs token），隨語言切換 */
            format: {
                tooltip: 'YYYY-MM-DD',
                chart: 'MM-DD',
                tablePeriod: 'MM-DD',
                tableDateLabel: 'YYYY-MM',
            },
        },
        month: {
            label: '月',
            chartTitle: '逐月對比',
            avg: '月均流量',
            peak: '峰值月',
            trend: '本月 vs 上月',
            sideAvg: '月均',
            sidePeak: '峰值月',
            /** 展示用日期/時間格式（dayjs token），隨語言切換 */
            format: {
                tooltip: 'YYYY-MM',
                chart: 'YYYY-MM',
                tablePeriod: 'MM',
                tableDateLabel: 'YYYY',
            },
        },
        year: {
            label: '年',
            chartTitle: '逐月對比',
            avg: '年均流量',
            peak: '峰值年',
            trend: '本年 vs 上年',
            sideAvg: '年均',
            sidePeak: '峰值年',
            /** 展示用日期/時間格式（dayjs token），隨語言切換 */
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
        trafficWithUnit: '流量 ({unit})',
        ghostLine: '前期對比',
        avgLine: '歷史同時段均值',
        movingAverage: '{days} 日移動平均',
        lastWeek: '上周同期',
        rxCumulative: '接收累計',
        txCumulative: '傳送累計',
        tooltipValue: '{label}: {value}',
        tooltipNoData: '{label}: --',
        cumulativeTip: '{label}: {total}（本期 {current}）',
        yoy: {
            breakdownTip: '{label}: {total}（接收 {rx} · 傳送 {tx}）',
            cumulativeTip: '{label}: {total}（本月 {current}）',
            changeTip: '同比 {year}：{percent}',
            inProgress: '本月進行中',
        },
        mode: {
            label: '圖表模式',
            bar: '柱狀',
            area: '面積',
            cumulative: '累計',
        },
        panel: {
            composition: '流量構成',
            details: '詳情',
        },
        table: {
            detailTitle: '數據明細',
        },
        heatmap: {
            less: '少',
            more: '多',
            cellTip: '{date}\n接收：{rx}\n傳送：{tx}\n合計：{total}',
        },
        legend: {
            low: '低',
            high: '高',
        },
        hourlyProfile: {
            aria: '24 小時時段流量圖',
            cellTip: '{time} · 平均 {avg}',
            cellTipToday: '{time} · 平均 {avg} · 今日 {today}',
            hoverHint: '滑鼠懸停查看今日實際數值',
        },
        weekHour: {
            aria: '星期×小時流量熱力矩陣',
            cellTip: '{weekday} {time} · {total}',
        },
        yearCard: {
            inProgress: '進行中',
            yoy: '同比 {percent}',
            monthlyAvg: '月均 {value}',
            peak: '峰值 {month} {value}',
            rxShare: '接收 {percent}%',
        },
    },

    /**
     * Traffic period pages: stat cards, side panel, record vs. today,
     * monthly quota, insights and the period table.
     */
    period: {
        format: {
            month: 'YYYY 年 M 月',
        },
        stats: {
            total: {
                hour: '24h 總流量',
                day: '{count} 天總流量',
                month: '{count} 個月總流量',
                year: '{count} 年總流量',
            },
            compareLabel: '較上一週期',
        },
        compare: {
            window: {
                hour: '近 24h vs 前 24h',
                day: '近 7 天 vs 前 7 天',
                month: '本月 vs 上月',
                year: '本年 vs 上年',
            },
        },
        side: {
            total: '週期總量',
            duration: '{count} 小時',
            rxShare: '接收佔比',
        },
        table: {
            columns: {
                period: '週期',
                periodHour: '時段',
                periodDay: '日期',
                received: '接收流量',
                sent: '傳送流量',
                total: '總計',
                avgSpeed: '平均速率',
            },
        },
        insights: {
            day: {
                avgWithCompare: '近 {days} 天日均 {avg}，較之前 {days} 天 {change}%',
                avgOnly: '近 {days} 天日均 {avg}',
                peak: '最高日 {date}（{size}）',
            },
            hour: {
                peakSingle: '高峰出現在 {start}，佔全天 {share}%',
                peakBand: '高峰集中在 {start}–{end}，佔全天 {share}%',
                recent: '最近 24h 總流量 {total}，為歷史日均的 {ratio} 倍',
                recentWithSpeed: '最近 24h 總流量 {total}，平均速率 {speed}，為歷史日均的 {ratio} 倍',
            },
            month: {
                projection: '本月日均 {avg}，按此節奏月末預計 {projected}',
                pastTotal: '{month}共產生 {total}',
                peak: '流量最高為 {month}（{size}）',
            },
            year: {
                insufficient: '年度數據積累不足，暫無法進行可靠的年度對比',
                compare: '{year} 年已記錄 {total}，較上一年 {change}%',
                recorded: '{year} 年已記錄 {total}',
            },
        },
        record: {
            title: '今日 {today} / 紀錄 {record} · {percent}%',
            reached: '已追平歷史最高紀錄',
            remaining: '距離紀錄還差 {remaining}',
        },
        quota: {
            thisMonth: '本月',
            used: '{month}已用 {used} / {quota} GiB · {percent}%',
            notSet: '未設定月度流量配額',
            adjust: '調整配額',
            set: '設定配額',
            panelTitle: '月度流量配額',
            inputLabel: '月度配額數值',
            placeholder: '留空移除配額',
            clear: '清除',
            stateSet: '已設定 {quota} GiB',
            stateUnset: '未設定',
            projection: '預計月末 {projected}',
            projectionWithPercent: '預計月末 {projected}（配額的 {percent}%）',
        },
        calendar: {
            title: '近一年流量分佈',
        },
        hourly: {
            profileTitle: '24 小時時段畫像',
            weekHourTitle: '星期 × 時段分佈',
        },
        yearCompare: {
            title: '年度對比',
        },
        peakStrip: {
            label: '峰值時段',
        },
    },

    /** Live monitoring page: header, chart area, sidebar, bottom cards, uPlot tooltips. */
    live: {
        header: {
            rxLabel: '接收 · RX',
            txLabel: '傳送 · TX',
            todayTotal: '今日 · 累計',
            samplesSuffix: '條採樣',
        },
        compact: {
            title: '24 小時概覽',
            total: '合計',
            bandwidthUsage: '頻寬使用率',
        },
        chart: {
            title: '實時速率',
            historyHint: '拖動時間軸可回放近 48 小時的歷史數據',
            thresholdTitle: '速率警戒線',
            thresholdLabel: '速率警戒值',
            thresholdSet: '設定速率警戒線',
            thresholdActive: '速率警戒線：{value} Mbps（點擊設定）',
            thresholdPlaceholder: '留空關閉',
            thresholdClear: '清除',
            thresholdOn: '已開啟 {value} Mbps',
            thresholdOff: '未開啟',
            replaying: '回放中',
            replayTag: '回放',
            historyTag: '48 小時',
            exitReplay: '返回實時',
            replayTimeline: '回放時間軸',
            liveTag: '實時',
            connecting: '連線中…',
        },
        sidebar: {
            peak: '峰值速率',
            trough: '低谷速率',
            at: '於 {time}',
            fiveMinTotal: '5 分鐘累計',
            uptime: '運行時長',
            days: '{count} 天',
            since: '自 {date}',
            monthlyTotal: '月流量 / 累計',
            today: '今日',
        },
        bottom: {
            packetRate: '封包速率',
            trendTitle: '近 3 小時趨勢',
            top5Title: '日流量排行 Top 5',
            noData: '暫無數據',
            ppsTooltip: '{label}: {value} PPS',
        },
        axis: {
            now: '現在',
        },
        tooltip: {
            rxRow: '接收 {value}',
            txRow: '傳送 {value}',
        },
    },

    /** About page copy (hero, highlights, pipeline, bottom card). */
    about: {
        hero: {
            subtitle: '現代化網絡流量監控面板',
            badgeOpenSource: '開源',
            toolName: 'vnStat',
            description:
                'vnStat Web 是 {tool} 流量統計工具的 Web 前端，提供實時監控、多維度歷史流量圖表與多介面統一管理。後端以 Rust 編寫，透過 SSE 秒級推送數據。',
        },
        highlights: {
            sectionTitle: '核心能力',
            realtime: {
                label: '實時監控',
                desc: 'SSE 推送，秒級更新',
            },
            history: {
                label: '歷史統計',
                desc: '小時、日、月、年多維度',
            },
            multiInterface: {
                label: '多介面',
                desc: '按需切換監控介面',
            },
            darkTheme: {
                label: '深色主題',
                desc: '跟隨系統或手動切換',
            },
        },
        pipeline: {
            sectionTitle: '數據鏈路',
            daemon: {
                label: 'vnStat 守護進程',
                desc: '核心網卡計數採集',
            },
            backend: {
                label: 'Rust 後端',
                desc: '高效能 API 服務',
            },
            channel: {
                label: 'SSE 實時通道',
                desc: '秒級伺服器推送',
            },
            panel: {
                label: 'Web 面板',
                desc: '瀏覽器端可視化',
            },
        },
        bottomCard: {
            sectionFeatures: '功能特性',
            sectionTech: '技術棧',
            sectionLinks: '相關連結',
            sectionCredits: '鳴謝',
            groupRealtime: '實時與監控',
            features: {
                monitoring: {
                    desc: '介面實時速率與流量概覽',
                },
                overview: {
                    desc: '多介面統一管理',
                },
                autoRefresh: {
                    label: '自動重新整理',
                    desc: '每分鐘自動獲取最新數據',
                },
                hourly: {
                    desc: '按小時統計流量分佈',
                },
                daily: {
                    desc: '按日統計流量趨勢',
                },
                monthly: {
                    desc: '按月統計流量概況',
                },
                yearly: {
                    desc: '按年統計流量趨勢',
                },
                top: {
                    desc: 'Top N 最大流量時段',
                },
            },
            link: {
                frontend: '前端原始碼',
                backend: '後端原始碼',
                issues: '問題回報',
                official: 'vnStat 官方網站',
            },
            credits: '感謝 Vue 3、Chart.js、Pinia、Vite 等開源項目，以及 {vnstat} 作者 Teemu Toivonen 的長期維護。',
        },
    },

    /** Top-traffic ranking page. */
    top: {
        metrics: {
            records: '統計記錄',
            counterSuffix: '條',
            totalTraffic: '總流量',
            peakShare: '峰值佔比',
        },
        chart: {
            title: '流量排行',
            hint: '前 {n} 名 · 共 {total} 條',
            meanLine: '平均值',
        },
        donut: {
            title: '流量構成',
        },
        side: {
            details: '詳情',
            count: '記錄數',
            rxShare: '接收佔比',
        },
        table: {
            title: '排行明細',
            hint: '按總流量降序',
            rank: '排名',
        },
        columns: {
            date: '日期',
            total: '總計',
            avgSpeed: '平均速率',
        },
    },

    /** Toasts from the interface catalog (refresh / load failures). */
    catalog: {
        refreshed: '數據已重新整理',
        refreshFailed: '重新整理失敗',
        loadFailed: '獲取介面資訊失敗',
    },
};
