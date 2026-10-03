<template>
    <nav :aria-label="t('layout.mainNav')">
        <ul class="s2-menu" :class="{ 's2-menu--collapsed': collapsed }" :style="{ '--s2-menu-indent': `${indent}px` }">
            <MenuNode
                v-for="node in menuNodes"
                :key="node.key"
                :node="node"
                :depth="0"
                :active-key="activeKey"
                :expanded-keys="expandedKeys"
                :collapsed="collapsed"
                @select="select"
                @toggle="toggleGroup"
            />
        </ul>
    </nav>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

import { useMenu } from '@/composables/useMenu';
import MenuNode from '@/components/menu/MenuNode.vue';

withDefaults(
    defineProps<{
        collapsed: boolean;
        /** Extra indent applied to each nesting level below a group */
        indent?: number;
    }>(),
    {
        indent: 16,
    },
);

const { t } = useI18n();

const { menuNodes, activeKey, expandedKeys, toggleGroup, select } = useMenu();
</script>
