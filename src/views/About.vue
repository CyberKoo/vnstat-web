<template>
    <div ref="sheetRef" class="s2-sheet">
        <AboutHero />
        <AboutHighlights />
        <AboutPipeline />
        <AboutBottomCard />
    </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';
import AboutHero from '@/components/about/AboutHero.vue';
import AboutHighlights from '@/components/about/AboutHighlights.vue';
import AboutPipeline from '@/components/about/AboutPipeline.vue';
import AboutBottomCard from '@/components/about/AboutBottomCard.vue';

// ── Scroll reveal ──
const sheetRef = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

/**
 * Reveal targets are found inside this view, not across the document: a document-wide query
 * silently claimed any `.s2-reveal` some other component might grow later, and there was no way
 * to tell from the markup which sections were supposed to animate.
 */
function revealTargets(): HTMLElement[] {
    return Array.from(sheetRef.value?.querySelectorAll<HTMLElement>('.s2-reveal') ?? []);
}

onMounted(() => {
    const targets = revealTargets();
    // Without IntersectionObserver the sections stay un-armed, i.e. fully visible; that is the
    // whole point of arming here rather than in CSS.
    if (!targets.length || typeof IntersectionObserver !== 'function') return;

    observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) {
                    e.target.classList.add('visible');
                    observer!.unobserve(e.target);
                }
            });
        },
        { threshold: 0.15 },
    );

    // Arm the hidden start state only now that an observer exists to undo it. `onMounted` runs in
    // the same task as the DOM insert, before the browser paints, so this does not flash the
    // sections in and then hide them again.
    targets.forEach((el) => {
        el.classList.add('s2-reveal-armed');
        observer!.observe(el);
    });
});

onUnmounted(() => {
    observer?.disconnect();
    observer = null;
});
</script>
