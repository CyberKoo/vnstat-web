<template>
    <!-- Skip link: first focusable element of the app; sends keyboard users straight to the
         page heading, past the header bar and the whole navigation tree -->
    <a class="s2-skip-link" href="#page-heading">{{ $t('layout.skipToContent') }}</a>

    <!-- Top bar (separate from the layout shell to avoid blocking Liquid Glass) -->
    <LayoutHeader
        :class="headerClass"
        :style="headerStyle"
        :is-mobile="isMobile"
        :is-dark="themeStore.isDark"
        :refreshing="refreshing"
        @refresh="refresh"
        @toggle-dark="themeStore.toggleDark"
        @open-drawer="drawerVisible = true"
    />

    <!-- Main layout (no overflow, scrolling is taken over by html) -->
    <div class="s2-layout" :class="{ 's2-dimmed': drawerDimming }" :style="layoutStyle">
        <!-- Desktop sidebar -->
        <LayoutSider
            v-if="!isMobile"
            :collapsed="collapsed"
            :interface-options="interfaceStore.options"
            :selected-interface="interfaceStore.selected"
            :is-loaded="interfaceStore.isLoaded"
            @update:collapsed="collapsed = $event"
            @update:selected-interface="interfaceStore.setSelectedInterface($event)"
        />

        <!-- Sidebar collapse edge handle (desktop, floating on the sidebar's right edge) -->
        <button
            v-if="!isMobile"
            class="s2-sider-edge-handle"
            :style="{ left: collapsed ? '56px' : '192px' }"
            :title="collapsed ? $t('layout.expandSider') : $t('layout.collapseSider')"
            :aria-label="collapsed ? $t('layout.expandSider') : $t('layout.collapseSider')"
            @click="collapsed = !collapsed"
        >
            <svg
                v-if="collapsed"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <polyline points="9,6 15,12 9,18" />
            </svg>
            <svg
                v-else
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <polyline points="15,6 9,12 15,18" />
            </svg>
        </button>

        <!-- Right side area -->
        <div class="s2-right-panel">
            <div class="s2-content-scroll-area">
                <!-- Custom mobile drawer -->
                <MobileDrawer
                    :visible="drawerVisible"
                    :interface-options="interfaceStore.options"
                    :selected-interface="interfaceStore.selected"
                    @close="drawerVisible = false"
                    @update:dimming="drawerDimming = $event"
                    @update:selected-interface="interfaceStore.setSelectedInterface($event)"
                />

                <!-- Page-level heading for assistive tech (every route declares meta.titleKey);
                     visually hidden, the breadcrumb is the sighted equivalent. It lives outside the
                     keyed page surface below so it survives the out-in swap and can take focus on
                     every navigation (driven from useRouteChrome) -->
                <h1
                    v-if="pageTitleKey"
                    id="page-heading"
                    ref="pageHeading"
                    class="s2-page-heading s2-visually-hidden"
                    tabindex="-1"
                >
                    {{ $t(pageTitleKey) }}
                </h1>

                <router-view v-slot="{ Component }">
                    <!-- Page switch transition: content and footer swap as one keyed surface
                         (out-in), while the header above stays put -->
                    <Transition name="s2-page" mode="out-in">
                        <div :key="route.path" class="s2-page-switch">
                            <main class="s2-content-wrapper">
                                <component :is="Component" />
                            </main>
                            <LayoutFooter />
                        </div>
                    </Transition>
                </router-view>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useMobile } from '@/composables/useMobile';
import { useRoute } from 'vue-router';

import { useThemeStore } from '@/stores/theme';
import { useSettingsStore } from '@/stores/settings';
import { useInterfaceStore } from '@/stores/interface';
import { useInterfaceCatalog } from '@/composables/useInterfaceCatalog';
import { useRouteChrome } from '@/composables/useRouteChrome';

import LayoutSider from '@/components/LayoutSider.vue';
import LayoutHeader from '@/components/LayoutHeader.vue';
import MobileDrawer from '@/components/MobileDrawer.vue';
import LayoutFooter from '@/components/LayoutFooter.vue';

const route = useRoute();

const themeStore = useThemeStore();
const settingsStore = useSettingsStore();
const interfaceStore = useInterfaceStore();

const { sidebarCollapsed: collapsed } = storeToRefs(settingsStore);
const drawerVisible = ref(false);
const drawerDimming = ref(false);
const { refresh, refreshing } = useInterfaceCatalog();
/** Focus target on route changes: the visually hidden page heading rendered below */
const pageHeading = ref<HTMLElement | null>(null);
useRouteChrome(drawerVisible, pageHeading);

const { isMobile } = useMobile();

/** Current route's titleKey (drives the visually hidden page h1) */
const pageTitleKey = computed(() => route.meta.titleKey as string | undefined);

const layoutStyle = computed(() => ({
    overflow: isMobile.value ? 'visible' : 'hidden',
}));

/** Header left offset = desktop sider width, 0 on mobile; the transition is declared uniformly by LayoutHeader's styles */
const headerStyle = computed(() => ({
    left: isMobile.value ? '0' : collapsed.value ? '56px' : '192px',
}));

const headerClass = computed(() => ({
    's2-app-header': true,
    's2-app-header--mobile': isMobile.value,
    's2-dimmed': drawerDimming.value,
}));

watch(isMobile, (val) => {
    if (!val) drawerVisible.value = false;
});
</script>

<style scoped>
/*
 * Layout shell: a viewport-filling row that hosts the sider and the right panel.
 * Overflow is driven inline (visible on mobile, hidden on desktop) because the mobile
 * liquid-glass effect needs the page itself to scroll.
 */
.s2-layout {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: row;
    box-sizing: border-box;
    /*
     * Base type scale for everything in the rail and the content area. Plain text nodes that do
     * not set their own size (the interface row, sidebar stats) line their boxes against this, so
     * changing it shifts the whole rail.
     */
    font-size: 14px;
    line-height: 1.6;
    /* Page backdrop: transparent on purpose (see --s2-layout-backdrop) so the aurora layer
       shows through and the glass surfaces have something to refract */
    background: var(--s2-layout-backdrop);
    transition:
        background var(--s2-transition),
        filter 0.2s ease-out,
        opacity 0.2s ease-out;
}

.s2-app-header {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 100;
    height: calc(var(--header-height) + env(safe-area-inset-top));
}

.s2-app-header--mobile {
    left: 0;
}

/* Sidebar collapse edge handle: glass vertical pill floating on the sidebar's right edge */
.s2-sider-edge-handle {
    position: fixed;
    top: 50vh;
    transform: translate(-50%, -50%);
    z-index: 101;
    width: 22px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 1px solid var(--s2-glass-border, var(--s2-border, #d8dce8));
    border-radius: 999px;
    background: var(--s2-glass-bg-strong, rgba(255, 255, 255, 0.62));
    backdrop-filter: blur(var(--s2-glass-blur, 18px)) saturate(var(--s2-glass-saturate, 180%));
    -webkit-backdrop-filter: blur(var(--s2-glass-blur, 18px)) saturate(var(--s2-glass-saturate, 180%));
    color: var(--s2-text-muted, #646c82);
    cursor: pointer;
    box-shadow: var(--s2-shadow-lg, 0 12px 40px rgba(16, 24, 40, 0.1));
    transition:
        left 0.3s cubic-bezier(0.4, 0, 0.2, 1),
        color 0.2s ease,
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        background var(--s2-transition, 0.3s ease);
}

.s2-sider-edge-handle:hover {
    color: var(--brand, #7c5cff);
    border-color: var(--brand, #7c5cff);
    box-shadow:
        0 0 0 4px var(--brand-bg, rgba(124, 92, 255, 0.1)),
        var(--s2-shadow-lg, 0 12px 40px rgba(16, 24, 40, 0.1));
}

/* focus-visible ring comes from the shared control-state rules in theme-s2.css */

.s2-right-panel {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: visible;
    min-width: 0;
    height: 100%;
    padding-top: calc(var(--header-height) + env(safe-area-inset-top));
    box-sizing: border-box;
}

/* Page surface: the landmark, the column flex and the max-width cap in a single box
   (formerly a nested wrapper pair; the inner one added nothing but the cap) */
.s2-content-wrapper {
    flex: 1;
    margin: 0 auto;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 1440px;
}

@media (min-width: 2560px) {
    .s2-content-wrapper {
        max-width: 1920px;
    }
}

/* Focus target after each navigation (see useRouteChrome): the heading is clipped to nothing by
   .s2-visually-hidden, so its programmatic-focus outline must not paint anything either. Scoped to
   this component, so the other .s2-visually-hidden users (table captions) are untouched. */
.s2-page-heading:focus {
    outline: none;
}

/*
 * Skip link: .s2-visually-hidden's clip pattern until focused, then a fixed pill above the glass
 * chrome (z over the 100/101 header and edge handle). :focus rather than :focus-visible on
 * purpose — it must show for every activation path, mouse click included.
 */
.s2-skip-link {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
}

.s2-skip-link:focus {
    position: fixed;
    top: 12px;
    left: 12px;
    z-index: 200;
    width: auto;
    height: auto;
    padding: 10px 16px;
    overflow: visible;
    clip: auto;
    clip-path: none;
    white-space: normal;
    border-radius: var(--s2-radius-sm, 10px);
    background: var(--s2-glass-bg-strong, rgba(255, 255, 255, 0.92));
    backdrop-filter: blur(var(--s2-glass-blur, 18px)) saturate(var(--s2-glass-saturate, 180%));
    -webkit-backdrop-filter: blur(var(--s2-glass-blur, 18px)) saturate(var(--s2-glass-saturate, 180%));
    color: var(--s2-text, #1c2333);
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    box-shadow: var(--s2-shadow-lg, 0 12px 40px rgba(16, 24, 40, 0.1));
    outline: 2px solid var(--brand);
    outline-offset: 2px;
}

/*
 * Page switch surface: replaces the scroll area as the flex parent of content + footer, so it
 * takes over flex: 1 and the --gap-xl spacing that used to sit between them.
 */
.s2-page-switch {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    gap: var(--gap-xl);
}

/* out-in sequencing: 120ms fade-out of the old page, then a 180ms fade-in that rises 6px */
.s2-page-leave-active {
    transition: opacity 120ms ease;
}

.s2-page-leave-to {
    opacity: 0;
}

.s2-page-enter-active {
    transition:
        opacity 180ms ease,
        transform 180ms ease;
}

.s2-page-enter-from {
    opacity: 0;
    transform: translateY(6px);
}

/* Guarded in this scoped block like the other surfaces (see theme-s2.css note on specificity) */
@media (prefers-reduced-motion: reduce) {
    .s2-page-leave-active,
    .s2-page-enter-active {
        transition: none;
    }
}

.s2-content-scroll-area {
    flex: 1;
    scrollbar-gutter: stable;
    padding: 24px max(12px, 1.5vw) 0;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: var(--gap-xl);
    background: transparent;
    transition: background var(--s2-transition, 0.3s ease);
}

:root.dark .s2-content-scroll-area {
    background: transparent;
}

@media (--mobile) {
    .s2-layout.s2-dimmed {
        /* Give brightness() pixels to dim in empty areas as well as inside the cards. */
        background: var(--s2-bg);
    }

    .s2-content-scroll-area {
        /* Extra bottom room on top of the footer's own safe-area inset: the last content
           rows must also clear iOS 26 Safari's floating toolbar, not just the home indicator */
        padding: 12px max(8px, 1.5vw) calc(24px + env(safe-area-inset-bottom));
    }
}

/* Avoid Firefox's filter/backdrop-filter compositing path for the drawer backdrop. */
@supports (-moz-appearance: none) {
    .s2-layout.s2-dimmed {
        filter: none;
        opacity: 1;
    }
}

/* Keep inner scrolling on desktop (on mobile Liquid Glass is taken over by html) */
@media (--desktop) {
    .s2-content-scroll-area {
        overflow-y: auto;
    }
}
</style>
