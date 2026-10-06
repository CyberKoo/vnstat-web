import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import DropdownMenu from '@/components/ui/DropdownMenu.vue';

vi.mock('@/components/icons/MenuIcon.vue', () => ({
    default: { name: 'MenuIcon', template: '<span />' },
}));

const options = [
    { key: 'hourly-traffic', label: '每小时流量' },
    { key: 'daily-traffic', label: '每日流量' },
];

let wrapper: VueWrapper | undefined;

afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
});

function mountMenu(openOnHover: boolean) {
    wrapper = mount(DropdownMenu, {
        props: { options, openOnHover },
        slots: { trigger: '<button type="button" class="trigger">流量统计</button>' },
        global: { stubs: { MenuIcon: true } },
    });
}

function item(label: string): HTMLButtonElement {
    const found = [...document.querySelectorAll<HTMLButtonElement>('.s2-dropdown-item')].find((el) =>
        el.textContent?.includes(label),
    );
    if (!found) throw new Error(`missing item ${label}`);
    return found;
}

function clickItem(el: HTMLButtonElement, detail: number) {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail }));
}

describe('hover menu', () => {
    it('ignores the click that iPad retargets onto the row the opening tap revealed', async () => {
        mountMenu(true);
        await wrapper!.find('.s2-dropdown-root').trigger('mouseenter');
        await nextTick();

        clickItem(item('每小时流量'), 1);

        expect(wrapper!.emitted('select')).toBeUndefined();
        expect(document.querySelector('.s2-dropdown')).not.toBeNull();
    });

    it('selects an item whose pointerdown landed on the panel', async () => {
        mountMenu(true);
        await wrapper!.find('.s2-dropdown-root').trigger('mouseenter');
        await nextTick();
        const daily = item('每日流量');

        daily.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        clickItem(daily, 1);
        await nextTick();

        expect(wrapper!.emitted('select')).toEqual([['daily-traffic']]);
        expect(document.querySelector('.s2-dropdown')).toBeNull();
    });

    it('still selects from the keyboard, which never produces a pointerdown', async () => {
        mountMenu(true);
        await wrapper!.find('.s2-dropdown-root').trigger('mouseenter');
        await nextTick();

        clickItem(item('每日流量'), 0);
        await nextTick();

        expect(wrapper!.emitted('select')).toEqual([['daily-traffic']]);
    });
});

it('a click-opened menu selects without a prior pointerdown on the panel', async () => {
    mountMenu(false);
    await wrapper!.find('.trigger').trigger('click');
    await nextTick();

    clickItem(item('每小时流量'), 1);
    await nextTick();

    expect(wrapper!.emitted('select')).toEqual([['hourly-traffic']]);
});
