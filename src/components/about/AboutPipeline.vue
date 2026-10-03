<template>
    <section class="s2-sheet-section s2-pipeline-section s2-reveal">
        <h2 class="s2-section-label">{{ $t('about.pipeline.sectionTitle') }}</h2>
        <div class="s2-pipeline">
            <template v-for="(step, i) in pipelineSteps" :key="step.label">
                <div class="s2-pipe-step" :style="{ '--accent': step.color }">
                    <div class="s2-pipe-icon">
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
                            <SvgMarkup :markup="step.icon" />
                        </svg>
                    </div>
                    <div class="s2-pipe-label">{{ $t(step.label) }}</div>
                    <div class="s2-pipe-desc">{{ $t(step.desc) }}</div>
                </div>
                <div v-if="i < pipelineSteps.length - 1" class="s2-pipe-connector">
                    <span class="s2-pipe-pulse" :style="{ animationDelay: i * 0.75 + 's' }"></span>
                </div>
            </template>
        </div>
    </section>
</template>

<script lang="ts" setup>
import SvgMarkup from '@/components/SvgMarkup';
import { pipelineSteps } from '@/data/about';
</script>

<style scoped>
.s2-pipeline {
    display: flex;
    align-items: flex-start;
}

.s2-pipe-step {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.s2-pipe-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    transition: transform var(--s2-transition);
}
.s2-pipe-step:hover .s2-pipe-icon {
    transform: translateY(-2px);
}

.s2-pipe-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--s2-text);
    margin-top: 10px;
    transition: color var(--s2-transition);
}
.s2-pipe-step:hover .s2-pipe-label {
    color: var(--accent);
}

.s2-pipe-desc {
    font-size: 12px;
    color: var(--s2-text-muted);
    margin-top: 3px;
}

/* Connector line: aligned with the icon center */
.s2-pipe-connector {
    flex: 0 0 40px;
    position: relative;
    height: 1px;
    margin-top: 20px;
    background: var(--s2-border);
    transition: background-color var(--s2-transition);
}

/* Pulse dots sliding along the line, chasing each other */
.s2-pipe-pulse {
    position: absolute;
    top: -1.5px;
    left: 0;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--brand);
    box-shadow: 0 0 6px var(--brand);
    animation: pipePulse 3s linear infinite;
}
@keyframes pipePulse {
    0% {
        left: 0;
        opacity: 0;
    }
    15% {
        opacity: 1;
    }
    85% {
        opacity: 1;
    }
    100% {
        left: calc(100% - 4px);
        opacity: 0;
    }
}

@media (prefers-reduced-motion: reduce) {
    .s2-pipe-pulse {
        animation: none;
        opacity: 0;
    }
}

@media (--mobile) {
    .s2-pipeline {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px 0;
    }
    .s2-pipe-connector {
        display: none;
    }
}
</style>
