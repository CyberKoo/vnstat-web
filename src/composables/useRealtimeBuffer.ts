import { APP_MAX_POINTS } from '@/config';

/**
 * Ring buffer for realtime traffic data.
 *
 * Maintains the X (timestamp), RX and TX data of the most recent MAX_POINTS samples and provides
 * pre-allocated display arrays for updating uPlot efficiently.
 */
export function useRealtimeBuffer() {
    const WINDOW_MS = APP_MAX_POINTS * 1000;
    const MAX_POINTS = APP_MAX_POINTS;

    // ── Raw buffer ──
    const bufX: number[] = [];
    const bufRx: number[] = [];
    const bufTx: number[] = [];

    function clearBuffer() {
        bufX.length = 0;
        bufRx.length = 0;
        bufTx.length = 0;
    }

    function appendBuffer(x: number, rx: number, tx: number) {
        bufX.push(x);
        bufRx.push(rx);
        bufTx.push(tx);
    }

    function trimBuffer(max: number) {
        while (bufX.length > max) {
            bufX.shift();
            bufRx.shift();
            bufTx.shift();
        }
    }

    // ── Display buffer (pre-allocated and refilled in place; the x array reaches uPlot without a
    // copy, while the normalized rx/tx series are built fresh on each push) ──
    const _dispX: number[] = [];
    const _dispRx: number[] = [];
    const _dispTx: number[] = [];

    function fillDisplayBuf() {
        const n = bufX.length;
        _dispX.length = n + 1;
        _dispRx.length = n + 1;
        _dispTx.length = n + 1;
        for (let i = 0; i < n; i++) {
            _dispX[i] = bufX[i];
            _dispRx[i] = bufRx[i];
            _dispTx[i] = bufTx[i];
        }
        const now = Date.now() / 1e3;
        _dispX[n] = now;
        _dispRx[n] = bufRx[n - 1];
        _dispTx[n] = bufTx[n - 1];
    }

    /** Get empty init data for uPlot (2 points) */
    function emptyInitData(): [number[], number[], number[]] {
        const t0 = Date.now() / 1e3;
        return [
            [t0, t0 + 1],
            [0, 0],
            [0, 0],
        ];
    }

    /** Get the current display data (returned after being filled from the raw buffer) */
    function getDisplayData(): [number[], number[], number[]] {
        fillDisplayBuf();
        return [_dispX, _dispRx, _dispTx];
    }

    return {
        /** Time window (milliseconds) */
        WINDOW_MS,
        /** Maximum number of sample points */
        MAX_POINTS,
        /** Raw buffer X data */
        bufX,
        /** Raw buffer RX data */
        bufRx,
        /** Raw buffer TX data */
        bufTx,
        clearBuffer,
        appendBuffer,
        trimBuffer,
        /** Get the filled display data (including the extra point extrapolated to the current moment) */
        getDisplayData,
        /** Empty initial data */
        emptyInitData,
    };
}
