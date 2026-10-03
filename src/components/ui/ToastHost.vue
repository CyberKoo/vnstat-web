<template>
    <Teleport to="body">
        <div class="s2-toast-host" role="status" aria-live="polite">
            <TransitionGroup name="s2-toast">
                <div v-for="t in toasts" :key="t.id" class="s2-toast" :class="`s2-toast--${t.type}`">
                    <MenuIcon
                        :icon="t.type === 'success' ? 'mdi:check-circle' : 'mdi:alert-circle'"
                        class="s2-toast-icon"
                    />
                    <div class="s2-toast-body">{{ t.text }}</div>
                </div>
            </TransitionGroup>
        </div>
    </Teleport>
</template>

<script lang="ts" setup>
/**
 * Renders the queue owned by `useToast`. Mounted once from `App.vue`.
 */
import MenuIcon from '@/components/icons/MenuIcon.vue';
import { useToast } from '@/composables/useToast';

const { toasts } = useToast();
</script>
