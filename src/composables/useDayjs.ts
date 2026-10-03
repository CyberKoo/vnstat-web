import { inject, type InjectionKey } from 'vue';
import type dayjsType from 'dayjs';

/** dayjs injection key */
export const DAYJS_KEY: InjectionKey<typeof dayjsType> = Symbol('dayjs');

/**
 * Get the globally injected dayjs utility (for Composition API).
 *
 * @returns The injected dayjs function
 *
 * @example
 * const dayjs = useDayjs();
 * dayjs('2024-01-01').format('YYYY-MM-DD')
 */
export function useDayjs() {
    const dj = inject(DAYJS_KEY);
    if (!dj) {
        throw new Error('useDayjs: dayjs not injected; call app.provide(DAYJS_KEY, dayjs) at the entry');
    }
    return dj;
}
