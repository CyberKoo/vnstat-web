import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

import { i18n } from '@/plugins/i18n';

/** One sidebar entry. Groups carry `children`; leaves navigate on click. */
export interface MenuNode {
    key: string;
    label: string;
    /** Iconify icon name (e.g. `mdi:pulse`); absent when the route declares none */
    icon?: string;
    children?: MenuNode[];
}

/**
 * Resolve the displayed label for a route record.
 *
 * `meta.titleKey` holds an i18n key (see `src/router/index.ts`); it is resolved
 * through the global i18n instance so the menu labels follow locale switches,
 * falling back to the route name when no key is set.
 */
function menuLabel(meta: RouteRecordRaw['meta'], name: RouteRecordRaw['name']): string {
    const key = meta?.titleKey as string | undefined;
    return key ? i18n.global.t(key) : (name as string);
}

/**
 * Recursively build the sidebar menu tree from Vue Router route records.
 *
 * Rules:
 * - Routes with `hideInMenu` meta are skipped entirely.
 * - Routes with children and `menuGroup` meta produce expandable group nodes.
 * - All other routes produce leaf items (navigation on click).
 *
 * @param routes - Route records (usually from router.options.routes)
 * @returns The menu tree
 */
function buildMenuTree(routes: readonly RouteRecordRaw[]): MenuNode[] {
    const result: MenuNode[] = [];

    for (const r of routes) {
        // Skip hidden routes
        if (r.meta?.hideInMenu) continue;

        // Route has children and is marked as a group → recurse into children
        if (r.children && r.meta?.menuGroup) {
            const children = buildMenuTree(r.children);
            if (children.length > 0) {
                result.push({
                    key: `${r.name as string}-group`,
                    label: menuLabel(r.meta, r.name),
                    icon: r.meta?.icon as string | undefined,
                    children,
                });
            }
            continue;
        }

        // Plain menu item
        result.push({
            key: r.name as string,
            label: menuLabel(r.meta, r.name),
            icon: r.meta?.icon as string | undefined,
        });
    }

    return result;
}

/**
 * Build sidebar menu entries from router config, with reactive
 * active-entry tracking and expand-state management.
 *
 * Usage:
 * ```ts
 * const { menuNodes, activeKey, expandedKeys, toggleGroup, select } = useMenu();
 * ```
 *
 * Returns:
 * - `menuNodes`   — Computed menu tree derived from the route config
 * - `activeKey`   — Current route name (for highlighting)
 * - `expandedKeys`— Reactive set of currently expanded group keys
 * - `toggleGroup` — Callback for expanding/collapsing a group
 * - `select`      — Callback for leaf selection in the collapsed-rail flyout; navigates to the
 *   target route (expanded-mode leaves are router-links and navigate on their own)
 */
export function useMenu() {
    const router = useRouter();
    const route = useRoute();

    // Build menu from the first child of the top-level route (i.e. the layout route's children)
    const menuNodes = computed(() => {
        const topLevel = router.options.routes[0];
        return topLevel?.children ? buildMenuTree(topLevel.children) : [];
    });

    // Highlight the menu item matching the current route name
    const activeKey = computed(() => (typeof route.name === 'string' ? route.name : ''));

    const expandedKeys = ref<string[]>([]);

    /**
     * Sync expanded state with the current matched route.
     * If a matched route record has `menuGroup` set, expand its group.
     */
    function syncExpandedKeys() {
        for (const record of route.matched) {
            if (record.meta?.menuGroup) {
                expandedKeys.value = [`${record.name as string}-group`];
                return;
            }
        }
        expandedKeys.value = [];
    }

    // Initialise expand state
    syncExpandedKeys();

    // Re-sync expand state on route change
    watch(
        () => route.name,
        () => syncExpandedKeys(),
    );

    /** Navigate to the route matching the clicked menu key */
    function select(key: string) {
        router.push({ name: key });
    }

    /** Expand or collapse a group by key */
    function toggleGroup(key: string) {
        expandedKeys.value = expandedKeys.value.includes(key)
            ? expandedKeys.value.filter((k) => k !== key)
            : [...expandedKeys.value, key];
    }

    return {
        menuNodes,
        activeKey,
        expandedKeys,
        toggleGroup,
        select,
    };
}
