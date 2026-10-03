<template>
    <li class="s2-menu-item">
        <!--
          Collapsed rail + group: the 56px row has no room for nested levels, so the children move
          into a flyout panel beside the rail. This is what makes the group reachable when the
          sidebar is folded.
        -->
        <DropdownMenu
            v-if="collapsed && node.children"
            placement="right"
            size="large"
            open-on-hover
            :options="childOptions"
            :active-key="activeKey"
            @select="emit('select', $event)"
        >
            <template #trigger="{ open: flyoutOpen }">
                <button
                    type="button"
                    class="s2-menu-row"
                    :class="{ 's2-menu-row--group-active': isGroupActive }"
                    :aria-label="node.label"
                    aria-haspopup="menu"
                    :aria-expanded="flyoutOpen"
                >
                    <span v-if="node.icon" class="s2-menu-icon"><MenuIcon :icon="node.icon" /></span>
                    <span class="s2-menu-label">{{ node.label }}</span>
                </button>
            </template>
        </DropdownMenu>

        <!-- Collapsed rail leaf: the label is display:none here, so the accessible name comes
             from aria-label and hovering restores it via the tooltip -->
        <Tooltip v-else-if="collapsed" block placement="right" :content="node.label">
            <router-link
                :to="{ name: node.key }"
                class="s2-menu-row"
                :class="{ 's2-menu-row--active': isActive }"
                :aria-label="node.label"
                :aria-current="isActive ? 'page' : undefined"
            >
                <span v-if="node.icon" class="s2-menu-icon"><MenuIcon :icon="node.icon" /></span>
                <span class="s2-menu-label">{{ node.label }}</span>
            </router-link>
        </Tooltip>

        <!-- Group: toggles its own expansion, never navigates -->
        <button
            v-else-if="node.children"
            type="button"
            class="s2-menu-row"
            :class="{ 's2-menu-row--group-active': isGroupActive, 's2-menu-row--child': depth > 0 }"
            :aria-expanded="isOpen"
            :aria-current="isGroupActive ? 'true' : undefined"
            @click="emit('toggle', node.key)"
        >
            <span v-if="node.icon" class="s2-menu-icon"><MenuIcon :icon="node.icon" /></span>
            <span class="s2-menu-label">{{ node.label }}</span>
            <span class="s2-menu-arrow" :class="{ 's2-menu-arrow--open': isOpen }">
                <MenuIcon icon="mdi:chevron-down" />
            </span>
        </button>

        <!-- Leaf: navigates (a real link, same target the old select() pushed) -->
        <router-link
            v-else
            :to="{ name: node.key }"
            class="s2-menu-row"
            :class="{ 's2-menu-row--active': isActive, 's2-menu-row--child': depth > 0 }"
            :aria-current="isActive ? 'page' : undefined"
        >
            <span v-if="node.icon" class="s2-menu-icon"><MenuIcon :icon="node.icon" /></span>
            <span class="s2-menu-label">{{ node.label }}</span>
        </router-link>

        <!--
          The wrapper is the animation target: a 0fr->1fr grid row can only collapse a single
          child, so the list sits inside one. Rendering the children directly here would make the
          grid create an implicit auto row per <li>, and only the first one would collapse.
        -->
        <div v-if="node.children && !collapsed" class="s2-menu-sub" :class="{ 's2-menu-sub--open': isOpen }">
            <!-- A plain nested list: nothing above it carries a menu role, so role="group" here
                 only erased the list semantics without grouping anything -->
            <ul class="s2-menu-sub-list">
                <MenuNode
                    v-for="child in node.children"
                    :key="child.key"
                    :node="child"
                    :depth="depth + 1"
                    :active-key="activeKey"
                    :expanded-keys="expandedKeys"
                    :collapsed="collapsed"
                    @select="emit('select', $event)"
                    @toggle="emit('toggle', $event)"
                />
            </ul>
        </div>
    </li>
</template>

<script lang="ts" setup>
/*
 * Self-referencing node: <script setup> derives the component name from the file name, so the
 * template can use <MenuNode> for deeper nesting levels without an explicit import.
 */
import { computed } from 'vue';
import type { MenuNode } from '@/composables/useMenu';
import MenuIcon from '@/components/icons/MenuIcon.vue';
import DropdownMenu, { type DropdownOption } from '@/components/ui/DropdownMenu.vue';
import Tooltip from '@/components/ui/Tooltip.vue';

const props = defineProps<{
    node: MenuNode;
    depth: number;
    activeKey: string;
    expandedKeys: string[];
    collapsed: boolean;
}>();

const emit = defineEmits<{
    select: [key: string];
    toggle: [key: string];
}>();

// A collapsed rail has no room for nested levels, so a group is never open there
const isOpen = computed(() => !props.collapsed && props.expandedKeys.includes(props.node.key));
const isActive = computed(() => props.activeKey === props.node.key);

/** A group reads as current while the route sits anywhere inside it */
const isGroupActive = computed(() => props.node.children?.some((c) => c.key === props.activeKey) ?? false);

/** Flyout rows for the collapsed rail */
const childOptions = computed<DropdownOption[]>(() =>
    (props.node.children ?? []).map((c) => ({ key: c.key, label: c.label, icon: c.icon })),
);
</script>

<style scoped>
/* Leaves are router-links (real <a href> for link semantics); strip the anchor default so the
   row keeps the look it had as a button. Every other .s2-menu-row property is element-agnostic
   and already comes from theme-s2.css. */
.s2-menu-row {
    text-decoration: none;
}
</style>
