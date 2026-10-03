/**
 * Menu icon registry.
 *
 * The router declares menu icons as names (`mdi:pulse`), so they cannot be resolved to a static
 * import. Passing the raw name to a runtime icon component makes the browser fetch icon data on
 * first paint, which leaves the mobile drawer briefly iconless because nothing else on that route
 * has requested them yet. Mapping the names to statically imported components bundles the glyphs
 * instead, so the menu renders complete on first frame.
 *
 * A name missing from the registry returns undefined here and `MenuIcon.vue` falls back to the
 * runtime lookup, so adding an icon to a route still works — it just loses the instant-paint
 * guarantee.
 */
import type { Component } from 'vue';

import IconPulse from '~icons/mdi/pulse';
import IconChartBoxOutline from '~icons/mdi/chart-box-outline';
import IconClockOutline from '~icons/mdi/clock-outline';
import IconCalendarOutline from '~icons/mdi/calendar-outline';
import IconCalendarMonthOutline from '~icons/mdi/calendar-month-outline';
import IconCalendarRangeOutline from '~icons/mdi/calendar-range-outline';
import IconFormatListBulleted from '~icons/mdi/format-list-bulleted';
import IconNetwork from '~icons/mdi/network';
import IconInformationOutline from '~icons/mdi/information-outline';
import IconChevronDown from '~icons/mdi/chevron-down';
import IconCheckCircle from '~icons/mdi/check-circle';
import IconAlertCircle from '~icons/mdi/alert-circle';

const REGISTRY: Record<string, Component> = {
    'mdi:pulse': IconPulse,
    'mdi:chart-box-outline': IconChartBoxOutline,
    'mdi:clock-outline': IconClockOutline,
    'mdi:calendar-outline': IconCalendarOutline,
    'mdi:calendar-month-outline': IconCalendarMonthOutline,
    'mdi:calendar-range-outline': IconCalendarRangeOutline,
    'mdi:format-list-bulleted': IconFormatListBulleted,
    'mdi:network': IconNetwork,
    'mdi:information-outline': IconInformationOutline,
    'mdi:chevron-down': IconChevronDown,
    'mdi:check-circle': IconCheckCircle,
    'mdi:alert-circle': IconAlertCircle,
};

/** Resolve an icon name to a bundled component, or undefined when it is not registered. */
export function menuIcon(name?: string): Component | undefined {
    return name ? REGISTRY[name] : undefined;
}
