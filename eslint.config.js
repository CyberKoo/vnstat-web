// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import prettier from 'eslint-plugin-prettier/recommended';

export default [
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    ...pluginVue.configs['flat/recommended'],
    prettier,
    {
        // .tmp is gitignored scratch space (screenshot harnesses, probes), not project source
        ignores: ['dist', 'dist-ssr', 'node_modules', '.tmp'],
    },
    {
        files: ['*.vue', '**/*.vue'],
        languageOptions: {
            globals: {
                ...globals.browser,
            },
            parserOptions: {
                parser: tseslint.parser,
            },
        },
    },
    {
        rules: {
            'vue/multi-word-component-names': 'off',
        },
    },

    /**
     * Architecture boundaries.
     *
     * Enforced layer order (a module may only import from layers *above* it in this list):
     *
     *   types / constants / config / locales / plugins   <- leaf contracts & shared singletons
     *   utils                                              <- pure helpers
     *   api                                                <- HTTP access
     *   composables                                        <- Vue-bound orchestration
     *   stores                                             <- reactive shared state
     *   components                                         <- presentational units
     *   layouts / views / App.vue                          <- composition roots
     *   main.ts                                            <- bootstrap
     *
     * `plugins/` sits at the bottom on purpose: it holds shared runtime singletons (the configured
     * `dayjs` instance, the `i18n` instance) rather than Vue plugin installs, so any layer may
     * depend on it. Folding it in with `utils/` would wrongly forbid `utils/datetime.ts` from
     * importing the configured `dayjs` it is written against.
     *
     * Shared contracts that peers both need (e.g. `ChartTheme`, `TrafficStatItem`) belong in
     * `types/`, not in whichever module happened to define them first — a domain type declared
     * inside a `.vue` file forces the business layer to import from the view layer.
     */

    // Leaf layers: contracts and configuration, so they must not reach back into any behaviour.
    {
        files: ['src/types/**', 'src/constants/**', 'src/config/**', 'src/locales/**'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: [
                                '@/api/*',
                                '@/composables/*',
                                '@/components/*',
                                '@/layouts/*',
                                '@/stores/*',
                                '@/utils/*',
                                '@/views/*',
                                '@/App.vue',
                            ],
                            message:
                                'types/constants/config/locales are leaf layers. They must not import from api, utils, composables, stores, components, layouts or views.',
                        },
                    ],
                },
            ],
        },
    },

    // Pure helpers: no reaching up into state, orchestration or the view layer.
    {
        files: ['src/utils/**'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: [
                                '@/api/*',
                                '@/composables/*',
                                '@/components/*',
                                '@/layouts/*',
                                '@/stores/*',
                                '@/views/*',
                            ],
                            message:
                                'utils are pure helpers and must not depend on api, composables, stores, components, layouts or views. Move shared contracts they need into src/types/.',
                        },
                    ],
                },
            ],
        },
    },

    // HTTP access: transport only, no state or UI knowledge.
    {
        files: ['src/api/**'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['@/composables/*', '@/components/*', '@/layouts/*', '@/stores/*', '@/views/*'],
                            message:
                                'api is the transport layer: request shaping only. Put response interpretation in composables instead of importing stores or components here.',
                        },
                    ],
                },
            ],
        },
    },

    // Orchestration: may use state and the API, but must stay out of the view layer.
    {
        files: ['src/composables/**'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['@/components/*', '@/layouts/*', '@/views/*'],
                            message:
                                'composables must not import components. A composable consumed by a component cannot depend on one: move the shared type into src/types/ or pass the value in as a parameter.',
                        },
                    ],
                },
            ],
        },
    },

    // State: must not reach up into orchestration or the view layer.
    {
        files: ['src/stores/**'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['@/composables/*', '@/components/*', '@/layouts/*', '@/views/*'],
                            message:
                                'stores hold state, not behaviour. Extract the logic into a composable or util, or call @/api directly from the store action.',
                        },
                    ],
                },
            ],
        },
    },

    /**
     * Store access is allowed here, but only as a *default argument*.
     *
     * A composable that reads a store must accept that store (narrowed to the slice it uses, e.g.
     * `Pick<ReturnType<typeof useSettingsStore>, 'speedUnit'>`) as an optional parameter defaulting to
     * the global store. That keeps the production call sites unchanged while letting tests pass a
     * plain object, so the logic no longer needs an active Pinia to be exercised.
     *
     * The import is not banned — the default needs it. What is banned is reading the store inside
     * the function body, which would make the store a hidden hard dependency again.
     */
    {
        files: ['src/composables/**'],
        rules: {
            'no-restricted-syntax': [
                'error',
                {
                    // const/let foo = useSomeStore();  — a hard dependency, not a default argument
                    selector: "VariableDeclarator[init.type='CallExpression'][init.callee.name=/^use[A-Z].*Store$/]",
                    message:
                        'Do not bind a store to a local: pass it in as an optional parameter so the composable can be tested without Pinia. Use `foo = useSomeStore()` as a default argument instead.',
                },
            ],
        },
    },

    // Pages: composition roots that consume state, never the data source itself.
    {
        files: ['src/views/**', 'src/layouts/**'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['@/api/*'],
                            message:
                                'views and layouts compose; they do not fetch. Call @/api from a composable so caching, cancellation and stale-response guards stay in one place. A store action may still call @/api directly.',
                        },
                    ],
                },
            ],
        },
    },
];
