<template>
    <footer class="s2-footer">
        <div class="s2-footer-inner">
            <span class="s2-footer-text">vnstat-web v{{ version }} · BSD 3-Clause License</span>
        </div>
    </footer>
</template>

<script lang="ts" setup>
const version = import.meta.env.VITE_APP_VERSION;
</script>

<style scoped>
.s2-footer {
    flex-shrink: 0;
    min-height: var(--footer-height);
    display: flex;
    align-items: center;
    justify-content: center;
    border-top: 1px solid var(--s2-glass-border, rgba(255, 255, 255, 0.7));
    padding-bottom: env(safe-area-inset-bottom);
    transition: border-color var(--s2-transition, 0.3s cubic-bezier(0.4, 0, 0.2, 1));
}

.s2-footer-inner {
    width: 100%;
    /* Same fluid cap as BaseLayout's .s2-content-wrapper so the footer stays aligned with it */
    max-width: clamp(1440px, calc(100vw - 240px), 1920px);
    margin: 0 auto;
    text-align: center;
    box-sizing: border-box;
    padding: 0 max(12px, 1.5vw);
}

.s2-footer-text {
    color: var(--s2-text-muted, #646c82);
    font-size: 13px;
}

@media (--mobile) {
    .s2-footer-inner {
        padding: 0 max(8px, 1.5vw);
    }
}
</style>
