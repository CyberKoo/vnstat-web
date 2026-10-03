import { afterEach, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import MobileDrawer from '@/components/MobileDrawer.vue';

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }));

let wrapper: VueWrapper | undefined;
let opener: HTMLButtonElement | undefined;

afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    opener?.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

it.each([true, false])('closes with reduced motion = %s using the matching timing', async (reducedMotion) => {
    vi.useFakeTimers();
    const matchMedia = vi.fn(() => ({ matches: reducedMotion }));
    vi.stubGlobal('matchMedia', matchMedia);
    let openFrame: FrameRequestCallback | undefined;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
        openFrame = callback;
        return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    wrapper = mount(MobileDrawer, {
        props: { visible: false, interfaceOptions: [{ label: 'eth0', value: 'eth0' }], selectedInterface: 'eth0' },
        global: {
            stubs: {
                AppLogo: true,
                AppMenu: { template: '<button>Menu</button>' },
                'icon-mdi-ethernet': true,
            },
        },
    });
    await wrapper.setProps({ visible: true });
    await nextTick();
    expect(openFrame).toBeDefined();
    openFrame!(0);
    await nextTick();
    expect(document.querySelector('.s2-drawer.open')).not.toBeNull();
    expect(document.activeElement?.textContent).toBe('Menu');

    const timeout = vi.spyOn(window, 'setTimeout');
    await wrapper.setProps({ visible: false });
    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    if (reducedMotion) {
        expect(timeout).not.toHaveBeenCalled();
    } else {
        expect(timeout).toHaveBeenCalledExactlyOnceWith(expect.any(Function), 200);
        expect(document.querySelector('.s2-drawer.open')).not.toBeNull();
        expect(document.querySelector('.s2-drawer--slid')).toBeNull();
        expect(document.activeElement).not.toBe(opener);
        await vi.advanceTimersByTimeAsync(199);
        expect(document.querySelector('.s2-drawer')).not.toBeNull();
        await vi.advanceTimersByTimeAsync(1);
    }
    expect(document.querySelector('.s2-drawer')).toBeNull();
    expect(document.activeElement).toBe(opener);
    expect(wrapper.emitted('update:dimming')).toEqual([[true], [false]]);
});
