<template>
    <section class="s2-sheet-section s2-highlights-section s2-reveal">
        <h2 class="s2-section-label">{{ $t('about.highlights.sectionTitle') }}</h2>
        <div class="s2-highlights-grid">
            <div v-for="item in highlights" :key="item.label" class="s2-highlight-col" :style="{ '--accent': item.bg }">
                <div class="s2-hl-chip">
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <SvgMarkup :markup="item.icon" />
                    </svg>
                </div>
                <div class="s2-hl-label">{{ $t(item.label) }}</div>
                <div class="s2-hl-desc">{{ $t(item.desc) }}</div>
            </div>
        </div>
    </section>
</template>

<script lang="ts" setup>
import SvgMarkup from '@/components/SvgMarkup';
import { palette } from '@/config/colors';

/**
 * Core capabilities. `label` / `desc` are i18n message keys (about.highlights.*)
 * resolved with t() in the template so the copy follows the active locale.
 */
const highlights = [
    {
        label: 'about.highlights.realtime.label',
        desc: 'about.highlights.realtime.desc',
        bg: palette.brand,
        icon: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    },
    {
        label: 'about.highlights.history.label',
        desc: 'about.highlights.history.desc',
        bg: palette.rx,
        icon: '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
    },
    {
        label: 'about.highlights.multiInterface.label',
        desc: 'about.highlights.multiInterface.desc',
        bg: palette.tx,
        icon: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
    },
    {
        label: 'about.highlights.darkTheme.label',
        desc: 'about.highlights.darkTheme.desc',
        // Dark semantic color: brand and tx mixed 6:4 into indigo to avoid clashing with the first three
        bg: `color-mix(in srgb, ${palette.brand} 60%, ${palette.tx})`,
        icon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    },
];
</script>

<style scoped>
.s2-highlights-grid {
    display: flex;
}
/* Open grid: vertical hairlines between columns replace small cards */
.s2-highlight-col {
    flex: 1;
    min-width: 0;
    padding: 4px 20px;
    cursor: default;
}
.s2-highlight-col:first-child {
    padding-left: 0;
}
.s2-highlight-col:last-child {
    padding-right: 0;
}
.s2-highlight-col + .s2-highlight-col {
    border-left: 1px solid var(--s2-border);
    transition: border-color var(--s2-transition);
}

.s2-hl-chip {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    margin-bottom: 12px;
    transition: transform var(--s2-transition);
}

.s2-hl-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--s2-text);
    transition: color var(--s2-transition);
}
.s2-hl-desc {
    font-size: 12px;
    color: var(--s2-text-muted);
    margin-top: 3px;
}
/* Hover feedback: chip shifts slightly + title takes the accent color */
.s2-highlight-col:hover .s2-hl-chip {
    transform: translateY(-2px);
}
.s2-highlight-col:hover .s2-hl-label {
    color: var(--accent);
}

/* The .s2-reveal rules live in theme-s2.css so every reveal target shares one definition */

@media (--mobile) {
    .s2-highlights-grid {
        flex-wrap: wrap;
        gap: 20px 0;
    }
    .s2-highlight-col {
        flex: 0 0 50%;
        box-sizing: border-box;
        padding: 0 12px;
    }
    .s2-highlight-col:first-child {
        padding-left: 0;
    }
    .s2-highlight-col:nth-child(even) {
        padding-right: 0;
    }
    /* Hide vertical lines on mobile, use row spacing instead */
    .s2-highlight-col + .s2-highlight-col {
        border-left: none;
    }
}
</style>
