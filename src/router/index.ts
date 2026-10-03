import type { RouteRecordRaw } from 'vue-router';
import { createRouter, createWebHistory } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        component: () => import('@/layouts/BaseLayout.vue'),
        children: [
            {
                path: '',
                name: 'live-stats',
                meta: { titleKey: 'menu.liveStats', icon: 'mdi:pulse' },
                component: () => import('@/views/InterfaceMonitor.vue'),
            },
            {
                path: 'traffic',
                name: 'traffic-group',
                meta: { menuGroup: true, titleKey: 'menu.trafficGroup', icon: 'mdi:chart-box-outline' },
                // No component of its own: bare /traffic would render an empty page
                redirect: { name: 'hourly-traffic' },
                children: [
                    {
                        path: '/hourly',
                        name: 'hourly-traffic',
                        meta: { titleKey: 'menu.hourly', icon: 'mdi:clock-outline' },
                        component: () => import('@/views/TrafficByPeriod.vue'),
                        props: { period: 'hour' },
                    },
                    {
                        path: '/daily',
                        name: 'daily-traffic',
                        meta: { titleKey: 'menu.daily', icon: 'mdi:calendar-outline' },
                        component: () => import('@/views/TrafficByPeriod.vue'),
                        props: { period: 'day' },
                    },
                    {
                        path: '/monthly',
                        name: 'monthly-traffic',
                        meta: { titleKey: 'menu.monthly', icon: 'mdi:calendar-month-outline' },
                        component: () => import('@/views/TrafficByPeriod.vue'),
                        props: { period: 'month' },
                    },
                    {
                        path: '/yearly',
                        name: 'yearly-traffic',
                        meta: { titleKey: 'menu.yearly', icon: 'mdi:calendar-range-outline' },
                        component: () => import('@/views/TrafficByPeriod.vue'),
                        props: { period: 'year' },
                    },
                    {
                        path: '/top',
                        name: 'top-traffic',
                        meta: { titleKey: 'menu.top', icon: 'mdi:format-list-bulleted' },
                        component: () => import('@/views/TopTraffic.vue'),
                    },
                ],
            },
            {
                path: 'overview',
                name: 'interface-overview',
                meta: { titleKey: 'menu.overview', icon: 'mdi:network' },
                component: () => import('@/views/InterfaceOverview.vue'),
            },
            {
                path: 'about',
                name: 'about',
                meta: { titleKey: 'menu.about', icon: 'mdi:information-outline' },
                component: () => import('@/views/About.vue'),
            },
            {
                path: ':pathMatch(.*)*',
                name: 'NotFound',
                component: () => import('@/views/NotFound.vue'),
                meta: { titleKey: 'menu.notFound', hideInMenu: true },
            },
        ],
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
