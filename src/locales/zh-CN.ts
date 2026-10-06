/**
 * Simplified Chinese message catalog.
 *
 * Key structure and interpolation parameters stay in sync across all catalogs.
 * Keys are grouped by view, then by the region of the UI they belong to.
 *
 * Notes on structure:
 * - Composed sentences are written as whole messages with named or positional
 *   parameters. Word-by-word substitution is not valid across languages.
 * - Counters that only exist in CJK (the "个" after a total) live in their own
 *   key so other locales can leave them empty instead of forcing a noun.
 */
export default {
    common: {
        rx: '接收',
        tx: '发送',
        retry: '重试',
        updated: '更新',
        /** 展示用日期/时间格式（dayjs token），随语言切换 */
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
        detailSection: '接口明细',
        /** Metric band */
        metrics: {
            totalInterfaces: '接口总数',
            /** Counter suffix; empty in locales that have no CJK-style counter */
            counterSuffix: ' 个',
            totalRx: '累计接收',
            totalTx: '累计发送',
        },
        /** Per-interface table column headers */
        columns: {
            name: '接口',
            alias: '别名',
            totalRx: '累计接收',
            totalTx: '累计发送',
            todayRx: '今日接收',
            todayTx: '今日发送',
            todayProgress: '今日进度',
            updated: '最后更新',
        },
        /** Mobile card */
        card: {
            shareOfTotal: '占总量 {percent}%',
            totalRx: '累计接收',
            totalTx: '累计发送',
            todayRx: '今日接收',
            todayTx: '今日发送',
            updated: '更新',
        },
        /** Today's progress ring: tooltip and the text beside it */
        ring: {
            loading: '今日进度加载中',
            unavailable: '今日进度数据不可用',
            /** e.g. "Today 1.20 GiB / Daily avg 800 MiB · Today's avg speed 12.06 MiB/s" */
            detail: '今日 {today} / 日均 {avg} · 今日均速 {speed}',
            noHistory: '今日进度：历史数据不足',
            reachedAvg: '已达日均 {percent}%',
            overAvg: '超日均',
            speed: '均速 {speed}',
            ariaNoData: '今日进度：无历史数据',
            ariaReached: '今日已达日均 {percent}%',
        },
        /** All-interfaces aggregate trend chart */
        trend: {
            title: '全部接口 · 近 {days} 天趋势',
            rx: '接收',
            tx: '发送',
            loadFailed: '趋势数据加载失败',
            noData: '近 {days} 天暂无流量数据',
        },
        /** Interface total share bar */
        shareBar: {
            title: '接口总量占比',
            total: '合计 {total}',
        },
        /** Toast on a failed refresh */
        fetchFailed: '获取接口概况数据失败',
    },

    /** Language names written in their own language (language switcher) */
    localeNames: {
        'zh-CN': '简体中文',
        'zh-HK': '繁體中文',
        'en-US': 'English',
        'ja-JP': '日语',
        'ru-RU': '俄语',
        'de-DE': '德语',
        'es-ES': '西班牙语',
    },

    /** Top bar */
    header: {
        switchLanguage: '切换语言',
        unitBitsTitle: '速率单位：比特（Mbps），点击切换为字节',
        unitBytesTitle: '速率单位：字节（MiB/s），点击切换为比特',
        refreshing: '刷新中…',
        refresh: '刷新页面',
        toLight: '切换为浅色模式',
        toDark: '切换为深色模式',
    },

    /** Sidebar menu labels (mirror the route table) */
    menu: {
        liveStats: '接口监控',
        trafficGroup: '流量统计',
        hourly: '每小时流量',
        daily: '每日流量',
        monthly: '每月流量',
        yearly: '年度流量',
        top: '流量排行榜',
        overview: '接口概况',
        about: '关于',
        notFound: '404 Not Found',
    },

    /** Layout chrome */
    layout: {
        expandSider: '展开侧栏',
        collapseSider: '收起侧栏',
        mainNav: '主导航',
        skipToContent: '跳到主要内容',
        breadcrumb: '面包屑导航',
        interface: '接口',
    },

    /** 404 page */
    notFound: {
        title: '页面未找到',
        desc: '你访问的页面不存在或已被删除。',
        home: '返回首页',
    },

    /**
     * Traffic period pages (Hourly / Daily / Monthly / Yearly).
     * Keys mirror PERIOD_CONFIGS in `src/config/trafficPeriods.ts`; a period
     * only has the keys for the cards it actually shows (hour has no `avg`,
     * day has no `peak`).
     */
    periods: {
        hour: {
            label: '小时',
            chartTitle: '流量趋势',
            peak: '峰值小时',
            trend: '当前 vs 上一小时',
            sideAvg: '总时长',
            sidePeak: '峰值',
            /** 展示用日期/时间格式（dayjs token），随语言切换 */
            format: {
                tooltip: 'YYYY-MM-DD HH:00',
                chart: 'HH:00',
                tablePeriod: 'HH:00',
                tableDateLabel: 'YYYY-MM-DD',
            },
        },
        day: {
            label: '天',
            chartTitle: '流量趋势',
            avg: '日均流量',
            trend: '今日 vs 昨日',
            sideAvg: '日均',
            sidePeak: '峰值日',
            /** 展示用日期/时间格式（dayjs token），随语言切换 */
            format: {
                tooltip: 'YYYY-MM-DD',
                chart: 'MM-DD',
                tablePeriod: 'MM-DD',
                tableDateLabel: 'YYYY-MM',
            },
        },
        month: {
            label: '月',
            chartTitle: '逐月对比',
            avg: '月均流量',
            peak: '峰值月',
            trend: '本月 vs 上月',
            sideAvg: '月均',
            sidePeak: '峰值月',
            /** 展示用日期/时间格式（dayjs token），随语言切换 */
            format: {
                tooltip: 'YYYY-MM',
                chart: 'YYYY-MM',
                tablePeriod: 'MM',
                tableDateLabel: 'YYYY',
            },
        },
        year: {
            label: '年',
            chartTitle: '逐月对比',
            avg: '年均流量',
            peak: '峰值年',
            trend: '本年 vs 上年',
            sideAvg: '年均',
            sidePeak: '峰值年',
            /** 展示用日期/时间格式（dayjs token），随语言切换 */
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
        ghostLine: '前期对比',
        avgLine: '历史同时段均值',
        movingAverage: '{days} 日移动平均',
        lastWeek: '上周同期',
        rxCumulative: '接收累计',
        txCumulative: '发送累计',
        tooltipValue: '{label}: {value}',
        tooltipNoData: '{label}: --',
        cumulativeTip: '{label}: {total}（本期 {current}）',
        yoy: {
            breakdownTip: '{label}: {total}（接收 {rx} · 发送 {tx}）',
            cumulativeTip: '{label}: {total}（本月 {current}）',
            changeTip: '同比 {year}：{percent}',
            inProgress: '本月进行中',
        },
        mode: {
            label: '图表模式',
            bar: '柱状',
            area: '面积',
            cumulative: '累计',
        },
        panel: {
            composition: '流量构成',
            details: '详情',
        },
        table: {
            detailTitle: '数据明细',
        },
        heatmap: {
            less: '少',
            more: '多',
            cellTip: '{date}\n接收：{rx}\n发送：{tx}\n合计：{total}',
        },
        legend: {
            low: '低',
            high: '高',
        },
        hourlyProfile: {
            aria: '24 小时时段流量画像',
            cellTip: '{time} · 平均 {avg}',
            cellTipToday: '{time} · 平均 {avg} · 今日 {today}',
            hoverHint: '悬停查看今日实际值',
        },
        weekHour: {
            aria: '星期×小时流量热力矩阵',
            cellTip: '{weekday} {time} · {total}',
        },
        yearCard: {
            inProgress: '进行中',
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
                hour: '24h 总流量',
                day: '{count} 天总流量',
                month: '{count} 个月总流量',
                year: '{count} 年总流量',
            },
            compareLabel: '较上一周期',
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
            total: '周期总量',
            duration: '{count} 小时',
            rxShare: '接收占比',
        },
        table: {
            columns: {
                period: '周期',
                periodHour: '时段',
                periodDay: '日期',
                received: '接收流量',
                sent: '发送流量',
                total: '总计',
                avgSpeed: '平均速率',
            },
        },
        insights: {
            day: {
                avgWithCompare: '近 {days} 天日均 {avg}，较之前 {days} 天 {change}%',
                avgOnly: '近 {days} 天日均 {avg}',
                peak: '最高日 {date}（{size}）',
            },
            hour: {
                peakSingle: '高峰出现在 {start}，占全天 {share}%',
                peakBand: '高峰集中在 {start}–{end}，占全天 {share}%',
                recent: '最近 24h 总流量 {total}，为历史日均的 {ratio} 倍',
                recentWithSpeed: '最近 24h 总流量 {total}，平均速率 {speed}，为历史日均的 {ratio} 倍',
            },
            month: {
                projection: '本月日均 {avg}，按此节奏月末预计 {projected}',
                pastTotal: '{month}共产生 {total}',
                peak: '流量最高为 {month}（{size}）',
            },
            year: {
                insufficient: '年度数据积累不足，暂无法进行可靠的年度对比',
                compare: '{year} 年已记录 {total}，较上一年 {change}%',
                recorded: '{year} 年已记录 {total}',
            },
        },
        record: {
            title: '今日 {today} / 纪录 {record} · {percent}%',
            reached: '已追平历史最高纪录',
            remaining: '距离纪录还差 {remaining}',
        },
        quota: {
            thisMonth: '本月',
            used: '{month}已用 {used} / {quota} GiB · {percent}%',
            notSet: '未设置月度流量配额',
            adjust: '调整配额',
            set: '设置配额',
            panelTitle: '月度流量配额',
            inputLabel: '月度配额数值',
            placeholder: '留空移除配额',
            clear: '清除',
            stateSet: '已设置 {quota} GiB',
            stateUnset: '未设置',
            projection: '预计月末 {projected}',
            projectionWithPercent: '预计月末 {projected}（配额的 {percent}%）',
        },
        calendar: {
            title: '近一年流量分布',
        },
        hourly: {
            profileTitle: '24 小时时段画像',
            weekHourTitle: '星期 × 时段分布',
        },
        yearCompare: {
            title: '年度对比',
        },
        peakStrip: {
            label: '峰值时段',
        },
    },

    /** Live monitoring page: header, chart area, sidebar, bottom cards, uPlot tooltips. */
    live: {
        header: {
            rxLabel: '接收 · RX',
            txLabel: '发送 · TX',
            todayTotal: '今日 · 累计',
            samples: '{count} 条采样',
        },
        compact: {
            title: '24 小时概览',
            total: '合计',
            bandwidthUsage: '带宽利用率',
        },
        chart: {
            title: '实时速率',
            historyHint: '拖动时间轴可回放近 48 小时的历史数据',
            thresholdTitle: '速率警戒线',
            thresholdLabel: '速率警戒值',
            thresholdSet: '设置速率警戒线',
            thresholdActive: '速率警戒线：{value} Mbps（点击设置）',
            thresholdPlaceholder: '留空关闭',
            thresholdClear: '清除',
            thresholdOn: '已开启 {value} Mbps',
            thresholdOff: '未开启',
            replaying: '回放中',
            replayTag: '回放',
            historyTag: '48 小时',
            exitReplay: '返回实时',
            replayTimeline: '回放时间轴',
            liveTag: '实时',
            connecting: '连接中…',
        },
        sidebar: {
            peak: '峰值速率',
            trough: '低谷速率',
            at: '于 {time}',
            fiveMinTotal: '5 分钟累计',
            uptime: '运行时长',
            days: '{count} 天',
            since: '自 {date}',
            monthlyTotal: '月流量 / 累计',
            today: '今日',
        },
        bottom: {
            packetRate: '包速率',
            trendTitle: '近 3 小时趋势',
            top5Title: '日流量排行 Top 5',
            noData: '暂无数据',
            ppsTooltip: '{label}: {value} PPS',
        },
        axis: {
            now: '现在',
        },
        tooltip: {
            rxRow: '接收 {value}',
            txRow: '发送 {value}',
        },
    },

    /** About page copy (hero, highlights, pipeline, bottom card). */
    about: {
        hero: {
            subtitle: '现代化网络流量监控面板',
            badgeOpenSource: '开源',
            toolName: 'vnStat',
            description:
                'vnStat Web 是 {tool} 流量统计工具的 Web 前端，提供实时监控、多维度历史流量图表与多接口统一管理。后端基于 Rust，通过 SSE 秒级推送数据。',
        },
        highlights: {
            sectionTitle: '核心能力',
            realtime: {
                label: '实时监控',
                desc: 'SSE 推送，秒级更新',
            },
            history: {
                label: '历史统计',
                desc: '小时、日、月、年多维度',
            },
            multiInterface: {
                label: '多接口',
                desc: '按需切换监控接口',
            },
            darkTheme: {
                label: '深色主题',
                desc: '跟随系统或手动切换',
            },
        },
        pipeline: {
            sectionTitle: '数据链路',
            daemon: {
                label: 'vnStat 守护进程',
                desc: '内核网卡计数采集',
            },
            backend: {
                label: 'Rust 后端',
                desc: '高性能 API 服务',
            },
            channel: {
                label: 'SSE 实时通道',
                desc: '秒级服务端推送',
            },
            panel: {
                label: 'Web 面板',
                desc: '浏览器端可视化',
            },
        },
        bottomCard: {
            sectionFeatures: '功能特性',
            sectionTech: '技术栈',
            sectionLinks: '相关链接',
            sectionCredits: '鸣谢',
            groupRealtime: '实时与监控',
            features: {
                monitoring: {
                    desc: '接口实时速率与流量概览',
                },
                overview: {
                    desc: '多接口统一管理',
                },
                autoRefresh: {
                    label: '自动刷新',
                    desc: '每分钟自动拉取最新数据',
                },
                hourly: {
                    desc: '按小时统计流量分布',
                },
                daily: {
                    desc: '按日统计流量趋势',
                },
                monthly: {
                    desc: '按月统计流量概况',
                },
                yearly: {
                    desc: '按年统计流量趋势',
                },
                top: {
                    desc: 'Top N 最大流量时段',
                },
            },
            link: {
                frontend: '前端源码',
                backend: '后端源码',
                issues: '问题反馈',
                official: 'vnStat 官网',
            },
            credits: '感谢 Vue 3、Chart.js、Pinia、Vite 等开源项目，以及 {vnstat} 作者 Teemu Toivonen 的长期维护。',
        },
    },

    /** Top-traffic ranking page. */
    top: {
        metrics: {
            records: '统计记录',
            counterSuffix: '条',
            totalTraffic: '总流量',
            peakShare: '峰值占比',
        },
        chart: {
            title: '流量排行',
            hint: '前 {n} 名 · 共 {total} 条',
            meanLine: '均值',
        },
        donut: {
            title: '流量构成',
        },
        side: {
            details: '详情',
            count: '记录数',
            rxShare: '接收占比',
        },
        table: {
            title: '排行明细',
            hint: '按总流量降序',
            rank: '排名',
        },
        columns: {
            date: '日期',
            total: '总计',
            avgSpeed: '平均速率',
        },
    },

    /** Toasts from the interface catalog (refresh / load failures). */
    catalog: {
        refreshed: '数据已刷新',
        refreshFailed: '刷新失败',
        loadFailed: '获取接口信息失败',
    },
};
