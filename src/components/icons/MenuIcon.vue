<template>
    <!--
      width/height are forced to 1em because the two sources disagree on the default: unplugin-icons
      emits 1.2em, @iconify/vue emits 1em. Passing them explicitly keeps a bundled glyph the same
      size as the runtime one, so swapping a name for a registered icon cannot resize the menu.
    -->
    <component :is="bundled" v-if="bundled" width="1em" height="1em" />
    <Icon v-else-if="icon" :icon="icon" width="1em" height="1em" />
</template>

<script lang="ts" setup>
/**
 * Icon adapter for icon names that live in application data (router menu config, toast types)
 * rather than in the template.
 *
 * A name in the registry renders from a statically imported glyph, so it is present in the first
 * frame. Anything else falls back to the runtime lookup, which is what keeps adding an icon to a
 * route a one-line change.
 */
import { computed } from 'vue';
import { Icon } from '@iconify/vue';

import { menuIcon } from './menuIcons';

const props = defineProps<{
    /** Iconify icon name, e.g. `mdi:pulse` */
    icon?: string;
}>();

const bundled = computed(() => menuIcon(props.icon));
</script>
