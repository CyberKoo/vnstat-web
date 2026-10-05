import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import request from '@/api/request';

function jsonResponse(body: unknown, init: { status?: number; statusText?: string } = {}) {
    return new Response(JSON.stringify(body), {
        status: init.status ?? 200,
        statusText: init.statusText ?? 'OK',
        headers: { 'Content-Type': 'application/json' },
    });
}

const fetchMock = vi.fn();

beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('request', () => {
    it('successful response: unwraps the JSend envelope and returns data', async () => {
        fetchMock.mockResolvedValue(jsonResponse({ status: 'success', data: { name: 'eth0' } }));
        await expect(request<{ name: string }>({ url: '/interfaces' })).resolves.toEqual({ name: 'eth0' });
    });

    it('JSend error: throws the server error structure as-is', async () => {
        const errBody = { status: 'error', code: 404, message: 'interface not found', data: null };
        fetchMock.mockResolvedValue(jsonResponse(errBody, { status: 404, statusText: 'Not Found' }));
        await expect(request({ url: '/interfaces/xxx' })).rejects.toMatchObject({
            status: 'error',
            code: 404,
            message: 'interface not found',
        });
    });

    it('non-2xx HTTP with a non-JSON body: throws a status error', async () => {
        fetchMock.mockResolvedValue(
            new Response('<html>oops</html>', { status: 500, statusText: 'Internal Server Error' }),
        );
        await expect(request({ url: '/x' })).rejects.toMatchObject({ code: 500, message: 'Internal Server Error' });
    });

    it('network error: throws code -1 / Network Error', async () => {
        fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
        await expect(request({ url: '/x' })).rejects.toMatchObject({ code: -1, message: 'Network Error' });
    });

    it('timeout (raised by AbortSignal.timeout): throws Request timeout', async () => {
        // Real fetch rejects with the signal's abort reason verbatim: a TimeoutError DOMException
        fetchMock.mockRejectedValue(new DOMException('The operation timed out', 'TimeoutError'));
        await expect(request({ url: '/x', timeout: 10 })).rejects.toMatchObject({
            code: -1,
            message: 'Request timeout',
        });
    });

    it('cancellation through an external signal: throws the AbortError as-is (not wrapped in JSend)', async () => {
        const controller = new AbortController();
        controller.abort(new DOMException('poll:stopped', 'AbortError'));
        // Real fetch rejects with the abort reason verbatim
        const err = controller.signal.reason as DOMException;
        fetchMock.mockRejectedValue(err);

        await expect(request({ url: '/x', signal: controller.signal })).rejects.toBe(err);
    });

    it('cancellation with a non-DOMException reason is not recognized and becomes Network Error', async () => {
        // Pins the contract usePoll relies on: abort reasons must be AbortError DOMExceptions,
        // because fetch rejects with the reason verbatim and only AbortError is rethrown silently
        fetchMock.mockRejectedValue(new Error('poll:stopped'));
        await expect(request({ url: '/x' })).rejects.toMatchObject({ code: -1, message: 'Network Error' });
    });

    it('serializes the GET request params', async () => {
        fetchMock.mockResolvedValue(jsonResponse({ status: 'success', data: [] }));
        await request({ url: '/interfaces', params: { a: 1, b: 'x', c: null, d: undefined } });
        const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toContain('/interfaces?a=1&b=x');
        expect(url).not.toContain('c=');
        expect(url).not.toContain('d=');
    });

    it('serializes the POST body as JSON', async () => {
        fetchMock.mockResolvedValue(jsonResponse({ status: 'success', data: null }));
        await request({ url: '/x', method: 'post', data: { foo: 1 } });
        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(init.method).toBe('POST');
        expect(init.body).toBe(JSON.stringify({ foo: 1 }));
    });

    it('sends no body on GET requests', async () => {
        fetchMock.mockResolvedValue(jsonResponse({ status: 'success', data: null }));
        await request({ url: '/x', method: 'get', data: { foo: 1 } });
        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(init.body).toBeUndefined();
    });
});
