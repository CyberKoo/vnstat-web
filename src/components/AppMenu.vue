<template>
    <nav
        ref="menuEl"
        :aria-label="t('layout.mainNav')"
        :class="{ 's2-menu-nav--collapsed': collapsed }"
    >
        <span
            v-if="collapsed && sliderPlaced"
            class="s2-menu-slider"
            :class="{ 's2-menu-slider--move': sliderMoves }"
            :style="{ height: `${sliderHeight}px`, transform: `translateY(${sliderTop}px)` }"
            aria-hidden="true"
        />
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
import { nextTick, onMounted, ref, shallowRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { useMenu } from '@/composables/useMenu';
import MenuNode from '@/components/menu/MenuNode.vue';

const props = withDefaults(
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

const menuEl = ref<HTMLElement | null>(null);
const sliderTop = shallowRef(0);
const sliderHeight = shallowRef(0);
const sliderPlaced = shallowRef(false);
/** Transition stays off until the chip has been measured, so the first paint does not slide in from 0. */
const sliderMoves = shallowRef(false);

function measureSlider() {
    const root = menuEl.value;
    if (!root || !props.collapsed) {
        sliderPlaced.value = false;
        return;
    }
    const row = root.querySelector<HTMLElement>('.s2-menu-row--active, .s2-menu-row--group-active');
    if (!row) {
        sliderPlaced.value = false;
        return;
    }
    const navRect = root.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    sliderTop.value = rowRect.top - navRect.top;
    sliderHeight.value = rowRect.height;
    sliderPlaced.value = true;
}

function armSlider() {
    requestAnimationFrame(() => {
        sliderMoves.value = true;
    });
}

onMounted(async () => {
    await nextTick();
    measureSlider();
    armSlider();
});

// Post-flush: a pre watcher plus nextTick still sees the previous active row, so the chip
// would stay on the item you just left.
watch(activeKey, () => measureSlider(), { flush: 'post' });

watch(
    () => props.collapsed,
    async () => {
        sliderMoves.value = false;
        await nextTick();
        measureSlider();
        armSlider();
    },
);
</script>
