import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { getInterfaces } from '@/api/interfaces';
import { getInterfaceDetail } from '@/api/traffic';
import { usePoll } from '@/composables/usePoll';
import { useInterfaceStore } from '@/stores/interface';
import { useInterfaceDetailStore } from '@/stores/interfaceDetail';
import { useToast } from '@/composables/useToast';
import { useLoadingBar } from '@/composables/useLoadingBar';

/**
 * The slice of the interface store this composable reads, narrowed to what it uses so callers (and
 * tests) can pass a plain object instead of standing up Pinia.
 */
export type CatalogInterfaceSource = Pick<ReturnType<typeof useInterfaceStore>, 'selected' | 'setOptions'>;

/** The slice of the interface detail store this composable writes to */
export type CatalogDetailSource = Pick<ReturnType<typeof useInterfaceDetailStore>, 'update'>;

/** Store sources, each defaulting to the global store */
export interface UseInterfaceCatalogStores {
    interfaceStore?: CatalogInterfaceSource;
    detailStore?: CatalogDetailSource;
}

/**
 * Load and refresh the details of the "currently selected interface".
 *
 * The layout only hands refresh over to the top bar. The multi-interface cache of the overview page
 * does not go through here.
 *
 * @param stores Store sources; omitted entries resolve to the global Pinia stores
 * @returns refresh manual refresh, refreshing whether a refresh is in flight
 */
export function useInterfaceCatalog(stores: UseInterfaceCatalogStores = {}) {
    const toast = useToast();
    const loadingBar = useLoadingBar();
    const { t } = useI18n();
    const interfaceStore = stores.interfaceStore ?? useInterfaceStore();
    const interfaceDetailStore = stores.detailStore ?? useInterfaceDetailStore();
    const refreshing = ref(false);

    async function updateInterfaceDetail(signal?: AbortSignal) {
        interfaceDetailStore.update(await getInterfaceDetail(interfaceStore.selected, signal));
    }

    async function refresh() {
        refreshing.value = true;
        loadingBar.start();
        try {
            await updateInterfaceDetail();
            loadingBar.finish();
            toast.success(t('catalog.refreshed'));
        } catch {
            loadingBar.error();
            toast.error(t('catalog.refreshFailed'));
        } finally {
            refreshing.value = false;
        }
    }

    onMounted(async () => {
        try {
            const data = await getInterfaces();
            interfaceStore.setOptions(data.map((name: string) => ({ label: name, value: name })));
        } catch {
            toast.error(t('catalog.loadFailed'));
        }
    });

    watch(
        () => interfaceStore.selected,
        async (name) => {
            if (!name) return;
            // Vue does not catch rejections from async watch callbacks — handle them here
            // the same way refresh() does, or a failed switch is an unhandled rejection.
            try {
                await updateInterfaceDetail();
            } catch {
                toast.error(t('catalog.loadFailed'));
            }
        },
    );

    // Pass the poll signal through so visibility-pause actually cancels the in-flight request
    usePoll(({ signal }) => updateInterfaceDetail(signal ?? undefined), {
        intervalMs: 60_000,
        immediate: false,
        enableVisibilityPause: true,
    });

    return { refresh, refreshing };
}
