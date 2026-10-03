import type { JSendResponse } from '@/types/jsend';

/**
 * API base path, read from the environment variables.
 *
 * Always relative. The dev and preview servers proxy it to VITE_API_SERVER, and a production
 * deployment is expected to reverse-proxy it on the web server. VITE_API_SERVER is deliberately
 * never read here, so no build machine address can end up in a release bundle.
 */
const BASE_API = import.meta.env.VITE_APP_BASE_API || '/api/v1';

/**
 * Request configuration.
 */
export interface RequestConfig {
    /** Request path (relative to baseURL) */
    url: string;
    /** HTTP method, default get */
    method?: string;
    /** Request body; objects are serialized to JSON automatically */
    data?: unknown;
    /** URL query parameters */
    params?: Record<string, string | number | boolean | null | undefined>;
    /** Custom request headers */
    headers?: Record<string, string>;
    /** Timeout in milliseconds, default 10000 */
    timeout?: number;
    /** External AbortSignal (merged with the built-in timeout) used to cancel the request on demand */
    signal?: AbortSignal;
}

/**
 * Whether the error is an external cancellation (AbortError).
 * Timeouts arrive as a TimeoutError instead — see isTimeoutError.
 */
function isAbortError(err: unknown): err is DOMException {
    return err instanceof DOMException && err.name === 'AbortError';
}

/**
 * Whether the abort was triggered by the built-in timeout (AbortSignal.timeout).
 *
 * When AbortSignal.timeout fires, fetch rejects with the abort reason itself — a DOMException
 * with name === 'TimeoutError' — not with an AbortError.
 */
function isTimeoutError(err: unknown): boolean {
    return err instanceof DOMException && err.name === 'TimeoutError';
}

/**
 * Unified network request method built on fetch.
 *
 * @template T The returned data type
 * @param config - Request configuration object
 * @returns Promise<T>, resolving to the generic data T on success and throwing a JSend error
 * structure on failure
 *
 * @example
 * ```ts
 * // Fetch user information
 * const user = await request<User>({ url: '/user', method: 'get' });
 * ```
 */
async function request<T = unknown>(config: RequestConfig): Promise<T> {
    const {
        url,
        method = 'get',
        data,
        params,
        headers: customHeaders,
        timeout = 10000,
        signal: externalSignal,
    } = config;

    // Build the full URL
    let fullUrl = `${BASE_API}${url}`;
    if (params) {
        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (value != null) searchParams.append(key, String(value));
        }
        const qs = searchParams.toString();
        if (qs) fullUrl += `?${qs}`;
    }

    // Build the fetch options: the external signal is merged with the built-in timeout, so either
    // one aborting cancels the request
    const init: RequestInit = {
        method: method.toUpperCase(),
        headers: { 'Content-Type': 'application/json', ...customHeaders },
        signal: externalSignal
            ? AbortSignal.any([externalSignal, AbortSignal.timeout(timeout)])
            : AbortSignal.timeout(timeout),
    };
    if (data != null && !['GET', 'HEAD'].includes(init.method!)) {
        init.body = JSON.stringify(data);
    }

    // Send the request
    let response: Response;
    try {
        response = await fetch(fullUrl, init);
    } catch (err) {
        // Explicit cancellation by the external signal: rethrow as-is so callers can stay silent
        if (isAbortError(err)) {
            throw err;
        }
        // Network error or timeout
        throw {
            status: 'error',
            code: -1,
            message: isTimeoutError(err) ? 'Request timeout' : 'Network Error',
            data: null,
        } as JSendResponse;
    }

    // Parse the JSON response body
    let json: unknown;
    try {
        json = await response.json();
    } catch {
        if (!response.ok) {
            throw {
                status: 'error',
                code: response.status,
                message: response.statusText || 'Request failed',
                data: null,
            } as JSendResponse;
        }
        throw {
            status: 'error',
            code: -1,
            message: 'Invalid JSON response',
            data: null,
        } as JSendResponse;
    }

    // When the server returns a JSend response, pass it through as-is and keep the original message
    if (!response.ok) {
        if (json && typeof json === 'object' && 'status' in json) {
            throw json as JSendResponse;
        }
        throw {
            status: 'error',
            code: response.status,
            message: response.statusText || 'Request failed',
            data: json,
        } as JSendResponse;
    }

    // Successful response, unwrap the JSend envelope
    const res = json as JSendResponse<T>;
    if (res.status === 'success') {
        return res.data as T;
    }
    throw res;
}

export default request;
