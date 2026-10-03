import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

/**
 * Vitest config (kept separate from the build config in vite.config.ts).
 *
 * Tests all live in the tests/ directory, isolated from src/:
 * - not part of the include list in tsconfig.app.json, so the build type check ignores them
 * - import paths point at src/ through the @ alias
 */
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    test: {
        environment: 'happy-dom',
        include: ['tests/**/*.spec.ts'],
        setupFiles: ['./tests/setup.ts'],
    },
});
