// Read the app config from Vite env vars, with type coercion and default handling

/**
 * Base API path (e.g. "/api/v1"), defaulted from the .env config or "/api/v1"
 */
export const API_BASE_URL: string = import.meta.env.VITE_APP_BASE_API ?? '/api/v1';

/**
 * Maximum number of chart points, 60 by default
 */
export const APP_MAX_POINTS: number = Number(import.meta.env.VITE_APP_MAX_POINTS ?? 60);

/**
 * Fallback link speed (Mbps), 1000 by default.
 *
 * The actual link speed reported by the backend at /interfaces/{name}/link-speed is
 * preferred; this value is only used as a fallback when the endpoint is unavailable
 * or does not provide one.
 */
export const LINK_SPEED: number = Number(import.meta.env.VITE_APP_LINK_SPEED ?? 1000);

/**
 * Delay in milliseconds before automatically reconnecting after an SSE shutdown event, 30 seconds by default
 */
export const SSE_SHUTDOWN_RECONNECT_DELAY_MS: number = Number(
    import.meta.env.VITE_APP_SSE_SHUTDOWN_RECONNECT_DELAY ?? 30_000,
);
