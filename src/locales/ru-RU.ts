/**
 * Русскоязычный каталог сообщений.
 *
 * Структура ключей и параметры должны совпадать во всех каталогах.
 *
 * Примечания по структуре:
 * - Составные предложения — целые сообщения с параметрами; порядок слов здесь
 *   не совпадает с китайским, поэтому они не собираются из фрагментов.
 * - `counterSuffix` пустой, потому что в русском языке нет счётного слова
 *   в стиле CJK.
 * - Варианты через разделитель соответствуют one/few/many/other (дробные числа).
 *   Числовой третий аргумент t выбирает форму независимо от форматирования параметров.
 */
export default {
    common: {
        rx: 'RX',
        tx: 'TX',
        retry: 'Повторить',
        updated: 'Обновлено',
        /** Форматы отображения даты/времени (токены dayjs), заданы для каждой локали, чтобы метки времени соответствовали языку интерфейса */
        format: {
            date: 'D MMM YYYY г.',
            time: 'H:mm',
            timeSeconds: 'H:mm:ss',
            dateTime: 'D MMM YYYY г., H:mm',
            dateTimeShort: 'D MMM, H:mm',
            monthDay: 'D MMM',
            dateWeekday: 'D MMM YYYY г., ddd',
        },
    },

    overview: {
        detailSection: 'Сведения об интерфейсах',
        metrics: {
            totalInterfaces: 'Всего интерфейсов',
            counterSuffix: '',
            totalRx: 'Всего принято',
            totalTx: 'Всего отправлено',
        },
        columns: {
            name: 'Интерфейс',
            alias: 'Псевдоним',
            totalRx: 'Всего принято',
            totalTx: 'Всего отправлено',
            todayRx: 'Принято сегодня',
            todayTx: 'Отправлено сегодня',
            todayProgress: 'Прогресс за сегодня',
            updated: 'Последнее обновление',
        },
        card: {
            shareOfTotal: '{percent}% от общего объёма',
            totalRx: 'Всего принято',
            totalTx: 'Всего отправлено',
            todayRx: 'Принято сегодня',
            todayTx: 'Отправлено сегодня',
            updated: 'Обновлено',
        },
        ring: {
            loading: 'Загрузка прогресса за сегодня',
            unavailable: 'Прогресс за сегодня недоступен',
            detail: 'Сегодня {today} / среднее за день {avg} · средняя скорость {speed}',
            noHistory: 'Прогресс за сегодня: недостаточно истории',
            reachedAvg: '{percent}% от среднего за день',
            overAvg: 'выше среднего',
            speed: 'средняя скорость {speed}',
            ariaNoData: 'Прогресс за сегодня: нет исторических данных',
            ariaReached: 'Достигнуто {percent}% среднего за день',
        },
        trend: {
            title: 'Все интерфейсы · за {days} день | Все интерфейсы · за {days} дня | Все интерфейсы · за {days} дней | Все интерфейсы · за {days} дня',
            rx: 'RX',
            tx: 'TX',
            loadFailed: 'Не удалось загрузить данные тренда',
            noData: 'Нет трафика за {days} день | Нет трафика за {days} дня | Нет трафика за {days} дней | Нет трафика за {days} дня',
        },
        shareBar: {
            title: 'Доля в общем трафике',
            total: 'Всего {total}',
        },
        fetchFailed: 'Не удалось загрузить обзор интерфейсов',
    },

    /** Верхняя панель */
    header: {
        switchLanguage: 'Язык',
        unitBitsTitle: 'Единица скорости: биты (Mbps), нажмите, чтобы переключиться на байты',
        unitBytesTitle: 'Единица скорости: байты (MiB/s), нажмите, чтобы переключиться на биты',
        refreshing: 'Обновление…',
        refresh: 'Обновить страницу',
        toLight: 'Переключить на светлую тему',
        toDark: 'Переключить на тёмную тему',
    },

    /** Метки бокового меню (зеркалируют таблицу маршрутов) */
    menu: {
        liveStats: 'Мониторинг в реальном времени',
        trafficGroup: 'Трафик',
        hourly: 'Почасовой',
        daily: 'Ежедневный',
        monthly: 'Ежемесячный',
        yearly: 'Ежегодный',
        top: 'Топ трафика',
        overview: 'Обзор',
        about: 'О программе',
        notFound: '404 Not Found',
    },

    /** Элементы каркаса макета */
    layout: {
        expandSider: 'Развернуть боковую панель',
        collapseSider: 'Свернуть боковую панель',
        mainNav: 'Основная навигация',
        skipToContent: 'Перейти к основному содержимому',
        breadcrumb: 'Хлебные крошки',
        interface: 'Интерфейс',
    },

    /** Страница 404 */
    notFound: {
        title: 'Страница не найдена',
        desc: 'Страница, которую вы ищете, не существует или была удалена.',
        home: 'Вернуться на главную',
    },

    /**
     * Страницы периодов трафика (почасовой / суточный / месячный / годовой).
     * Ключи соответствуют PERIOD_CONFIGS в `src/config/trafficPeriods.ts`; у
     * периода есть только ключи для карточек, которые он реально показывает
     * (у часа нет `avg`, у дня нет `peak`).
     */
    periods: {
        hour: {
            label: 'Час',
            chartTitle: 'Тренд трафика',
            peak: 'Пиковый час',
            trend: 'Текущий час vs предыдущий',
            /** Форматы отображения даты/времени (токены dayjs), заданы для каждой локали, чтобы метки времени соответствовали языку интерфейса */
            format: {
                tooltip: 'D MMM YYYY г., H:00',
                chart: 'H:00',
                tablePeriod: 'H:00',
                tableDateLabel: 'D MMM YYYY г.',
            },
        },
        day: {
            label: 'День',
            chartTitle: 'Тренд трафика',
            avg: 'Средний суточный трафик',
            trend: 'Сегодня vs вчера',
            /** Форматы отображения даты/времени (токены dayjs), заданы для каждой локали, чтобы метки времени соответствовали языку интерфейса */
            format: {
                tooltip: 'D MMM YYYY г.',
                chart: 'D MMM',
                tablePeriod: 'D MMM',
                tableDateLabel: 'MMM YYYY г.',
            },
        },
        month: {
            label: 'Месяц',
            chartTitle: 'Сравнение по месяцам',
            avg: 'Среднемесячный трафик',
            peak: 'Пиковый месяц',
            trend: 'Этот месяц vs прошлый',
            /** Форматы отображения даты/времени (токены dayjs), заданы для каждой локали, чтобы метки времени соответствовали языку интерфейса */
            format: {
                tooltip: 'MMM YYYY г.',
                chart: 'MMM YYYY г.',
                tablePeriod: 'MMM',
                tableDateLabel: 'YYYY',
            },
        },
        year: {
            label: 'Год',
            chartTitle: 'Сравнение по месяцам',
            avg: 'Среднегодовой трафик',
            peak: 'Пиковый год',
            trend: 'Этот год vs прошлый',
            /** Форматы отображения даты/времени (токены dayjs), заданы для каждой локали, чтобы метки времени соответствовали языку интерфейса */
            format: {
                tooltip: 'YYYY',
                chart: 'YYYY',
                tablePeriod: 'YYYY',
            },
        },
    },

    /**
     * Тексты графиков: метки наборов данных, подсказки, легенды и элементы
     * оформления. Константы LABEL в periodChartData.ts содержат эти ключи.
     */
    chart: {
        trafficWithUnit: 'Трафик ({unit})',
        ghostLine: 'Предыдущий период',
        avgLine: 'Историческое среднее',
        movingAverage:
            'Скользящее среднее за {days} день | Скользящее среднее за {days} дня | Скользящее среднее за {days} дней | Скользящее среднее за {days} дня',
        lastWeek: 'Тот же день на прошлой неделе',
        rxCumulative: 'Накопленный RX',
        txCumulative: 'Накопленный TX',
        tooltipValue: '{label}: {value}',
        tooltipNoData: '{label}: --',
        cumulativeTip: '{label}: {total} (этот период: {current})',
        yoy: {
            breakdownTip: '{label}: {total} (RX {rx} · TX {tx})',
            cumulativeTip: '{label}: {total} (этот месяц: {current})',
            changeTip: 'Год к году {year}: {percent}',
            inProgress: 'В процессе',
        },
        mode: {
            label: 'Режим графика',
            bar: 'Столбцы',
            area: 'Область',
            cumulative: 'Накопление',
        },
        panel: {
            composition: 'Структура трафика',
        },
        table: {
            detailTitle: 'Детали данных',
        },
        heatmap: {
            less: 'Меньше',
            more: 'Больше',
            cellTip: '{date}\nRX: {rx}\nTX: {tx}\nВсего: {total}',
        },
        legend: {
            low: 'Низкий',
            high: 'Высокий',
        },
        hourlyProfile: {
            aria: 'Профиль трафика по 24 часам',
            cellTip: '{time} · среднее {avg}',
            cellTipToday: '{time} · среднее {avg} · сегодня {today}',
            hoverHint: 'Наведите курсор, чтобы увидеть фактические значения за сегодня',
        },
        weekHour: {
            aria: 'Тепловая карта трафика: день недели × час',
            cellTip: '{weekday} {time} · {total}',
        },
        yearCard: {
            inProgress: 'В процессе',
            yoy: 'Год к году {percent}',
            monthlyAvg: 'Среднее за месяц {value}',
            peak: 'Пик {month} {value}',
            rxShare: 'RX {percent}%',
        },
    },

    /**
     * Страницы периодов трафика: карточки статистики, боковая панель,
     * рекорд против сегодняшнего дня, месячная квота, инсайты и таблица
     * периода.
     */
    period: {
        format: {
            month: 'MMM YYYY г.',
        },
        stats: {
            total: {
                hour: 'Итог за 24 ч',
                day: 'Итог за {count} день | Итог за {count} дня | Итог за {count} дней | Итог за {count} дня',
                month: 'Итог за {count} месяц | Итог за {count} месяца | Итог за {count} месяцев | Итог за {count} месяца',
                year: 'Итог за {count} год | Итог за {count} года | Итог за {count} лет | Итог за {count} года',
            },
            compareLabel: 'относительно предыдущего периода',
        },
        compare: {
            window: {
                hour: 'Последние 24 ч vs предыдущие 24 ч',
                day: 'Последние 7 дн. vs предыдущие 7 дн.',
                month: 'Этот месяц vs прошлый',
                year: 'Этот год vs прошлый',
            },
        },
        table: {
            columns: {
                period: 'Период',
                periodHour: 'Время',
                periodDay: 'Дата',
                received: 'Принято',
                sent: 'Отправлено',
                total: 'Всего',
                avgSpeed: 'Средняя скорость',
            },
        },
        insights: {
            day: {
                avgWithCompare:
                    'Суточное среднее за {days} день: {avg}, {change}% к предыдущему периоду ({days} день) | Суточное среднее за {days} дня: {avg}, {change}% к предыдущему периоду ({days} дня) | Суточное среднее за {days} дней: {avg}, {change}% к предыдущему периоду ({days} дней) | Суточное среднее за {days} дня: {avg}, {change}% к предыдущему периоду ({days} дня)',
                avgOnly:
                    'Суточное среднее за {days} день: {avg} | Суточное среднее за {days} дня: {avg} | Суточное среднее за {days} дней: {avg} | Суточное среднее за {days} дня: {avg}',
                peak: 'Пиковый день {date} ({size})',
            },
            hour: {
                peakSingle: 'Пик в {start}, {share}% дня',
                peakBand: 'Пиковые часы {start}–{end}, {share}% дня',
                recent: 'Итог за последние 24 ч: {total}, {ratio}× от исторического суточного среднего',
                recentWithSpeed:
                    'Итог за последние 24 ч: {total}, средняя скорость {speed}, {ratio}× от исторического суточного среднего',
            },
            month: {
                projection: 'Среднее за день в этом месяце: {avg}; прогноз на конец месяца: {projected}',
                pastTotal: 'Итог за {month}: {total}',
                peak: 'Пиковый месяц: {month} ({size})',
            },
            year: {
                insufficient: 'Недостаточно годовых данных для надёжного сравнения год к году',
                compare: 'За {year} записано {total}, {change}% к предыдущему году',
                recorded: 'За {year} записано {total}',
            },
        },
        record: {
            title: 'Сегодня {today} / рекорд {record} · {percent}%',
            reached: 'Рекорд повторён',
            remaining: 'До рекорда осталось {remaining}',
        },
        quota: {
            thisMonth: 'Этот месяц',
            used: '{month}: использовано {used} / {quota} GiB · {percent}%',
            notSet: 'Месячная квота трафика не задана',
            adjust: 'Изменить квоту',
            set: 'Задать квоту',
            panelTitle: 'Месячная квота трафика',
            inputLabel: 'Размер месячной квоты',
            placeholder: 'Оставьте пустым, чтобы снять квоту',
            clear: 'Очистить',
            stateSet: 'Задано {quota} GiB',
            stateUnset: 'Не задано',
            projection: 'Прогноз на конец месяца: {projected}',
            projectionWithPercent: 'Прогноз к концу месяца: {projected} ({percent}% квоты)',
        },
        calendar: {
            title: 'Трафик за последний год',
        },
        hourly: {
            profileTitle: 'Профиль по 24 часам',
            weekHourTitle: 'Распределение по дням недели и часам',
        },
        yearCompare: {
            title: 'Сравнение годов',
        },
        peakStrip: {
            label: 'Пиковые часы',
        },
    },

    /** Страница живого мониторинга: заголовок, область графика, боковая панель, нижние карточки, подсказки uPlot. */
    live: {
        header: {
            rxLabel: 'RX',
            txLabel: 'TX',
            todayTotal: 'Итог за сегодня',
            samples: '{count} выборка | {count} выборки | {count} выборок | {count} выборки',
        },
        compact: {
            title: 'Последние 24 часа',
            total: 'Всего',
            vsRecentPeak: 'Отн. пика за 3 ч',
        },
        chart: {
            title: 'Скорость в реальном времени',
            historyHint: 'Перетащите временную шкалу, чтобы воспроизвести последние 48 часов',
            thresholdTitle: 'Порог скорости',
            thresholdLabel: 'Значение порога скорости',
            thresholdSet: 'Задать порог скорости',
            thresholdActive: 'Порог скорости: {value} Mbps (нажмите, чтобы задать)',
            thresholdPlaceholder: 'Оставьте пустым, чтобы отключить',
            thresholdClear: 'Очистить',
            thresholdOn: 'Включено: {value} Mbps',
            thresholdOff: 'Не задан',
            replaying: 'Воспроизведение',
            replayTag: 'Повтор',
            historyTag: '48 ч',
            exitReplay: 'Вернуться к реальному времени',
            replayTimeline: 'Шкала воспроизведения',
            liveTag: 'Онлайн',
            connecting: 'Подключение…',
        },
        sidebar: {
            peak: 'Пиковая скорость',
            trough: 'Минимальная скорость',
            at: 'в {time}',
            fiveMinTotal: 'Итог за 5 мин.',
            uptime: 'Время работы',
            days: '{count} день | {count} дня | {count} дней | {count} дня',
            since: 'с {date}',
            monthlyTotal: 'За месяц / всего',
            today: 'сегодня',
        },
        bottom: {
            packetRate: 'Скорость пакетов',
            trendTitle: 'Последние 3 часа',
            top5Title: 'Топ-5 дней',
            noData: 'Нет данных',
            ppsTooltip: '{label}: {value} PPS',
        },
        axis: {
            now: 'сейчас',
        },
        tooltip: {
            rxRow: 'RX {value}',
            txRow: 'TX {value}',
        },
    },

    /** Тексты страницы «О программе» (герой, преимущества, конвейер данных, нижняя карточка). */
    about: {
        hero: {
            subtitle: 'Современная панель мониторинга сетевого трафика',
            badgeOpenSource: 'Open Source',
            toolName: 'vnStat',
            description:
                'vnStat Web — это веб-интерфейс к монитору трафика {tool}: мониторинг в реальном времени, исторические графики от почасовых до годовых и управление несколькими интерфейсами в одном месте. Бэкенд написан на Rust и передаёт обновления каждую секунду по SSE.',
        },
        highlights: {
            sectionTitle: 'Основные возможности',
            realtime: {
                label: 'Мониторинг в реальном времени',
                desc: 'Push по SSE, обновление каждую секунду',
            },
            history: {
                label: 'История статистики',
                desc: 'Почасовой, суточный, месячный и годовой виды',
            },
            multiInterface: {
                label: 'Несколько интерфейсов',
                desc: 'Переключение между интерфейсами',
            },
            darkTheme: {
                label: 'Тёмная тема',
                desc: 'Следовать за системой или переключать вручную',
            },
        },
        pipeline: {
            sectionTitle: 'Конвейер данных',
            daemon: {
                label: 'Демон vnStat',
                desc: 'Сбор счётчиков интерфейсов ядра',
            },
            backend: {
                label: 'Бэкенд на Rust',
                desc: 'Высокопроизводительный API-сервис',
            },
            channel: {
                label: 'Канал SSE',
                desc: 'Серверный push каждую секунду',
            },
            panel: {
                label: 'Веб-панель',
                desc: 'Визуализация в браузере',
            },
        },
        bottomCard: {
            sectionFeatures: 'Возможности',
            sectionTech: 'Стек технологий',
            sectionLinks: 'Ссылки',
            sectionCredits: 'Благодарности',
            groupRealtime: 'Мониторинг в реальном времени',
            features: {
                monitoring: {
                    desc: 'Скорости интерфейсов и обзор трафика в реальном времени',
                },
                overview: {
                    desc: 'Единое управление несколькими интерфейсами',
                },
                autoRefresh: {
                    label: 'Автообновление',
                    desc: 'Загружает свежие данные каждую минуту',
                },
                hourly: {
                    desc: 'Почасовое распределение трафика',
                },
                daily: {
                    desc: 'Суточные тренды трафика',
                },
                monthly: {
                    desc: 'Месячный обзор трафика',
                },
                yearly: {
                    desc: 'Годовые тренды трафика',
                },
                top: {
                    desc: 'Периоды с максимальным трафиком (топ-N)',
                },
            },
            link: {
                frontend: 'Исходники фронтенда',
                backend: 'Исходники бэкенда',
                issues: 'Сообщить о проблеме',
                official: 'Сайт vnStat',
            },
            credits:
                'Благодарим проекты с открытым исходным кодом Vue 3, Chart.js, Pinia и Vite, а также автора {vnstat} Teemu Toivonen за многолетнюю поддержку.',
        },
    },

    /** Страница рейтинга трафика. */
    top: {
        metrics: {
            records: 'Записи',
            counterSuffix: '',
            totalTraffic: 'Всего трафика',
            peakShare: 'Пиковая доля',
        },
        chart: {
            title: 'Рейтинг трафика',
            hint: 'Топ-{n} из {total}',
            meanLine: 'Среднее',
        },
        donut: {
            title: 'Структура трафика',
        },
        table: {
            title: 'Детали рейтинга',
            hint: 'Сортировка по общему трафику, по убыванию',
            rank: 'Место',
        },
        columns: {
            date: 'Дата',
            total: 'Всего',
            avgSpeed: 'Средняя скорость',
        },
    },

    /** Уведомления из каталога интерфейсов (сбои обновления / загрузки). */
    catalog: {
        refreshed: 'Данные обновлены',
        refreshFailed: 'Не удалось обновить',
        loadFailed: 'Не удалось загрузить информацию об интерфейсах',
    },
};
