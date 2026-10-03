/**
 * Static data for the About page.
 *
 * Display text lives in the message catalogs: `label` / `desc` fields hold
 * i18n message keys (`about.*`, or `menu.*` where a feature has the exact
 * same name as its sidebar entry) and are resolved with t() in the
 * components, so this single data file drives every locale. Icons, colors,
 * URLs and tech names are locale-independent and stay as literals here.
 */

import { palette } from '@/config/colors';

/**
 * Feature groups (features section of AboutBottomCard).
 *
 * `label` / `desc` are message keys.
 */
export const featureGroups = [
    {
        label: 'about.bottomCard.groupRealtime',
        items: [
            {
                label: 'menu.liveStats',
                desc: 'about.bottomCard.features.monitoring.desc',
                icon: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
            },
            {
                label: 'menu.overview',
                desc: 'about.bottomCard.features.overview.desc',
                icon: '<rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>',
            },
            {
                label: 'about.bottomCard.features.autoRefresh.label',
                desc: 'about.bottomCard.features.autoRefresh.desc',
                icon: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
            },
        ],
    },
    {
        label: 'menu.trafficGroup',
        items: [
            {
                label: 'menu.hourly',
                desc: 'about.bottomCard.features.hourly.desc',
                icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
            },
            {
                label: 'menu.daily',
                desc: 'about.bottomCard.features.daily.desc',
                icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
            },
            {
                label: 'menu.monthly',
                desc: 'about.bottomCard.features.monthly.desc',
                icon: '<rect x="2" y="2" width="20" height="20" rx="2"/><line x1="2" y1="8" x2="22" y2="8"/><line x1="8" y1="2" x2="8" y2="22"/>',
            },
            {
                label: 'menu.yearly',
                desc: 'about.bottomCard.features.yearly.desc',
                icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
            },
            {
                label: 'menu.top',
                desc: 'about.bottomCard.features.top.desc',
                icon: '<path d="M6 9l6 6 6-6"/>',
            },
        ],
    },
] as const;

/**
 * Data pipeline (architecture diagram, display only).
 *
 * `label` / `desc` are message keys resolved with t() in AboutPipeline.
 */
export const pipelineSteps = [
    {
        label: 'about.pipeline.daemon.label',
        desc: 'about.pipeline.daemon.desc',
        color: palette.tx,
        icon: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>',
    },
    {
        label: 'about.pipeline.backend.label',
        desc: 'about.pipeline.backend.desc',
        color: palette.accent,
        icon: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>',
    },
    {
        label: 'about.pipeline.channel.label',
        desc: 'about.pipeline.channel.desc',
        color: palette.rx,
        icon: '<circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49"/><path d="M7.76 16.24a6 6 0 0 1 0-8.49"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 19.07a10 10 0 0 1 0-14.14"/>',
    },
    {
        label: 'about.pipeline.panel.label',
        desc: 'about.pipeline.panel.desc',
        color: palette.brand,
        icon: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    },
] as const;

/** Tech stack (brand names, not translated) */
export const techStack = [
    { name: 'Rust', icon: '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>' },
    { name: 'Vue 3', icon: '<path d="M12 2L2 21h20L12 2z"/><path d="M12 2L7.5 21 12 17l4.5 4L12 2z"/>' },
    {
        name: 'TypeScript',
        icon: '<rect x="2" y="2" width="20" height="20" rx="2"/><path d="M9 8h-2v8h2M13 8h-2v8h2M17 12v-4h-2v8h2"/>',
    },
    { name: 'Chart.js', icon: '<path d="M18 20V10M12 20V4M6 20v-6"/>' },
    {
        name: 'Pinia',
        icon: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1.5"/>',
    },
    { name: 'Vite', icon: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>' },
    {
        name: 'SSE',
        icon: '<path d="M8 5a12 12 0 0 1 8 0M6 9a8 8 0 0 1 12 0M10 13a4 4 0 0 1 4 0"/><circle cx="12" cy="16" r="1"/>',
    },
] as const;

/**
 * Related links.
 *
 * `label` is a message key; URLs and icon names are literals.
 */
export const links = [
    { label: 'about.bottomCard.link.frontend', url: 'https://github.com/CyberKoo/vnstat-web', icon: 'github' },
    { label: 'about.bottomCard.link.backend', url: 'https://github.com/CyberKoo/vnstat-rs-api', icon: 'github' },
    { label: 'about.bottomCard.link.issues', url: 'https://github.com/CyberKoo/vnstat-web/issues', icon: 'github' },
    { label: 'about.bottomCard.link.official', url: 'https://humdi.net/vnstat/', icon: '' },
] as const;
