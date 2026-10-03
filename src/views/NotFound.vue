<template>
    <div class="s2-sheet s2-notfound">
        <div class="s2-nf-code">404</div>
        <h2 class="s2-nf-title">{{ $t('notFound.title') }}</h2>
        <div class="s2-nf-desc">{{ $t('notFound.desc') }}</div>
        <button type="button" class="s2-btn" @click="goHome">{{ $t('notFound.home') }}</button>
    </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';
const router = useRouter();
function goHome() {
    router.replace({ path: '/' });
}
</script>

<style scoped>
.s2-notfound {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: 8px;
    /* The sheet supplies the frame but no padding; keep the content off the card edges.
       Horizontal inset matches .s2-sheet-section (28px desktop / 16px mobile) so this page lines
       up with the rest of the app. */
    padding: 48px 28px;
    box-sizing: border-box;
}

@media (--mobile) {
    .s2-notfound {
        padding: 48px 16px;
    }
}

.s2-nf-code {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: clamp(72px, 10vw, 120px);
    font-weight: 400;
    line-height: 1;
    letter-spacing: -0.04em;
    /* Brand color → tx gradient watermark number, darkened with color-mix to stay understated */
    background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--brand) 45%, transparent),
        color-mix(in srgb, var(--tx) 45%, transparent)
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    color: transparent;
}

.s2-nf-title {
    /* h2 carries UA block margins; the div had none, so keep the computed margin at 0 */
    margin: 0;
    font-family: var(--font-sans, 'Inter', sans-serif);
    font-size: clamp(20px, 2.5vw, 28px);
    font-weight: 600;
    color: var(--s2-text);
}

.s2-nf-desc {
    font-size: 14px;
    color: var(--s2-text-muted);
    margin-bottom: 12px;
}

.s2-btn {
    padding: 8px 24px;
    border-radius: 999px;
    background: var(--s2-glass-bg-strong);
    backdrop-filter: blur(var(--s2-glass-blur)) saturate(var(--s2-glass-saturate));
    -webkit-backdrop-filter: blur(var(--s2-glass-blur)) saturate(var(--s2-glass-saturate));
    border: 1px solid var(--s2-glass-border);
    box-shadow: var(--s2-shadow);
    color: var(--s2-text);
    font-size: 14px;
    font-family: var(--font-sans, 'Inter', sans-serif);
    cursor: pointer;
    transition:
        border-color var(--s2-transition),
        color var(--s2-transition),
        transform var(--s2-transition),
        box-shadow var(--s2-transition);
}

.s2-btn:hover {
    border-color: var(--brand);
    color: var(--brand);
    transform: translateY(-1px);
    box-shadow: var(--s2-shadow-lg);
}
</style>
