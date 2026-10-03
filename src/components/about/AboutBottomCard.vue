<template>
    <section class="s2-sheet-section s2-bottom-section s2-reveal">
        <div class="s2-bottom-cols">
            <div class="s2-bottom-col s2-bottom-col--features">
                <h2 class="s2-section-label">{{ $t('about.bottomCard.sectionFeatures') }}</h2>
                <div class="s2-features-list">
                    <div v-for="group in featureGroups" :key="group.label" class="s2-feature-group">
                        <div class="s2-feature-group-label">{{ $t(group.label) }}</div>
                        <div v-for="f in group.items" :key="f.label" class="s2-feature-row">
                            <span class="s2-feature-chip">
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <SvgMarkup :markup="f.icon" />
                                </svg>
                            </span>
                            <div>
                                <div class="s2-feature-label">{{ $t(f.label) }}</div>
                                <div class="s2-feature-desc">{{ $t(f.desc) }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="s2-bottom-col">
                <h2 class="s2-section-label">{{ $t('about.bottomCard.sectionTech') }}</h2>
                <div class="s2-tech-wrap">
                    <span v-for="t in techStack" :key="t.name" class="s2-tech-tag">
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <SvgMarkup :markup="t.icon" />
                        </svg>
                        {{ t.name }}
                    </span>
                </div>
                <h2 class="s2-section-label">{{ $t('about.bottomCard.sectionLinks') }}</h2>
                <div class="s2-links-list">
                    <a
                        v-for="link in links"
                        :key="link.label"
                        class="s2-link-row"
                        :href="link.url"
                        target="_blank"
                        rel="noopener"
                    >
                        <svg
                            v-if="link.icon === 'github'"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path
                                d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"
                            />
                            <path d="M9 18c-4.51 2-5-2-7-2" />
                        </svg>
                        <svg
                            v-else
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        {{ $t(link.label) }}
                    </a>
                </div>
                <h2 class="s2-section-label">{{ $t('about.bottomCard.sectionCredits') }}</h2>
                <p class="s2-credits-text">
                    <i18n-t keypath="about.bottomCard.credits" tag="span">
                        <template #vnstat>
                            <strong>vnStat</strong>
                        </template>
                    </i18n-t>
                </p>
            </div>
        </div>
    </section>
</template>

<script lang="ts" setup>
import SvgMarkup from '@/components/SvgMarkup';
import { featureGroups, techStack, links } from '@/data/about';
</script>

<style scoped>
/* Two-column open layout: vertical hairlines between columns replace standalone cards */
.s2-bottom-cols {
    display: flex;
}
.s2-bottom-col {
    flex: 1;
    min-width: 0;
}
.s2-bottom-col--features {
    flex: 1.4;
    padding-right: 24px;
}
.s2-bottom-col + .s2-bottom-col {
    border-left: 1px solid var(--s2-border);
    transition: border-color var(--s2-transition);
    padding-left: 24px;
}
/* Vertical rhythm for the multiple small sections inside the right column */
.s2-bottom-col .s2-section-label:not(:first-child) {
    margin-top: 22px;
}

.s2-features-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.s2-feature-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.s2-feature-group + .s2-feature-group {
    padding-top: 10px;
    border-top: 1px solid var(--s2-border);
    transition: border-color var(--s2-transition);
}
.s2-feature-group-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--s2-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 2px;
}
.s2-feature-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
}

.s2-feature-chip {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--brand);
    background: var(--brand-soft);
    transition: transform var(--s2-transition);
}
.s2-feature-row:hover .s2-feature-chip {
    transform: translateY(-1px);
}

.s2-feature-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--s2-text);
    line-height: 28px;
    transition: color var(--s2-transition);
}
.s2-feature-row:hover .s2-feature-label {
    color: var(--brand);
}
.s2-feature-desc {
    font-size: 11px;
    color: var(--s2-text-muted);
}

.s2-tech-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}
.s2-tech-tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border: 1px solid var(--s2-border);
    border-radius: 4px;
    font-size: 12px;
    color: var(--s2-text);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    transition: border-color var(--s2-transition);
}
.s2-tech-tag:hover {
    border-color: var(--brand);
}
.s2-tech-tag svg {
    flex-shrink: 0;
}

.s2-links-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.s2-link-row {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: var(--s2-text);
    text-decoration: none;
    padding: 8px 12px;
    border-radius: var(--s2-radius-xs);
    border-left: 3px solid transparent;
    transition:
        background var(--s2-transition),
        border-color var(--s2-transition),
        color var(--s2-transition);
}
.s2-link-row svg {
    flex-shrink: 0;
    color: var(--s2-text-muted);
    transition: color var(--s2-transition);
}
.s2-link-row:hover {
    background: var(--s2-hover-bg);
    border-left-color: var(--brand);
    color: var(--brand);
}
.s2-link-row:hover svg {
    color: var(--brand);
}

.s2-credits-text {
    font-size: 12px;
    line-height: 1.7;
    color: var(--s2-text-muted);
    margin: 0;
}
.s2-credits-text strong {
    color: var(--s2-text);
    font-weight: 600;
}

/* The .s2-reveal rules live in theme-s2.css so every reveal target shares one definition */

@media (--mobile) {
    .s2-bottom-cols {
        flex-direction: column;
    }
    .s2-bottom-col--features {
        padding-right: 0;
    }
    .s2-bottom-col + .s2-bottom-col {
        border-left: none;
        border-top: 1px solid var(--s2-border);
        padding-left: 0;
        padding-top: 20px;
        margin-top: 20px;
    }
}
</style>
