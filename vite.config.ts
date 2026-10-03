import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';
import { fileURLToPath, URL } from 'node:url';

import packageJson from './package.json' with { type: 'json' };

/**
 * The Vite config function.
 *
 * Loads env vars dynamically for the current build mode and configures the Vue plugin, icon
 * components, the dev proxy server and more.
 * Supports the dev proxy, production sourcemap control, path alias definitions and version injection.
 *
 * @param param0 the Vite config hook argument
 * @param param0.mode the current build mode (e.g. 'development', 'production', 'staging')
 * @returns the Vite config object, holding plugins, build, resolve, server, define and other options
 *
 * @example
 * // used in vite.config.ts
 * export default defineConfig(({ mode }) => { ... })
 */
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const baseApi = env.VITE_APP_BASE_API || '/api/v1';
    const apiServer = env.VITE_API_SERVER || '';
    const useProxy = env.VITE_APP_PROXY === 'true';

    return {
        plugins: [
            vue(),
            Components({
                resolvers: [
                    IconsResolver({
                        prefix: 'Icon',
                    }),
                ],
                dts: 'src/components.d.ts',
            }),
            Icons({
                compiler: 'vue3',
                autoInstall: true,
            }),
        ],
        build: {
            // Turn on only for debugging production issues, otherwise keep false
            // options: true | false | 'inline' | 'hidden'
            sourcemap: mode === 'staging' ? 'hidden' : false,
            rollupOptions: {
                output: {
                    /**
                     * Split the large first-screen third-party dependencies into separate chunks so the
                     * browser can cache them long-term, shrinking the main bundle of the first screen.
                     * App components are imported on demand, so they are not grouped here; let rollup
                     * distribute them naturally by reference (modules used only by lazily loaded pages
                     * stay out of the first-screen chunk chain).
                     *
                     * chart.js and uplot are deliberately NOT named here: they are only imported by
                     * lazily loaded routes, and naming them backfires — shared runtime helpers get
                     * hoisted into the named vendor chunks, so the entry's own need for those helpers
                     * would drag the whole chart chunk onto the first screen. Left unnamed, both
                     * libraries chunk naturally into the lazy route chain that imports them.
                     */
                    manualChunks(id) {
                        if (!id.includes('node_modules')) return;
                        if (id.includes('/vue/') || id.includes('/@vue/')) return 'vue';
                        if (id.includes('/dayjs/')) return 'dayjs';
                        if (id.includes('/pinia/')) return 'pinia';
                        if (id.includes('/vue-router/')) return 'router';
                        if (id.includes('/@iconify/') || id.includes('/iconify/')) return 'icons';
                    },
                },
            },
        },
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
            },
        },
        server: {
            proxy:
                useProxy && apiServer
                    ? {
                          [baseApi]: {
                              target: apiServer,
                              changeOrigin: true,
                          },
                      }
                    : undefined,
        },
        define: {
            'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version),
        },
    };
});
