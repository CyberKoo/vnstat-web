<template>
    <Teleport to="body">
        <div class="s2-loading-bar-host" :class="`s2-loading-bar-host--${state}`" aria-hidden="true">
            <div class="s2-loading-bar" />
        </div>
    </Teleport>
</template>

<script lang="ts" setup>
/**
 * Renders the state owned by `useLoadingBar`. Mounted once from `App.vue`.
 */
import { useLoadingBar } from '@/composables/useLoadingBar';

const { state } = useLoadingBar();
</script>
