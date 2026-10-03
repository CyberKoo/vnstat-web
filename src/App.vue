<template>
    <LoadingBarHost />
    <ToastHost />
    <router-view />
</template>

<script lang="ts" setup>
/**
 * Application root.
 *
 * Global feedback surfaces (top loading bar, toasts) are mounted here and driven by the
 * module-scope services in `useLoadingBar` / `useToast`; light and dark are handled entirely by
 * the `dark` class on `<html>` and the custom properties in `theme-s2.css`.
 */
import LoadingBarHost from '@/components/ui/LoadingBarHost.vue';
import ToastHost from '@/components/ui/ToastHost.vue';
</script>
