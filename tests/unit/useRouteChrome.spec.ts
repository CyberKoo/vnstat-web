/* eslint-disable vue/one-component-per-file -- test fixtures: one layout harness plus two page stand-ins */
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { defineComponent, h, nextTick, ref, type Ref } from 'vue';
import { createMemoryHistory, createRouter, RouterView, type Router } from 'vue-router';
import { useRouteChrome } from '@/composables/useRouteChrome';

vi.mock('vue-i18n', async () => {
    const { ref } = await import('vue');
    return { useI18n: () => ({ t: (key: string) => key, locale: ref('en') }) };
});

/** Minimal stand-in for BaseLayout: primes the module-scope hooks and renders the persistent heading */
function createHarness(heading: Ref<HTMLElement | null>) {
    return defineComponent({
        setup() {
            useRouteChrome(ref(false), heading);
            return () =>
                h('div', [
                    h('h1', { ref: heading, class: 's2-page-heading', tabindex: -1 }, 'Page title'),
                    h(RouterView),
                ]);
        },
    });
}

const PageA = defineComponent({ setup: () => () => h('button', 'page-a') });
const PageB = defineComponent({ setup: () => () => h('button', 'page-b') });

let router: Router;
let wrapper: VueWrapper;
const heading = ref<HTMLElement | null>(null);

beforeAll(async () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/', name: 'a', meta: { titleKey: 'a' }, component: PageA },
            { path: '/b', name: 'b', meta: { titleKey: 'b' }, component: PageB },
        ],
    });
    // Same order as the app: initial navigation finalizes before the layout (harness) mounts, so
    // the guards registered at mount time never see the first load
    await router.push('/');
    await router.isReady();
    wrapper = mount(createHarness(heading), { attachTo: document.body, global: { plugins: [router] } });
    await nextTick();
});

afterAll(() => {
    wrapper?.unmount();
});

it('does not move focus on first load', () => {
    expect(document.activeElement).toBe(document.body);
    expect(document.activeElement).not.toBe(heading.value);
});

it('moves focus to the page heading on navigation, with preventScroll', async () => {
    const focusSpy = vi.spyOn(heading.value!, 'focus');
    await router.push('/b');
    await nextTick();
    expect(document.activeElement).toBe(heading.value);
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
});

it('recovers focus when the previously focused node is destroyed by the page swap', async () => {
    const pageButton = wrapper.find('button').element as HTMLElement;
    pageButton.focus();
    expect(document.activeElement).toBe(pageButton);
    await router.push('/');
    await nextTick();
    expect(document.activeElement).toBe(heading.value);
});
