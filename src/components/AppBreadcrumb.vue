<template>
    <nav class="s2-breadcrumb" :aria-label="$t('layout.breadcrumb')">
        <ol class="s2-breadcrumb-list">
            <li v-for="(item, index) in breadcrumbItems" :key="item.name" class="s2-breadcrumb-item">
                <!-- Navigable levels are real links (keyboard + screen-reader support); the current
                     page is plain text marked aria-current -->
                <router-link
                    v-if="isClickable(item)"
                    :to="{ name: item.name }"
                    class="s2-breadcrumb-link s2-breadcrumb-link--clickable"
                >
                    {{ item.title }}
                </router-link>
                <span
                    v-else
                    class="s2-breadcrumb-link"
                    :class="{ 's2-breadcrumb-link--current': index === breadcrumbItems.length - 1 }"
                    :aria-current="index === breadcrumbItems.length - 1 ? 'page' : undefined"
                >
                    {{ item.title }}
                </span>
                <span v-if="index < breadcrumbItems.length - 1" class="s2-breadcrumb-sep" aria-hidden="true">/</span>
            </li>
        </ol>
    </nav>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

interface BreadcrumbItem {
    name: string;
    title: string;
    navigable: boolean;
}

const route = useRoute();
const { t } = useI18n();

const breadcrumbItems = computed<BreadcrumbItem[]>(() =>
    route.matched
        .filter((r) => r.meta?.titleKey && !r.meta?.hideInMenu)
        .map((r): BreadcrumbItem => ({
            name: r.name as string,
            title: t(r.meta!.titleKey as string),
            navigable: !r.meta?.menuGroup,
        })),
);

/** A level is a link only when it leads somewhere other than the view already on screen */
function isClickable(item: BreadcrumbItem): boolean {
    return item.navigable && item.name !== route.name;
}
</script>
