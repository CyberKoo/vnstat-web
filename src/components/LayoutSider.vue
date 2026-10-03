<template>
    <aside class="s2-sider" :class="{ 's2-sider--collapsed': collapsed }">
        <div class="s2-sider-content">
            <div class="s2-sider-logo">
                <AppLogo :collapsed="collapsed" />
            </div>
            <div class="s2-sider-iface-wrap" :class="{ collapsed, 'is-loaded': isLoaded }">
                <!-- Loading skeleton — exact same dimensions as real content, zero layout shift -->
                <div
                    v-if="!isLoaded"
                    class="s2-skeleton s2-skeleton--bordered s2-select-skeleton"
                    :class="{ collapsed }"
                    aria-hidden="true"
                />

                <!-- Collapsed state: icon form; clicking with multiple interfaces pops a dropdown to switch, single interface only shows a tooltip -->
                <template v-else-if="collapsed">
                    <DropdownMenu
                        v-if="interfaceOptions.length > 1"
                        align="start"
                        :options="ifaceDropdownOptions"
                        @select="(key: string) => $emit('update:selectedInterface', key)"
                    >
                        <template #trigger="{ open }">
                            <button
                                class="s2-iface-icon-btn"
                                :title="selectedInterface"
                                :aria-label="selectedInterface"
                                aria-haspopup="menu"
                                :aria-expanded="open"
                            >
                                <icon-mdi-ethernet />
                            </button>
                        </template>
                    </DropdownMenu>
                    <Tooltip v-else placement="right" :delay="300" :content="selectedInterface">
                        <!-- Display-only identity echo (single interface): not a button, the name
                             is exposed as an img-role label since the tooltip is hover-only -->
                        <span class="s2-iface-icon-btn" role="img" :aria-label="selectedInterface">
                            <icon-mdi-ethernet />
                        </span>
                    </Tooltip>
                </template>

                <!-- Loaded: multiple interfaces → dropdown selector -->
                <select
                    v-else-if="interfaceOptions.length > 1"
                    :value="selectedInterface"
                    class="s2-sidebar-select"
                    :aria-label="$t('layout.interface')"
                    @change="(e: Event) => $emit('update:selectedInterface', (e.target as HTMLSelectElement).value)"
                >
                    <option v-for="opt in interfaceOptions" :key="opt.value" :value="opt.value">
                        {{ opt.label }}
                    </option>
                </select>

                <!-- Loaded: single interface → static identity row (no interactive styling, echoes the select shape / collapsed icon button) -->
                <div v-else class="s2-sidebar-iface-single">
                    <icon-mdi-ethernet />
                    <span>{{ selectedInterface }}</span>
                </div>
            </div>
            <AppMenu :collapsed="collapsed" />
        </div>
    </aside>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import DropdownMenu from '@/components/ui/DropdownMenu.vue';
import Tooltip from '@/components/ui/Tooltip.vue';

const props = defineProps<{
    collapsed: boolean;
    interfaceOptions: { label: string; value: string }[];
    selectedInterface: string;
    isLoaded: boolean;
}>();

defineEmits<{
    'update:collapsed': [value: boolean];
    'update:selectedInterface': [value: string];
}>();

const ifaceDropdownOptions = computed(() => props.interfaceOptions.map((o) => ({ label: o.label, key: o.value })));
</script>

<style scoped>
/* Glass sider surface. The width transition keeps the collapse in step with the
   edge handle and header offsets, which animate on the same --s2-transition curve. */
.s2-sider {
    position: relative;
    z-index: 1;
    display: flex;
    flex: 0 0 auto;
    width: 192px;
    height: 100%;
    box-sizing: border-box;
    background: var(--s2-glass-bg-strong, rgba(255, 255, 255, 0.62));
    backdrop-filter: blur(var(--s2-glass-blur, 18px)) saturate(var(--s2-glass-saturate, 180%));
    -webkit-backdrop-filter: blur(var(--s2-glass-blur, 18px)) saturate(var(--s2-glass-saturate, 180%));
    box-shadow: inset -1px 0 var(--s2-divider, #efeff5);
    /* box-shadow is the hairline, so it has to ride the same curve as the glass behind it —
       without it the surface eases into dark mode while the divider snaps. */
    transition:
        width var(--s2-transition, 0.3s cubic-bezier(0.4, 0, 0.2, 1)),
        background var(--s2-transition, 0.3s ease),
        box-shadow var(--s2-transition, 0.3s ease);
}

.s2-sider--collapsed {
    width: 56px;
}

/*
 * Scrolls as a whole when the menu outgrows the viewport (the logo and selector ride along,
 * exactly as the previous component library behaved). The aside gives this flex item a definite
 * height, so overflow-y only engages once the content actually overflows.
 */
.s2-sider-content {
    display: flex;
    flex-direction: column;
    min-height: 100%;
    width: 100%;
    overflow-y: auto;
    scrollbar-width: thin;
}

.s2-sider-logo {
    height: var(--header-height);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 12px;
    box-sizing: border-box;
    border-bottom: 1px solid var(--s2-border, #d8dce8);
    flex-shrink: 0;
    transition: border-color var(--s2-transition, 0.3s ease);
}

/* S2 sidebar interface selector (no hairline at the bottom: the select has its own border, the menu has pill sections) */
.s2-sider-iface-wrap {
    padding: 8px 12px 12px;
}

.s2-sider-iface-wrap.collapsed {
    padding: 8px;
    display: flex;
    justify-content: center;
}

/* ── Collapsed interface icon button ── */
.s2-iface-icon-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--s2-border, #d8dce8);
    border-radius: var(--s2-radius-sm, 10px);
    background: transparent;
    color: var(--s2-text-muted, #646c82);
    font-size: 17px;
    cursor: pointer;
    transition:
        color var(--s2-transition, 0.3s cubic-bezier(0.4, 0, 0.2, 1)),
        border-color var(--s2-transition, 0.3s cubic-bezier(0.4, 0, 0.2, 1));
}

.s2-iface-icon-btn:hover {
    color: var(--s2-text, #1c2333);
    border-color: var(--brand, #7c5cff);
}

/* ── Skeleton placeholder (same height as real content, no layout shift) ── */
.s2-select-skeleton {
    height: 30px;
}

.s2-select-skeleton.collapsed {
    width: 32px;
    height: 32px;
    max-width: none;
}

/* ── Content fade-in when loaded ── */
.s2-sider-iface-wrap.is-loaded .s2-sidebar-select,
.s2-sider-iface-wrap.is-loaded .s2-sidebar-iface-single {
    animation: s2-content-in 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes s2-content-in {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}
</style>
