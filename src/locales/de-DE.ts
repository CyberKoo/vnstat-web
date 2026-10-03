/**
 * German (Deutsch, de-DE) message catalog.
 *
 * Key structure must stay in sync with `zh-CN.ts` (which is the source of truth).
 *
 * Notes on structure:
 * - Composed sentences are whole messages with parameters; German word order
 *   (verb-final clauses, "ggü." for comparisons) is exactly why these are not
 *   assembled from fragments.
 * - `counterSuffix` is empty because German has no CJK-style counting unit.
 * - Dates follow the common German pattern "D. MMM YYYY" with a 24-hour clock
 *   (H:mm). The literal "Uhr" in hour formats is wrapped in [brackets] so
 *   dayjs does not parse its letters as format tokens.
 */
export default {
    common: {
        rx: 'RX',
        tx: 'TX',
        retry: 'Erneut versuchen',
        updated: 'Aktualisiert',
        /** Display date/time formats (dayjs tokens), kept per-locale so rendered timestamps follow the UI language */
        format: {
            date: 'D. MMM YYYY',
            time: 'H:mm',
            timeSeconds: 'H:mm:ss',
            dateTime: 'D. MMM YYYY H:mm',
            dateTimeShort: 'D. MMM H:mm',
            monthDay: 'D. MMM',
            dateWeekday: 'D. MMM YYYY ddd',
        },
    },

    overview: {
        detailSection: 'Schnittstellendetails',
        metrics: {
            totalInterfaces: 'Schnittstellen gesamt',
            counterSuffix: '',
            totalRx: 'Gesamt empfangen',
            totalTx: 'Gesamt gesendet',
        },
        columns: {
            name: 'Schnittstelle',
            alias: 'Alias',
            totalRx: 'Gesamt empfangen',
            totalTx: 'Gesamt gesendet',
            todayRx: 'Heute empfangen',
            todayTx: 'Heute gesendet',
            todayProgress: 'Heute-Fortschritt',
            updated: 'Letzte Aktualisierung',
        },
        card: {
            shareOfTotal: '{percent} % der Gesamtmenge',
            totalRx: 'Gesamt empfangen',
            totalTx: 'Gesamt gesendet',
            todayRx: 'Heute empfangen',
            todayTx: 'Heute gesendet',
            updated: 'Aktualisiert',
        },
        ring: {
            loading: 'Heutiger Fortschritt wird geladen…',
            unavailable: 'Heutiger Fortschritt nicht verfügbar',
            detail: 'Heute {today} / Tagesdurchschnitt {avg} · Ø-Geschwindigkeit {speed}',
            noHistory: 'Heutiger Fortschritt: nicht genügend Verlaufsdaten',
            reachedAvg: '{percent} % des Tagesdurchschnitts',
            overAvg: 'über dem Durchschnitt',
            speed: 'Ø-Geschwindigkeit {speed}',
            ariaNoData: 'Heutiger Fortschritt: keine Verlaufsdaten',
            ariaReached: '{percent} % des Tagesdurchschnitts erreicht',
        },
        trend: {
            title: 'Alle Schnittstellen · letzte {days} Tage',
            rx: 'RX',
            tx: 'TX',
            loadFailed: 'Trenddaten konnten nicht geladen werden',
            noData: 'Kein Traffic in den letzten {days} Tagen',
        },
        shareBar: {
            title: 'Anteil am Gesamt-Traffic',
            total: 'Gesamt {total}',
        },
        fetchFailed: 'Schnittstellenübersicht konnte nicht geladen werden',
    },

    /** Language names written in their own language (language switcher) */
    localeNames: {
        'zh-CN': 'Vereinfachtes Chinesisch',
        'zh-HK': 'Traditionelles Chinesisch',
        'en-US': 'Englisch',
        'ja-JP': 'Japanisch',
        'ru-RU': 'Russisch',
        'de-DE': 'Deutsch',
        'es-ES': 'Spanisch',
    },

    /** Top bar */
    header: {
        switchLanguage: 'Sprache',
        unitBitsTitle: 'Geschwindigkeitseinheit: Bits (Mbps), Klick wechselt zu Bytes',
        unitBytesTitle: 'Geschwindigkeitseinheit: Bytes (MiB/s), Klick wechselt zu Bits',
        refreshing: 'Aktualisierung läuft…',
        refresh: 'Seite aktualisieren',
        toLight: 'Zum hellen Modus wechseln',
        toDark: 'Zum dunklen Modus wechseln',
    },

    /** Sidebar menu labels (mirror the route table) */
    menu: {
        liveStats: 'Live-Überwachung',
        trafficGroup: 'Traffic',
        hourly: 'Stündlich',
        daily: 'Täglich',
        monthly: 'Monatlich',
        yearly: 'Jährlich',
        top: 'Top-Traffic',
        overview: 'Übersicht',
        about: 'Info',
        notFound: '404 – Nicht gefunden',
    },

    /** Layout chrome */
    layout: {
        expandSider: 'Seitenleiste erweitern',
        collapseSider: 'Seitenleiste einklappen',
        mainNav: 'Hauptnavigation',
        skipToContent: 'Zum Inhalt springen',
        breadcrumb: 'Breadcrumb',
        interface: 'Schnittstelle',
    },

    /** 404 page */
    notFound: {
        title: 'Seite nicht gefunden',
        desc: 'Die gesuchte Seite existiert nicht oder wurde entfernt.',
        home: 'Zurück zur Startseite',
    },

    /**
     * Traffic period pages (Hourly / Daily / Monthly / Yearly).
     * Keys mirror PERIOD_CONFIGS in `src/config/trafficPeriods.ts`; a period
     * only has the keys for the cards it actually shows (hour has no `avg`,
     * day has no `peak`).
     */
    periods: {
        hour: {
            label: 'Stunde',
            chartTitle: 'Traffic-Trend',
            peak: 'Spitzenstunde',
            trend: 'Aktuelle vs. letzte Stunde',
            sideAvg: 'Gesamtdauer',
            sidePeak: 'Spitze',
            /** Display date/time formats (dayjs tokens), kept per-locale so rendered timestamps follow the UI language */
            format: {
                tooltip: 'D. MMM YYYY, H [Uhr]',
                chart: 'H',
                tablePeriod: 'H:00',
                tableDateLabel: 'D. MMM YYYY',
            },
        },
        day: {
            label: 'Tag',
            chartTitle: 'Traffic-Trend',
            avg: 'Tagesdurchschnitt',
            trend: 'Heute vs. gestern',
            sideAvg: 'Tages-Ø',
            sidePeak: 'Spitzentag',
            /** Display date/time formats (dayjs tokens), kept per-locale so rendered timestamps follow the UI language */
            format: {
                tooltip: 'D. MMM YYYY',
                chart: 'D. MMM',
                tablePeriod: 'D. MMM',
                tableDateLabel: 'MMM YYYY',
            },
        },
        month: {
            label: 'Monat',
            chartTitle: 'Monatsvergleich',
            avg: 'Monatsdurchschnitt',
            peak: 'Spitzenmonat',
            trend: 'Dieser Monat vs. letzter Monat',
            sideAvg: 'Monats-Ø',
            sidePeak: 'Spitzenmonat',
            /** Display date/time formats (dayjs tokens), kept per-locale so rendered timestamps follow the UI language */
            format: {
                tooltip: 'MMM YYYY',
                chart: 'MMM YYYY',
                tablePeriod: 'MMM',
                tableDateLabel: 'YYYY',
            },
        },
        year: {
            label: 'Jahr',
            chartTitle: 'Monatsvergleich',
            avg: 'Jahresdurchschnitt',
            peak: 'Spitzenjahr',
            trend: 'Dieses Jahr vs. letztes Jahr',
            sideAvg: 'Jahres-Ø',
            sidePeak: 'Spitzenjahr',
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
        ghostLine: 'Vorherige Periode',
        avgLine: 'Historischer Durchschnitt',
        movingAverage: '{days}-Tage-Durchschnitt',
        lastWeek: 'Gleicher Wochentag letzte Woche',
        rxCumulative: 'RX kumulativ',
        txCumulative: 'TX kumulativ',
        tooltipValue: '{label}: {value}',
        tooltipNoData: '{label}: --',
        cumulativeTip: '{label}: {total} (diese Periode {current})',
        yoy: {
            breakdownTip: '{label}: {total} (RX {rx} · TX {tx})',
            cumulativeTip: '{label}: {total} (dieser Monat {current})',
            changeTip: 'Jahresvergleich {year}: {percent}',
            inProgress: 'Läuft',
        },
        mode: {
            label: 'Diagrammmodus',
            bar: 'Balken',
            area: 'Fläche',
            cumulative: 'Kumulativ',
        },
        panel: {
            composition: 'Traffic-Mix',
            details: 'Details',
        },
        table: {
            detailTitle: 'Datendetails',
        },
        heatmap: {
            less: 'Weniger',
            more: 'Mehr',
            cellTip: '{date}\nRX: {rx}\nTX: {tx}\nGesamt: {total}',
        },
        legend: {
            low: 'Niedrig',
            high: 'Hoch',
        },
        hourlyProfile: {
            aria: '24-Stunden-Trafficprofil',
            cellTip: '{time} · Ø {avg}',
            cellTipToday: '{time} · Ø {avg} · heute {today}',
            hoverHint: 'Mit der Maus überfahren, um die heutigen Istwerte zu sehen',
        },
        weekHour: {
            aria: 'Heatmap: Wochentag × Stunde',
            cellTip: '{weekday} {time} · Ø {avg}',
        },
        yearCard: {
            inProgress: 'Läuft',
            yoy: 'Jahresvergleich {percent}',
            monthlyAvg: 'Monats-Ø {value}',
            peak: 'Spitze {month} {value}',
            rxShare: 'RX {percent} %',
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
                hour: '24-h-Gesamt',
                day: '{count}-Tage-Gesamt',
                month: '{count}-Monate-Gesamt',
                year: '{count}-Jahre-Gesamt',
            },
            compareLabel: 'ggü. vorheriger Periode',
        },
        compare: {
            window: {
                hour: 'Letzte 24 h vs. vorherige 24 h',
                day: 'Letzte 7 Tage vs. vorherige 7 Tage',
                month: 'Dieser Monat vs. letzter Monat',
                year: 'Dieses Jahr vs. letztes Jahr',
            },
        },
        side: {
            total: 'Gesamt',
            duration: '{count} Std.',
            rxShare: 'RX-Anteil',
        },
        table: {
            columns: {
                period: 'Zeitraum',
                periodHour: 'Uhrzeit',
                periodDay: 'Datum',
                received: 'Empfangen',
                sent: 'Gesendet',
                total: 'Gesamt',
                avgSpeed: 'Ø-Geschwindigkeit',
            },
        },
        insights: {
            day: {
                avgWithCompare:
                    'Tagesdurchschnitt der letzten {days} Tage: {avg}, {change} % ggü. den vorherigen {days} Tagen',
                avgOnly: 'Tagesdurchschnitt der letzten {days} Tage: {avg}',
                peak: 'Spitzentag {date} ({size})',
            },
            hour: {
                peakSingle: 'Spitze um {start}, {share} % des Tages',
                peakBand: 'Spitzenstunden {start}–{end}, {share} % des Tages',
                recent: 'Gesamt der letzten 24 h {total}, {ratio}× des historischen Tagesdurchschnitts',
                recentWithSpeed:
                    'Gesamt der letzten 24 h {total}, Ø-Geschwindigkeit {speed}, {ratio}× des historischen Tagesdurchschnitts',
            },
            month: {
                projection: 'Tagesdurchschnitt diesen Monat {avg}; prognostiziertes Monatsende-Gesamt {projected}',
                pastTotal: 'Gesamt für {month}: {total}',
                peak: 'Spitzenmonat: {month} ({size})',
            },
            year: {
                insufficient: 'Noch nicht genügend Jahresdaten für einen zuverlässigen Jahresvergleich',
                compare: '{year}: {total} erfasst, {change} % ggü. Vorjahr',
                recorded: '{year}: {total} erfasst',
            },
        },
        record: {
            title: 'Heute {today} / Rekord {record} · {percent} %',
            reached: 'Rekord erreicht',
            remaining: 'Noch {remaining} bis zum Rekord',
        },
        quota: {
            thisMonth: 'Dieser Monat',
            used: '{month}: {used} / {quota} GiB · {percent} %',
            notSet: 'Kein monatliches Traffic-Kontingent gesetzt',
            adjust: 'Kontingent anpassen',
            set: 'Kontingent festlegen',
            panelTitle: 'Monatliches Traffic-Kontingent',
            inputLabel: 'Kontingent pro Monat',
            placeholder: 'Leer lassen, um das Kontingent zu entfernen',
            clear: 'Löschen',
            stateSet: 'Auf {quota} GiB gesetzt',
            stateUnset: 'Nicht gesetzt',
            projection: 'Prognostiziertes Monatsende-Gesamt {projected}',
            projectionWithPercent: 'Prognose bis Monatsende: {projected} ({percent} % des Kontingents)',
        },
        calendar: {
            title: 'Traffic des letzten Jahres',
        },
        hourly: {
            profileTitle: '24-Stunden-Profil',
            weekHourTitle: 'Verteilung nach Wochentag × Stunde',
        },
        yearCompare: {
            title: 'Jahresvergleich',
        },
        peakStrip: {
            label: 'Spitzenstunden',
        },
    },

    /** Live monitoring page: header, chart area, sidebar, bottom cards, uPlot tooltips. */
    live: {
        header: {
            rxLabel: 'RX',
            txLabel: 'TX',
            todayTotal: 'Gesamt heute',
            samplesSuffix: 'Werte',
        },
        compact: {
            title: 'Letzte 24 Stunden',
            total: 'Gesamt',
            bandwidthUsage: 'Bandbreitennutzung',
        },
        chart: {
            title: 'Live-Rate',
            historyHint: 'Zum Wiederholen der letzten 48 Stunden die Zeitachse ziehen',
            thresholdTitle: 'Schwellenwert',
            thresholdLabel: 'Schwellenwert für die Rate',
            thresholdSet: 'Schwellenwert festlegen',
            thresholdActive: 'Schwellenwert: {value} Mbps (Klick zum Festlegen)',
            thresholdPlaceholder: 'Leer lassen zum Deaktivieren',
            thresholdClear: 'Löschen',
            thresholdOn: 'Aktiviert: {value} Mbps',
            thresholdOff: 'Nicht gesetzt',
            replaying: 'Wiedergabe läuft…',
            replayTag: 'Wiederholung',
            historyTag: '48h',
            exitReplay: 'Zurück zum Live-Modus',
            replayTimeline: 'Wiederholungs-Zeitachse',
            liveTag: 'Live',
            connecting: 'Verbindung wird aufgebaut…',
        },
        sidebar: {
            peak: 'Spitzenrate',
            trough: 'Minimalrate',
            at: 'um {time}',
            fiveMinTotal: '5-Min-Gesamt',
            uptime: 'Laufzeit',
            days: '{count} Tage',
            since: 'seit {date}',
            monthlyTotal: 'Dieser Monat / gesamt',
            today: 'heute',
        },
        bottom: {
            packetRate: 'Paketrate',
            trendTitle: 'Letzte 3 Stunden',
            top5Title: 'Top-5-Tage',
            noData: 'Keine Daten',
            ppsTooltip: '{label}: {value} PPS',
        },
        axis: {
            now: 'jetzt',
        },
        tooltip: {
            rxRow: 'RX {value}',
            txRow: 'TX {value}',
        },
    },

    /** About page copy (hero, highlights, pipeline, bottom card). */
    about: {
        hero: {
            subtitle: 'Modernes Dashboard zur Netzwerk-Traffic-Überwachung',
            badgeOpenSource: 'Open Source',
            toolName: 'vnStat',
            description:
                'vnStat Web ist ein Web-Frontend für den Traffic-Monitor {tool} mit Echtzeit-Überwachung, historischen Diagrammen von stündlich bis jährlich und zentraler Verwaltung mehrerer Schnittstellen. Das Backend ist in Rust geschrieben und sendet pro Sekunde aktualisierte Werte über SSE.',
        },
        highlights: {
            sectionTitle: 'Kernfunktionen',
            realtime: {
                label: 'Echtzeit-Überwachung',
                desc: 'SSE-Push, sekündliche Aktualisierung',
            },
            history: {
                label: 'Historische Statistiken',
                desc: 'Stündliche, tägliche, monatliche und jährliche Ansichten',
            },
            multiInterface: {
                label: 'Mehrere Schnittstellen',
                desc: 'Zwischen überwachten Schnittstellen wechseln',
            },
            darkTheme: {
                label: 'Dunkles Design',
                desc: 'Folgt dem System oder manuell umschalten',
            },
        },
        pipeline: {
            sectionTitle: 'Datenpipeline',
            daemon: {
                label: 'vnStat-Daemon',
                desc: 'Erfassung der Kernel-Schnittstellen-Zählerstände',
            },
            backend: {
                label: 'Rust-Backend',
                desc: 'Hochleistungs-API-Dienst',
            },
            channel: {
                label: 'SSE-Echtzeitkanal',
                desc: 'Server-Push pro Sekunde',
            },
            panel: {
                label: 'Web-Panel',
                desc: 'Visualisierung im Browser',
            },
        },
        bottomCard: {
            sectionFeatures: 'Funktionen',
            sectionTech: 'Tech-Stack',
            sectionLinks: 'Links',
            sectionCredits: 'Danksagung',
            groupRealtime: 'Echtzeit & Überwachung',
            features: {
                monitoring: {
                    desc: 'Echtzeit-Raten und Traffic-Übersicht pro Schnittstelle',
                },
                overview: {
                    desc: 'Zentrale Verwaltung mehrerer Schnittstellen',
                },
                autoRefresh: {
                    label: 'Automatische Aktualisierung',
                    desc: 'Lädt jede Minute die neuesten Daten',
                },
                hourly: {
                    desc: 'Stündliche Traffic-Verteilung',
                },
                daily: {
                    desc: 'Tägliche Traffic-Trends',
                },
                monthly: {
                    desc: 'Monatlicher Traffic-Überblick',
                },
                yearly: {
                    desc: 'Jährliche Traffic-Trends',
                },
                top: {
                    desc: 'Top-N-Traffic-Zeiträume',
                },
            },
            link: {
                frontend: 'Frontend-Quellcode',
                backend: 'Backend-Quellcode',
                issues: 'Fehler melden',
                official: 'vnStat-Website',
            },
            credits:
                'Dank an die Open-Source-Projekte Vue 3, Chart.js, Pinia und Vite sowie an {vnstat}-Autor Teemu Toivonen für die langjährige Pflege.',
        },
    },

    /** Top-traffic ranking page. */
    top: {
        metrics: {
            records: 'Einträge',
            counterSuffix: '',
            totalTraffic: 'Gesamt-Traffic',
            peakShare: 'Spitzenanteil',
        },
        chart: {
            title: 'Traffic-Rangliste',
            hint: 'Top {n} von {total}',
            meanLine: 'Mittelwert',
        },
        donut: {
            title: 'Traffic-Aufschlüsselung',
        },
        side: {
            details: 'Details',
            count: 'Einträge',
            rxShare: 'RX-Anteil',
        },
        table: {
            title: 'Ranglistendetails',
            hint: 'Nach Gesamt-Traffic sortiert, absteigend',
            rank: 'Rang',
        },
        columns: {
            date: 'Datum',
            total: 'Gesamt',
            avgSpeed: 'Ø-Geschwindigkeit',
        },
    },

    /** Toasts from the interface catalog (refresh / load failures). */
    catalog: {
        refreshed: 'Daten aktualisiert',
        refreshFailed: 'Aktualisierung fehlgeschlagen',
        loadFailed: 'Schnittstelleninformationen konnten nicht geladen werden',
    },
};
