import { createApp } from 'vue';
import { createPinia } from 'pinia';

// Self-hosted design system fonts (was Google Fonts) – latin subset only
import '@fontsource/inter/latin-300.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-500.css';
import '@fontsource/jetbrains-mono/latin-600.css';
import '@fontsource/jetbrains-mono/latin-700.css';

import App from '@/App.vue';
import router from '@/router';
import i18n from '@/plugins/i18n';

import '@/assets/styles/theme-s2.css';

import dayjs from '@/plugins/dayjs';
import { DAYJS_KEY } from '@/composables/useDayjs';

const pinia = createPinia();
const app = createApp(App);
app.use(router);
app.use(pinia);
app.use(i18n);
app.provide(DAYJS_KEY, dayjs);
app.mount('#app');
