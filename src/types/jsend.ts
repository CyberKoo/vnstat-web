/**
 * Base interface for the standard JSend response structure.
 *
 * Reference: [JSend specification](https://github.com/omniti-labs/jsend)
 *
 * @template T The response data type, default unknown.
 */
export interface JSendResponse<T = unknown> {
    /**
     * Response status.
     * - "success": the request succeeded and the data field holds the result.
     * - "fail": the request failed, usually because the client submitted invalid data, and the data
     *   field holds the details.
     * - "error": a server-side error, and the message field holds the error description (optional).
     */
    status: 'success' | 'fail' | 'error';

    /**
     * HTTP status code or a custom backend error code.
     */
    code: number;

    /**
     * Error or status information, optional.
     */
    message?: string;

    /**
     * Response data, optional. The type is determined by the generic T.
     */
    data?: T;
}
