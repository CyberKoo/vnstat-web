/**
 * Catálogo de mensajes en español (España).
 *
 * La estructura de claves debe mantenerse sincronizada con `en-US.ts`.
 *
 * Notas sobre la estructura:
 * - Las frases compuestas son mensajes completos con parámetros; el orden de
 *   las palabras sigue la gramática española, no la inglesa, por lo que no se
 *   ensamblan a partir de fragmentos.
 * - `counterSuffix` está vacío porque el español no tiene una unidad de
 *   conteo estilo CJK.
 * - Los formatos de fecha y hora usan tokens de dayjs con reloj de 24 horas;
 *   los literales en letras latinas se escapan entre corchetes (p. ej. `[h]`).
 */
export default {
    common: {
        rx: 'RX',
        tx: 'TX',
        retry: 'Reintentar',
        updated: 'Actualizado',
        /** Formatos de fecha/hora mostrados (tokens de dayjs), definidos por idioma para que las marcas sigan el idioma de la interfaz */
        format: {
            date: 'D MMM YYYY',
            time: 'H:mm',
            timeSeconds: 'H:mm:ss',
            dateTime: 'D MMM YYYY H:mm',
            dateTimeShort: 'D MMM H:mm',
            monthDay: 'D MMM',
            dateWeekday: 'D MMM YYYY ddd',
        },
    },

    overview: {
        detailSection: 'Detalles de la interfaz',
        metrics: {
            totalInterfaces: 'Interfaces totales',
            counterSuffix: '',
            totalRx: 'Total recibido',
            totalTx: 'Total enviado',
        },
        columns: {
            name: 'Interfaz',
            alias: 'Alias',
            totalRx: 'Total recibido',
            totalTx: 'Total enviado',
            todayRx: 'Recibido hoy',
            todayTx: 'Enviado hoy',
            todayProgress: 'Progreso de hoy',
            updated: 'Última actualización',
        },
        card: {
            shareOfTotal: '{percent}% del total',
            totalRx: 'Total recibido',
            totalTx: 'Total enviado',
            todayRx: 'Recibido hoy',
            todayTx: 'Enviado hoy',
            updated: 'Actualizado',
        },
        ring: {
            loading: 'Cargando el progreso de hoy',
            unavailable: 'Progreso de hoy no disponible',
            detail: 'Hoy {today} / media diaria {avg} · velocidad media {speed}',
            noHistory: 'Progreso de hoy: historial insuficiente',
            reachedAvg: '{percent}% de la media diaria',
            overAvg: 'por encima de la media',
            speed: 'vel. media {speed}',
            ariaNoData: 'Progreso de hoy: sin datos históricos',
            ariaReached: '{percent}% de la media diaria alcanzado',
        },
        trend: {
            title: 'Todas las interfaces · periodo de {days} día | Todas las interfaces · últimos {days} días',
            rx: 'RX',
            tx: 'TX',
            loadFailed: 'Error al cargar la tendencia',
            noData: 'Sin tráfico en un periodo de {days} día | Sin tráfico en los últimos {days} días',
        },
        shareBar: {
            title: 'Distribución del tráfico total',
            total: 'Total {total}',
        },
        fetchFailed: 'Error al cargar la vista general de interfaces',
    },

    /** Barra superior */
    header: {
        switchLanguage: 'Idioma',
        unitBitsTitle: 'Unidad de velocidad: bits (Mbps), pulsa para cambiar a bytes',
        unitBytesTitle: 'Unidad de velocidad: bytes (MiB/s), pulsa para cambiar a bits',
        refreshing: 'Actualizando…',
        refresh: 'Actualizar página',
        toLight: 'Cambiar al modo claro',
        toDark: 'Cambiar al modo oscuro',
    },

    /** Etiquetas del menú lateral (reflejan la tabla de rutas) */
    menu: {
        liveStats: 'Monitorización en directo',
        trafficGroup: 'Tráfico',
        hourly: 'Por horas',
        daily: 'Diario',
        monthly: 'Mensual',
        yearly: 'Anual',
        top: 'Más tráfico',
        overview: 'Vista general',
        about: 'Acerca de',
        notFound: '404 No encontrado',
    },

    /** Elementos del layout */
    layout: {
        expandSider: 'Expandir barra lateral',
        collapseSider: 'Contraer barra lateral',
        mainNav: 'Navegación principal',
        skipToContent: 'Saltar al contenido principal',
        breadcrumb: 'Migas de pan',
        interface: 'Interfaz',
    },

    /** Página 404 */
    notFound: {
        title: 'Página no encontrada',
        desc: 'La página que buscas no existe o ha sido eliminada.',
        home: 'Volver a la página principal',
    },

    /**
     * Páginas de periodos de tráfico (por horas / diario / mensual / anual).
     * Las claves reflejan PERIOD_CONFIGS en `src/config/trafficPeriods.ts`; cada
     * periodo solo tiene las claves de las tarjetas que realmente muestra (la
     * hora no tiene `avg`, el día no tiene `peak`).
     */
    periods: {
        hour: {
            label: 'Hora',
            chartTitle: 'Tendencia del tráfico',
            peak: 'Hora punta',
            trend: 'Hora actual vs. hora anterior',
            /** Formatos de fecha/hora mostrados (tokens de dayjs), definidos por idioma para que las marcas sigan el idioma de la interfaz */
            format: {
                tooltip: 'D MMM YYYY [a las] H',
                chart: 'H[h]',
                tablePeriod: 'H[h]',
                tableDateLabel: 'D MMM YYYY',
            },
        },
        day: {
            label: 'Día',
            chartTitle: 'Tendencia del tráfico',
            avg: 'Tráfico medio diario',
            trend: 'Hoy vs. ayer',
            /** Formatos de fecha/hora mostrados (tokens de dayjs), definidos por idioma para que las marcas sigan el idioma de la interfaz */
            format: {
                tooltip: 'D MMM YYYY',
                chart: 'D MMM',
                tablePeriod: 'D MMM',
                tableDateLabel: 'MMM YYYY',
            },
        },
        month: {
            label: 'Mes',
            chartTitle: 'Comparación mes a mes',
            avg: 'Tráfico medio mensual',
            peak: 'Mes pico',
            trend: 'Este mes vs. mes pasado',
            /** Formatos de fecha/hora mostrados (tokens de dayjs), definidos por idioma para que las marcas sigan el idioma de la interfaz */
            format: {
                tooltip: 'MMM YYYY',
                chart: 'MMM YYYY',
                tablePeriod: 'MMM',
                tableDateLabel: 'YYYY',
            },
        },
        year: {
            label: 'Año',
            chartTitle: 'Comparación mes a mes',
            avg: 'Tráfico medio anual',
            peak: 'Año pico',
            trend: 'Este año vs. año pasado',
            /** Formatos de fecha/hora mostrados (tokens de dayjs), definidos por idioma para que las marcas sigan el idioma de la interfaz */
            format: {
                tooltip: 'YYYY',
                chart: 'YYYY',
                tablePeriod: 'YYYY',
            },
        },
    },

    /**
     * Textos de gráficos: etiquetas de conjuntos de datos, tooltips, leyendas
     * y elementos de los gráficos. Las constantes LABEL de periodChartData.ts
     * contienen estas claves.
     */
    chart: {
        trafficWithUnit: 'Tráfico ({unit})',
        ghostLine: 'Periodo anterior',
        avgLine: 'Media histórica',
        movingAverage: 'Media móvil de {days} día | Media móvil de {days} días',
        lastWeek: 'Mismo día de la semana pasada',
        rxCumulative: 'RX acumulado',
        txCumulative: 'TX acumulado',
        tooltipValue: '{label}: {value}',
        tooltipNoData: '{label}: --',
        cumulativeTip: '{label}: {total} (este periodo {current})',
        yoy: {
            breakdownTip: '{label}: {total} (RX {rx} · TX {tx})',
            cumulativeTip: '{label}: {total} (este mes {current})',
            changeTip: 'Interanual {year}: {percent}',
            inProgress: 'En curso',
        },
        mode: {
            label: 'Modo de gráfico',
            bar: 'Barras',
            area: 'Área',
            cumulative: 'Acumulado',
        },
        panel: {
            composition: 'Composición del tráfico',
        },
        table: {
            detailTitle: 'Detalles de datos',
        },
        heatmap: {
            less: 'Menos',
            more: 'Más',
            cellTip: '{date}\nRX: {rx}\nTX: {tx}\nTotal: {total}',
        },
        legend: {
            low: 'Bajo',
            high: 'Alto',
        },
        hourlyProfile: {
            aria: 'Perfil de tráfico de 24 horas',
            cellTip: '{time} · media {avg}',
            cellTipToday: '{time} · media {avg} · hoy {today}',
            hoverHint: 'Pasa el cursor para ver los valores reales de hoy',
        },
        weekHour: {
            aria: 'Mapa de calor de tráfico por día de la semana y hora',
            cellTip: '{weekday} {time} · {total}',
        },
        yearCard: {
            inProgress: 'En curso',
            yoy: 'Interanual {percent}',
            monthlyAvg: 'Media mensual {value}',
            peak: 'Pico {month} {value}',
            rxShare: 'RX {percent}%',
        },
    },

    /**
     * Páginas de periodos de tráfico: tarjetas de estadísticas, panel lateral,
     * récord vs. hoy, cuota mensual, insights y tabla del periodo.
     */
    period: {
        format: {
            month: 'MMM YYYY',
        },
        stats: {
            total: {
                hour: 'Total 24 h',
                day: 'Total de {count} día | Total de {count} días',
                month: 'Total de {count} mes | Total de {count} meses',
                year: 'Total de {count} año | Total de {count} años',
            },
            compareLabel: 'vs. periodo anterior',
        },
        compare: {
            window: {
                hour: 'Últimas 24 h vs. 24 h anteriores',
                day: 'Últimos 7 días vs. 7 días anteriores',
                month: 'Este mes vs. mes pasado',
                year: 'Este año vs. año pasado',
            },
        },
        table: {
            columns: {
                period: 'Periodo',
                periodHour: 'Hora',
                periodDay: 'Fecha',
                received: 'Recibido',
                sent: 'Enviado',
                total: 'Total',
                avgSpeed: 'Vel. media',
            },
        },
        insights: {
            day: {
                avgWithCompare:
                    'Media diaria del periodo de {days} día: {avg}, {change}% vs. el periodo anterior de {days} día | Media diaria de los últimos {days} días: {avg}, {change}% vs. los {days} días anteriores',
                avgOnly:
                    'Media diaria del periodo de {days} día: {avg} | Media diaria de los últimos {days} días: {avg}',
                peak: 'Día pico {date} ({size})',
            },
            hour: {
                peakSingle: 'Pico a las {start}, {share}% del día',
                peakBand: 'Horas pico de {start} a {end}, {share}% del día',
                recent: 'Total de las últimas 24 h: {total}, {ratio}x la media diaria histórica',
                recentWithSpeed:
                    'Total de las últimas 24 h: {total}, velocidad media {speed}, {ratio}x la media diaria histórica',
            },
            month: {
                projection: 'Media diaria de este mes {avg}; total proyectado al fin de mes {projected}',
                pastTotal: 'Total de {month}: {total}',
                peak: 'Mes pico: {month} ({size})',
            },
            year: {
                insufficient: 'Aún no hay datos anuales suficientes para una comparación interanual fiable',
                compare: '{year} registró {total}, {change}% vs. el año anterior',
                recorded: '{year} registró {total}',
            },
        },
        record: {
            title: 'Hoy {today} / récord {record} · {percent}%',
            reached: 'Récord igualado',
            remaining: 'Faltan {remaining} para alcanzar el récord',
        },
        quota: {
            thisMonth: 'Este mes',
            used: '{month}: {used} / {quota} GiB · {percent}%',
            notSet: 'Sin cuota mensual de tráfico definida',
            adjust: 'Ajustar cuota de tráfico',
            set: 'Definir cuota de tráfico',
            panelTitle: 'Cuota mensual de tráfico',
            inputLabel: 'Cantidad de tráfico mensual',
            placeholder: 'Deja en blanco para quitar la cuota',
            clear: 'Borrar',
            stateSet: 'Definida en {quota} GiB',
            stateUnset: 'Sin definir',
            projection: 'Total proyectado al fin de mes {projected}',
            projectionWithPercent: '{projected} proyectados al fin de mes ({percent}% de la cuota)',
        },
        calendar: {
            title: 'Tráfico del último año',
        },
        hourly: {
            profileTitle: 'Perfil de 24 horas',
            weekHourTitle: 'Distribución por día de la semana y hora',
        },
        yearCompare: {
            title: 'Comparación de años',
        },
        peakStrip: {
            label: 'Horas pico',
        },
    },

    /** Página de monitorización en directo: cabecera, área de gráficos, barra lateral, tarjetas inferiores y tooltips de uPlot. */
    live: {
        header: {
            rxLabel: 'RX',
            txLabel: 'TX',
            todayTotal: 'Total de hoy',
            samples: '{count} muestra | {count} muestras',
        },
        compact: {
            title: 'Últimas 24 horas',
            total: 'Total',
            vsRecentPeak: 'Vs. pico de 3 h',
        },
        chart: {
            title: 'Velocidad en directo',
            historyHint: 'Arrastra la línea de tiempo para repetir las últimas 48 horas',
            thresholdTitle: 'Umbral de velocidad',
            thresholdLabel: 'Valor del umbral de velocidad',
            thresholdSet: 'Definir umbral de velocidad',
            thresholdActive: 'Umbral de velocidad: {value} Mbps (pulsa para definir)',
            thresholdPlaceholder: 'Deja vacío para desactivar',
            thresholdClear: 'Borrar',
            thresholdOn: 'Activado: {value} Mbps',
            thresholdOff: 'Sin definir',
            replaying: 'Repitiendo',
            replayTag: 'Repetición',
            historyTag: '48h',
            exitReplay: 'Volver al modo en directo',
            replayTimeline: 'Línea de tiempo de repetición',
            liveTag: 'En directo',
            connecting: 'Conectando…',
        },
        sidebar: {
            peak: 'Velocidad punta',
            trough: 'Velocidad mínima',
            at: 'a las {time}',
            fiveMinTotal: 'Total de 5 min',
            uptime: 'Tiempo activo',
            days: '{count} día | {count} días',
            since: 'desde el {date}',
            monthlyTotal: 'Este mes / total',
            today: 'hoy',
        },
        bottom: {
            packetRate: 'Tasa de paquetes',
            trendTitle: 'Últimas 3 horas',
            top5Title: 'Top 5 de días',
            noData: 'Sin datos',
            ppsTooltip: '{label}: {value} PPS',
        },
        axis: {
            now: 'ahora',
        },
        tooltip: {
            rxRow: 'RX {value}',
            txRow: 'TX {value}',
        },
    },

    /** Textos de la página Acerca de (hero, destacados, pipeline, tarjeta inferior). */
    about: {
        hero: {
            subtitle: 'Panel moderno de monitorización del tráfico de red',
            badgeOpenSource: 'Código abierto',
            toolName: 'vnStat',
            description:
                'vnStat Web es una interfaz web para el monitor de tráfico {tool}, con monitorización en tiempo real, gráficos históricos desde horas hasta años y gestión de múltiples interfaces en un solo lugar. El backend está escrito en Rust y transmite actualizaciones por segundo mediante SSE.',
        },
        highlights: {
            sectionTitle: 'Capacidades principales',
            realtime: {
                label: 'Monitorización en tiempo real',
                desc: 'Envío SSE, actualizado cada segundo',
            },
            history: {
                label: 'Estadísticas históricas',
                desc: 'Vistas por hora, día, mes y año',
            },
            multiInterface: {
                label: 'Multiinterfaz',
                desc: 'Cambia entre las interfaces monitorizadas',
            },
            darkTheme: {
                label: 'Tema oscuro',
                desc: 'Sigue al sistema o cambia manualmente',
            },
        },
        pipeline: {
            sectionTitle: 'Pipeline de datos',
            daemon: {
                label: 'Daemon de vnStat',
                desc: 'Recolección de contadores de interfaz del kernel',
            },
            backend: {
                label: 'Backend en Rust',
                desc: 'API de alto rendimiento',
            },
            channel: {
                label: 'Canal en tiempo real SSE',
                desc: 'Envío por segundo desde el servidor',
            },
            panel: {
                label: 'Panel web',
                desc: 'Visualización en el navegador',
            },
        },
        bottomCard: {
            sectionFeatures: 'Funciones',
            sectionTech: 'Stack tecnológico',
            sectionLinks: 'Enlaces relacionados',
            sectionCredits: 'Créditos',
            groupRealtime: 'Tiempo real y monitorización',
            features: {
                monitoring: {
                    desc: 'Velocidades de interfaz en tiempo real y vista general del tráfico',
                },
                overview: {
                    desc: 'Gestión unificada de múltiples interfaces',
                },
                autoRefresh: {
                    label: 'Actualización automática',
                    desc: 'Obtiene los datos más recientes cada minuto',
                },
                hourly: {
                    desc: 'Distribución del tráfico por hora',
                },
                daily: {
                    desc: 'Tendencias diarias del tráfico',
                },
                monthly: {
                    desc: 'Vista general del tráfico mensual',
                },
                yearly: {
                    desc: 'Tendencias anuales del tráfico',
                },
                top: {
                    desc: 'Periodos con más tráfico (Top N)',
                },
            },
            link: {
                frontend: 'Código fuente del frontend',
                backend: 'Código fuente del backend',
                issues: 'Informar de problemas',
                official: 'Sitio web de vnStat',
            },
            credits:
                'Gracias a los proyectos de código abierto Vue 3, Chart.js, Pinia y Vite, y a Teemu Toivonen, autor de {vnstat}, por años de mantenimiento.',
        },
    },

    /** Página de clasificación de tráfico. */
    top: {
        metrics: {
            records: 'Registros',
            counterSuffix: '',
            totalTraffic: 'Tráfico total',
            peakShare: 'Porcentaje máximo',
        },
        chart: {
            title: 'Clasificación de tráfico',
            hint: 'Top {n} de {total}',
            meanLine: 'Media',
        },
        donut: {
            title: 'Distribución del tráfico',
        },
        table: {
            title: 'Detalles de la clasificación',
            hint: 'Ordenado por tráfico total, descendente',
            rank: 'Posición',
        },
        columns: {
            date: 'Fecha',
            total: 'Total',
            avgSpeed: 'Vel. media',
        },
    },

    /** Notificaciones del catálogo de interfaces (fallos de actualización / carga). */
    catalog: {
        refreshed: 'Datos actualizados',
        refreshFailed: 'Error al actualizar',
        loadFailed: 'Error al cargar la información de la interfaz',
    },
};
