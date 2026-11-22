/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_VERSION: string;
    /** Base path the data API is mounted under (e.g. "/api/v1") */
    readonly VITE_APP_BASE_API?: string;
    /** Number of data points kept on the real-time chart */
    readonly VITE_APP_MAX_POINTS?: string;
    /** Link speed fallback in Mbps, used when the API reports no interface speed */
    readonly VITE_APP_LINK_SPEED?: string;
    /** Delay in ms before reconnecting after the live stream shuts down */
    readonly VITE_APP_SSE_SHUTDOWN_RECONNECT_DELAY?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
