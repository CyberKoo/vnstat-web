/**
 * 日本語メッセージカタログ。
 *
 * キー構造は `zh-CN.ts`（正本）と同期させること。
 *
 * 構造に関する注記:
 * - 複合文はパラメータを含む完全なメッセージ。語順は中国語とは異なるため、
 *   断片の組み合わせではなく丸ごとのメッセージとして扱う。
 * - `counterSuffix` は日本語に CJK 風の助数詞カウンタがないため空文字列。
 * - `detail` は中国語の「今日 X / 日均 Y · 今日均速 Z」を、語順と句読点を
 *   変えた日本語の文に分割している。
 */
export default {
    common: {
        rx: 'RX',
        tx: 'TX',
        retry: '再試行',
        updated: '更新',
        /** 表示用の日付/時刻フォーマット（dayjs トークン）。レンダリングされる時刻印は UI 言語に追従 */
        format: {
            date: 'YYYY年M月D日',
            time: 'H:mm',
            timeSeconds: 'H:mm:ss',
            dateTime: 'YYYY年M月D日 H:mm',
            dateTimeShort: 'M月D日 H:mm',
            monthDay: 'M月D日',
            dateWeekday: 'YYYY年M月D日 ddd',
        },
    },

    overview: {
        detailSection: 'インターフェース詳細',
        metrics: {
            totalInterfaces: 'インターフェース総数',
            counterSuffix: '',
            totalRx: '累計受信',
            totalTx: '累計送信',
        },
        columns: {
            name: 'インターフェース',
            alias: 'エイリアス',
            totalRx: '累計受信',
            totalTx: '累計送信',
            todayRx: '今日の受信',
            todayTx: '今日の送信',
            todayProgress: '今日の進捗',
            updated: '最終更新',
        },
        card: {
            shareOfTotal: '全体の {percent}%',
            totalRx: '累計受信',
            totalTx: '累計送信',
            todayRx: '今日の受信',
            todayTx: '今日の送信',
            updated: '更新',
        },
        ring: {
            loading: '今日の進捗を読み込み中',
            unavailable: '今日の進捗は利用できません',
            detail: '今日 {today} / 日平均 {avg} · 平均速度 {speed}',
            noHistory: '今日の進捗: 履歴データ不足',
            reachedAvg: '日平均の {percent}%',
            overAvg: '平均を超過',
            speed: '平均速度 {speed}',
            ariaNoData: '今日の進捗: 履歴データなし',
            ariaReached: '日平均の {percent}% に到達',
        },
        trend: {
            title: '全インターフェース · 過去 {days} 日',
            rx: 'RX',
            tx: 'TX',
            loadFailed: 'トレンドデータの読み込みに失敗しました',
            noData: '過去 {days} 日間のトラフィックはありません',
        },
        shareBar: {
            title: '総トラフィックの内訳',
            total: '合計 {total}',
        },
        fetchFailed: 'インターフェースの概要の読み込みに失敗しました',
    },

    /** 言語名は各言語での表記（言語切り替えメニュー用） */
    localeNames: {
        'zh-CN': '簡体中国語',
        'zh-HK': '繁体中国語',
        'en-US': '英語',
        'ja-JP': '日本語',
        'ru-RU': 'ロシア語',
        'de-DE': 'ドイツ語',
        'es-ES': 'スペイン語',
    },

    /** トップバー */
    header: {
        switchLanguage: '言語',
        unitBitsTitle: '速度単位: ビット (Mbps)、クリックでバイトに切り替え',
        unitBytesTitle: '速度単位: バイト (MiB/s)、クリックでビットに切り替え',
        refreshing: '更新中…',
        refresh: 'ページを更新',
        toLight: 'ライトモードに切り替え',
        toDark: 'ダークモードに切り替え',
    },

    /** サイドバーメニューのラベル（ルーティングテーブルと対応） */
    menu: {
        liveStats: 'リアルタイム監視',
        trafficGroup: 'トラフィック',
        hourly: '時間別',
        daily: '日別',
        monthly: '月別',
        yearly: '年別',
        top: 'トップトラフィック',
        overview: '概要',
        about: 'このアプリについて',
        notFound: '404 Not Found',
    },

    /** レイアウトの外枠 */
    layout: {
        expandSider: 'サイドバーを展開',
        collapseSider: 'サイドバーを折りたたむ',
        mainNav: 'メインナビゲーション',
        skipToContent: 'メインコンテンツへスキップ',
        breadcrumb: 'パンくずリスト',
        interface: 'インターフェース',
    },

    /** 404 ページ */
    notFound: {
        title: 'ページが見つかりません',
        desc: 'お探しのページは存在しないか、削除されました。',
        home: 'ホームに戻る',
    },

    /**
     * トラフィック期間ページ（時間別 / 日別 / 月別 / 年別）。
     * キーは `src/config/trafficPeriods.ts` の PERIOD_CONFIGS と対応。
     * 期間ごとに実際に表示するカードのキーのみを持つ
     * （hour は `avg` なし、day は `peak` なし）。
     */
    periods: {
        hour: {
            label: '時間',
            chartTitle: 'トラフィック推移',
            peak: 'ピーク時間帯',
            trend: '今時間 vs 前の時間',
            sideAvg: '合計時間',
            sidePeak: 'ピーク',
            /** 表示用の日付/時刻フォーマット（dayjs トークン）。レンダリングされる時刻印は UI 言語に追従 */
            format: {
                tooltip: 'YYYY年M月D日 H時',
                chart: 'H時',
                tablePeriod: 'H時',
                tableDateLabel: 'YYYY年M月D日',
            },
        },
        day: {
            label: '日',
            chartTitle: 'トラフィック推移',
            avg: '1日平均トラフィック',
            trend: '今日 vs 昨日',
            sideAvg: '日平均',
            sidePeak: 'ピーク日',
            /** 表示用の日付/時刻フォーマット（dayjs トークン）。レンダリングされる時刻印は UI 言語に追従 */
            format: {
                tooltip: 'YYYY年M月D日',
                chart: 'M月D日',
                tablePeriod: 'M月D日',
                tableDateLabel: 'YYYY年M月',
            },
        },
        month: {
            label: '月',
            chartTitle: '月次比較',
            avg: '月平均トラフィック',
            peak: 'ピーク月',
            trend: '今月 vs 先月',
            sideAvg: '月平均',
            sidePeak: 'ピーク月',
            /** 表示用の日付/時刻フォーマット（dayjs トークン）。レンダリングされる時刻印は UI 言語に追従 */
            format: {
                tooltip: 'YYYY年M月',
                chart: 'YYYY年M月',
                tablePeriod: 'M月',
                tableDateLabel: 'YYYY',
            },
        },
        year: {
            label: '年',
            chartTitle: '月次比較',
            avg: '年平均トラフィック',
            peak: 'ピーク年',
            trend: '今年 vs 昨年',
            sideAvg: '年平均',
            sidePeak: 'ピーク年',
            /** 表示用の日付/時刻フォーマット（dayjs トークン）。レンダリングされる時刻印は UI 言語に追従 */
            format: {
                tooltip: 'YYYY',
                chart: 'YYYY',
                tablePeriod: 'YYYY',
            },
        },
    },

    /**
     * グラフ用の文言: データセットラベル、ツールチップ、凡例、グラフの外枠。
     * periodChartData.ts の LABEL 定数がこれらのキーを保持する。
     */
    chart: {
        trafficWithUnit: 'トラフィック ({unit})',
        ghostLine: '前期間',
        avgLine: '過去平均',
        movingAverage: '{days}日移動平均',
        lastWeek: '先週の同日',
        rxCumulative: '累計 RX',
        txCumulative: '累計 TX',
        tooltipValue: '{label}: {value}',
        tooltipNoData: '{label}: --',
        cumulativeTip: '{label}: {total} (本期間 {current})',
        yoy: {
            breakdownTip: '{label}: {total} (RX {rx} · TX {tx})',
            cumulativeTip: '{label}: {total} (今月 {current})',
            changeTip: '前年比 {year}: {percent}',
            inProgress: '進行中',
        },
        mode: {
            label: 'グラフモード',
            bar: '棒グラフ',
            area: '面グラフ',
            cumulative: '累積',
        },
        panel: {
            composition: 'トラフィック構成',
            details: '詳細',
        },
        table: {
            detailTitle: 'データ詳細',
        },
        heatmap: {
            less: '少ない',
            more: '多い',
            cellTip: '{date}\nRX: {rx}\nTX: {tx}\n合計: {total}',
        },
        legend: {
            low: '低',
            high: '高',
        },
        hourlyProfile: {
            aria: '24時間トラフィックプロファイル',
            cellTip: '{time} · 平均 {avg}',
            cellTipToday: '{time} · 平均 {avg} · 今日 {today}',
            hoverHint: 'ホバーで今日の実測値を表示',
        },
        weekHour: {
            aria: '曜日 × 時間帯トラフィックヒートマップ',
            cellTip: '{weekday} {time} · {total}',
        },
        yearCard: {
            inProgress: '進行中',
            yoy: '前年比 {percent}',
            monthlyAvg: '月平均 {value}',
            peak: 'ピーク {month} {value}',
            rxShare: 'RX {percent}%',
        },
    },

    /**
     * トラフィック期間ページ: 統計カード、サイドパネル、記録 vs 今日、
     * 月間クォータ、インサイト、期間テーブル。
     */
    period: {
        format: {
            month: 'YYYY年M月',
        },
        stats: {
            total: {
                hour: '24時間合計',
                day: '{count}日合計',
                month: '{count}か月合計',
                year: '{count}年合計',
            },
            compareLabel: '前期間比',
        },
        compare: {
            window: {
                hour: '過去24時間 vs その前の24時間',
                day: '過去7日間 vs その前の7日間',
                month: '今月 vs 先月',
                year: '今年 vs 昨年',
            },
        },
        side: {
            total: '合計',
            duration: '{count} 時間',
            rxShare: 'RX 割合',
        },
        table: {
            columns: {
                period: '期間',
                periodHour: '時刻',
                periodDay: '日付',
                received: '受信',
                sent: '送信',
                total: '合計',
                avgSpeed: '平均速度',
            },
        },
        insights: {
            day: {
                avgWithCompare: '過去 {days} 日間の日平均: {avg}、前の {days} 日間比 {change}%',
                avgOnly: '過去 {days} 日間の日平均: {avg}',
                peak: 'ピーク日 {date} ({size})',
            },
            hour: {
                peakSingle: 'ピークは {start}、1日の {share}%',
                peakBand: 'ピーク時間帯 {start}–{end}、1日の {share}%',
                recent: '過去24時間の合計 {total}、過去の日平均の {ratio} 倍',
                recentWithSpeed: '過去24時間の合計 {total}、平均速度 {speed}、過去の日平均の {ratio} 倍',
            },
            month: {
                projection: '今月の日平均 {avg}、月末予測 {projected}',
                pastTotal: '{month}の合計: {total}',
                peak: 'ピーク月: {month} ({size})',
            },
            year: {
                insufficient: '前年比較には十分な年次データがありません',
                compare: '{year}は {total}、前年比 {change}%',
                recorded: '{year}は {total}',
            },
        },
        record: {
            title: '今日 {today} / 記録 {record} · {percent}%',
            reached: '記録と一致',
            remaining: '記録まで残り {remaining}',
        },
        quota: {
            thisMonth: '今月',
            used: '{month}: {used} / {quota} GiB · {percent}%',
            notSet: '月間トラフィッククォータが設定されていません',
            adjust: 'クォータを調整',
            set: 'クォータを設定',
            panelTitle: '月間トラフィッククォータ',
            inputLabel: '月間クォータ量',
            placeholder: '空白のままにするとクォータを解除します',
            clear: 'クリア',
            stateSet: '{quota} GiB に設定済み',
            stateUnset: '未設定',
            projection: '月末予測 {projected}',
            projectionWithPercent: '月末までに {projected} と予測 (クォータの {percent}%)',
        },
        calendar: {
            title: '過去1年間のトラフィック',
        },
        hourly: {
            profileTitle: '24時間プロファイル',
            weekHourTitle: '曜日 × 時間帯の分布',
        },
        yearCompare: {
            title: '年次比較',
        },
        peakStrip: {
            label: 'ピーク時間帯',
        },
    },

    /** リアルタイム監視ページ: ヘッダー、グラフエリア、サイドバー、下部カード、uPlot ツールチップ。 */
    live: {
        header: {
            rxLabel: 'RX',
            txLabel: 'TX',
            todayTotal: '今日の合計',
            samplesSuffix: 'サンプル',
        },
        compact: {
            title: '過去24時間',
            total: '合計',
            bandwidthUsage: '帯域使用率',
        },
        chart: {
            title: 'リアルタイムレート',
            historyHint: 'タイムラインをドラッグして過去48時間を再生',
            thresholdTitle: 'レートしきい値',
            thresholdLabel: 'レートしきい値',
            thresholdSet: 'レートしきい値を設定',
            thresholdActive: 'レートしきい値: {value} Mbps (クリックで設定)',
            thresholdPlaceholder: '空欄で無効化',
            thresholdClear: 'クリア',
            thresholdOn: '{value} Mbps で有効',
            thresholdOff: '未設定',
            replaying: '再生中',
            replayTag: '再生',
            historyTag: '48h',
            exitReplay: 'ライブに戻る',
            replayTimeline: '再生タイムライン',
            liveTag: 'ライブ',
            connecting: '接続中…',
        },
        sidebar: {
            peak: 'ピークレート',
            trough: '最小レート',
            at: '{time}時点',
            fiveMinTotal: '5分間合計',
            uptime: '稼働時間',
            days: '{count} 日',
            since: '{date} から',
            monthlyTotal: '今月 / 累計',
            today: '今日',
        },
        bottom: {
            packetRate: 'パケットレート',
            trendTitle: '過去3時間',
            top5Title: 'トップ5日間',
            noData: 'データなし',
            ppsTooltip: '{label}: {value} PPS',
        },
        axis: {
            now: '現在',
        },
        tooltip: {
            rxRow: 'RX {value}',
            txRow: 'TX {value}',
        },
    },

    /** About ページの文言（ヒーロー、ハイライト、パイプライン、下部カード）。 */
    about: {
        hero: {
            subtitle: 'モダンなネットワークトラフィック監視ダッシュボード',
            badgeOpenSource: 'オープンソース',
            toolName: 'vnStat',
            description:
                'vnStat Web は {tool} トラフィックモニタの Web フロントエンドで、リアルタイム監視、時間別から年次までの履歴グラフ、複数インターフェースの一元管理を一か所で提供します。バックエンドは Rust で書かれ、毎秒の更新を SSE でストリーミングします。',
        },
        highlights: {
            sectionTitle: '主要機能',
            realtime: {
                label: 'リアルタイム監視',
                desc: 'SSE プッシュ、1秒ごとに更新',
            },
            history: {
                label: '履歴統計',
                desc: '時間別・日別・月別・年別の表示',
            },
            multiInterface: {
                label: 'マルチインターフェース',
                desc: '監視対象インターフェースを切り替え',
            },
            darkTheme: {
                label: 'ダークテーマ',
                desc: 'システムに追従、または手動で切り替え',
            },
        },
        pipeline: {
            sectionTitle: 'データパイプライン',
            daemon: {
                label: 'vnStat デーモン',
                desc: 'カーネルインターフェースカウンタの収集',
            },
            backend: {
                label: 'Rust バックエンド',
                desc: '高性能 API サービス',
            },
            channel: {
                label: 'SSE リアルタイムチャネル',
                desc: '毎秒のサーバープッシュ',
            },
            panel: {
                label: 'Web パネル',
                desc: 'ブラウザ内での可視化',
            },
        },
        bottomCard: {
            sectionFeatures: '機能',
            sectionTech: '技術スタック',
            sectionLinks: '関連リンク',
            sectionCredits: 'クレジット',
            groupRealtime: 'リアルタイム & 監視',
            features: {
                monitoring: {
                    desc: 'リアルタイムなインターフェースレートとトラフィック概要',
                },
                overview: {
                    desc: '複数インターフェースの一元管理',
                },
                autoRefresh: {
                    label: '自動更新',
                    desc: '毎分最新データを取得',
                },
                hourly: {
                    desc: '時間別トラフィック分布',
                },
                daily: {
                    desc: '日別トラフィック推移',
                },
                monthly: {
                    desc: '月別トラフィック概要',
                },
                yearly: {
                    desc: '年別トラフィック推移',
                },
                top: {
                    desc: 'トップ N のトラフィック期間',
                },
            },
            link: {
                frontend: 'フロントエンドソース',
                backend: 'バックエンドソース',
                issues: '問題を報告',
                official: 'vnStat 公式サイト',
            },
            credits:
                'オープンソースプロジェクトの Vue 3、Chart.js、Pinia、Vite、および {vnstat} の作者 Teemu Toivonen 氏の長年のメンテナンスに感謝します。',
        },
    },

    /** トラフィックランキングページ。 */
    top: {
        metrics: {
            records: '記録数',
            counterSuffix: '',
            totalTraffic: '総トラフィック',
            peakShare: 'ピーク割合',
        },
        chart: {
            title: 'トラフィックランキング',
            hint: '全 {total} 件中トップ {n} 件',
            meanLine: '平均',
        },
        donut: {
            title: 'トラフィック内訳',
        },
        side: {
            details: '詳細',
            count: '記録数',
            rxShare: 'RX 割合',
        },
        table: {
            title: 'ランキング詳細',
            hint: '総トラフィックの降順でソート',
            rank: '順位',
        },
        columns: {
            date: '日付',
            total: '合計',
            avgSpeed: '平均速度',
        },
    },

    /** インターフェースカタログのトースト（更新 / 読み込み失敗）。 */
    catalog: {
        refreshed: 'データを更新しました',
        refreshFailed: '更新に失敗しました',
        loadFailed: 'インターフェース情報の読み込みに失敗しました',
    },
};
