<template>
    <section class="s2-sheet-section s2-hero-section">
        <div class="s2-hero-content">
            <div class="s2-hero-radar">
                <span class="s2-sweep-beam"></span>
                <span class="s2-ping-ring"></span>
                <span class="s2-ping-ring s2-ping-ring--late"></span>
                <RadarMark :size="88" />
            </div>
            <!-- Product wordmark: the page's h1 comes from BaseLayout (meta.titleKey), so a second
                 h1 here would be a duplicate document outline — marked up as h2 to sit below it -->
            <h2 class="s2-hero-title">vn<span class="accent">Stat</span> <span class="web">Web</span></h2>
            <p class="s2-hero-sub">{{ $t('about.hero.subtitle') }}</p>
            <div class="s2-hero-meta">
                <span class="s2-hero-badge">v{{ version }}</span>
                <span class="s2-hero-badge">BSD 3-Clause</span>
                <span class="s2-hero-badge">{{ $t('about.hero.badgeOpenSource') }}</span>
            </div>
            <p class="s2-hero-desc">
                <i18n-t keypath="about.hero.description" tag="span">
                    <template #tool>
                        <strong>{{ $t('about.hero.toolName') }}</strong>
                    </template>
                </i18n-t>
            </p>
        </div>
    </section>
</template>

<script lang="ts" setup>
import RadarMark from '@/components/RadarMark.vue';

const version = import.meta.env.VITE_APP_VERSION ?? '0.0.0';
</script>

<style scoped>
/* Top radius 1px smaller than the sheet, with overflow clipping the background so it does not spill past the glass panel radius */
.s2-hero-section {
    position: relative;
    overflow: hidden;
    padding: 52px 28px 48px;
    border-radius: 19px 19px 0 0;
    text-align: center;
}

/* Blueprint grid: thin lines + radial fade mask */
.s2-hero-section::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
        linear-gradient(color-mix(in srgb, var(--s2-text) 4%, transparent) 1px, transparent 1px),
        linear-gradient(90deg, color-mix(in srgb, var(--s2-text) 4%, transparent) 1px, transparent 1px);
    background-size: 80px 80px;
    mask-image: radial-gradient(ellipse 70% 85% at 50% 42%, black 25%, transparent 78%);
    -webkit-mask-image: radial-gradient(ellipse 70% 85% at 50% 42%, black 25%, transparent 78%);
}

/* Aurora drift */
.s2-hero-section::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
        radial-gradient(
            ellipse 260px 170px at calc(100% - 48px) calc(100% - 32px),
            color-mix(in srgb, var(--brand) 8%, transparent) 0%,
            transparent 70%
        ),
        radial-gradient(
            ellipse 200px 200px at 8% 12%,
            color-mix(in srgb, var(--rx) 6%, transparent) 0%,
            transparent 70%
        );
    animation: heroBgDrift 16s ease-in-out infinite alternate;
}
@keyframes heroBgDrift {
    from {
        transform: translate(-10px, -8px);
    }
    to {
        transform: translate(10px, 8px);
    }
}

.s2-hero-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

/* ── Radar core ── */
.s2-hero-radar {
    position: relative;
    width: 168px;
    height: 168px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
}

/* Sweep beam */
.s2-sweep-beam {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: conic-gradient(from 0deg, color-mix(in srgb, var(--rx) 14%, transparent) 0deg, transparent 70deg);
    animation: heroSpin 8s linear infinite;
}
@keyframes heroSpin {
    to {
        transform: rotate(360deg);
    }
}

/* Expanding ping rings, two circles out of phase */
.s2-ping-ring {
    position: absolute;
    inset: 20px;
    border-radius: 50%;
    border: 1.5px solid color-mix(in srgb, var(--brand) 45%, transparent);
    animation: pingRing 3s cubic-bezier(0, 0, 0.2, 1) infinite;
}
.s2-ping-ring--late {
    animation-delay: 1.5s;
}
@keyframes pingRing {
    0% {
        transform: scale(0.72);
        opacity: 0;
    }
    25% {
        opacity: 0.7;
    }
    100% {
        transform: scale(1.28);
        opacity: 0;
    }
}

.s2-hero-title {
    font-family: var(--font-sans, 'Inter', sans-serif);
    font-size: clamp(30px, 4vw, 44px);
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--s2-text);
    margin: 0;
}
.s2-hero-title .accent {
    color: var(--brand);
}
.s2-hero-title .web {
    color: var(--rx);
}

.s2-hero-sub {
    font-size: 15px;
    color: var(--s2-text-muted);
    margin: 0;
}

.s2-hero-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 6px;
    flex-wrap: wrap;
    justify-content: center;
}
.s2-hero-badge {
    padding: 4px 12px;
    border-radius: 999px;
    border: 1px solid var(--s2-border);
    transition: border-color var(--s2-transition);
    background: color-mix(in srgb, var(--s2-card) 55%, transparent);
    font-size: 12px;
    color: var(--s2-text-muted);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
}

.s2-hero-desc {
    max-width: 520px;
    font-size: 13px;
    line-height: 1.7;
    color: var(--s2-text-muted);
    margin: 8px 0 0;
    /* Avoid a single orphan word/character on the last line */
    text-wrap: pretty;
}
.s2-hero-desc strong {
    color: var(--s2-text);
    font-weight: 600;
}

@media (prefers-reduced-motion: reduce) {
    .s2-sweep-beam,
    .s2-ping-ring,
    .s2-hero-section::after {
        animation: none;
    }
    .s2-ping-ring {
        opacity: 0;
    }
}

@media (--mobile) {
    .s2-hero-section {
        padding: 36px 16px 32px;
        border-radius: 17px 17px 0 0;
    }
    .s2-hero-radar {
        width: 136px;
        height: 136px;
        margin-bottom: 6px;
    }
}
</style>
