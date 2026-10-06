import type { ByteUnit, RateUnit } from '@/constants';
import { formatDecimal } from '@/utils/numbers';
import {
    BITS_PER_BYTE,
    BITS_PER_KBIT,
    BYTE_UNITS,
    BYTES_IN_GIB,
    BYTES_IN_KIB,
    BYTES_IN_MIB,
    RATE_UNITS,
} from '@/constants';

/**
 * Byte formatting result object
 */
export interface ByteFormatResult {
    /** Raw byte count */
    raw: number;
    /** Locale-independent scaled numeric string (safe to parse) */
    value: string;
    /** Formatted string (with unit and truncation) */
    formatted: string;
    /** Unit (B/KiB/MiB/GiB, etc.) */
    unit: ByteUnit;
    /** Unit exponent */
    exponent: number;
}

/**
 * Rate formatting result object
 */
export interface RateFormatResult {
    /** Raw input value (bytes for bytesToRate/bytesToRateClamped, bits for bitsToRate) */
    raw: number;
    /** Formatted rate (already scaled to the unit) */
    value: string;
    /** Formatted string (with unit and truncation) */
    formatted: string;
    /** Unit (bps/Kbps/Mbps/Gbps) */
    unit: RateUnit;
}

/**
 * Formats a byte count for friendly display (B/KiB/MiB/GiB, etc., IEC binary units).
 *
 * @param bytes - Byte count
 * @param fixed - Number of decimal places, default 2
 * @returns Byte formatting result object
 */
export function formatBytes(bytes: number | undefined, fixed = 2): ByteFormatResult {
    // Handle undefined or values below 1
    if (bytes === undefined || bytes < 1) {
        return {
            raw: 0,
            value: '0',
            formatted: '0 B',
            unit: BYTE_UNITS[0],
            exponent: 0,
        };
    }

    // Compute the unit exponent
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(BYTES_IN_KIB)), BYTE_UNITS.length - 1);

    // Scale to the matching unit
    const value = bytes / Math.pow(BYTES_IN_KIB, exponent);

    return {
        raw: bytes,
        value: value.toFixed(fixed),
        formatted: `${formatDecimal(value, fixed)} ${BYTE_UNITS[exponent]}`,
        unit: BYTE_UNITS[exponent],
        exponent,
    };
}

/**
 * Converts a byte count into a bit rate (bit/s) and formats it for display (bps/Kbps/Mbps, etc.).
 *
 * @param bytes - Byte count
 * @param interval - Time interval in seconds, default 1
 * @param fixed - Number of decimal places, default 2
 * @returns Rate formatting result object
 * @throws If interval is less than or equal to 0
 */
export function bytesToRate(bytes: number | undefined, interval: number = 1, fixed: number = 2): RateFormatResult {
    if (interval <= 0) throw new Error('interval must be greater than 0');
    if (bytes === undefined || bytes < 1) {
        return {
            raw: bytes ?? 0,
            value: '0',
            formatted: `0 ${RATE_UNITS[0]}`,
            unit: RATE_UNITS[0],
        };
    }
    // Convert bytes to bits
    const bits = bytes * BITS_PER_BYTE;
    const formatted = formatBitRate(bits, interval, fixed);
    return {
        raw: bytes,
        ...formatted,
    };
}

/**
 * Internal function that formats a bit count into rate units (bps/Kbps/Mbps, etc.).
 *
 * @param bits - Bit count
 * @param interval - Time interval in seconds
 * @param fixed - Number of decimal places
 * @returns The formatted rate (without the raw value)
 * @internal
 */
function formatBitRate(bits: number, interval: number, fixed: number): Omit<RateFormatResult, 'raw'> {
    const value = bits / interval;
    let unitIndex = 0;
    let displayValue = '0';

    if (value >= 1) {
        // Pick a suitable unit for the value (bps/Kbps/Mbps, etc.)
        unitIndex = Math.min(Math.floor(Math.log(value) / Math.log(BITS_PER_KBIT)), RATE_UNITS.length - 1);
        displayValue = (value / Math.pow(BITS_PER_KBIT, unitIndex)).toFixed(fixed);
    }

    const unit = RATE_UNITS[unitIndex];

    return {
        value: displayValue,
        formatted: `${value >= 1 ? formatDecimal(value / Math.pow(BITS_PER_KBIT, unitIndex), fixed) : '0'} ${unit}`,
        unit,
    };
}

/**
 * Formats bytes per second (bytes/sec) into a friendly IEC display (B/s, KiB/s, MiB/s, GiB/s).
 *
 * @param v - Bytes per second
 * @param fixed - Number of decimal places, default 0 (integer)
 * @returns Formatted string, e.g. "5 MiB/s", "1023 KiB/s", "1.23 MiB/s"
 */
export function formatByteRate(v: number, fixed: number = 0): string {
    if (v >= BYTES_IN_GIB) return formatDecimal(v / BYTES_IN_GIB, fixed) + ' GiB/s';
    if (v >= BYTES_IN_MIB) return formatDecimal(v / BYTES_IN_MIB, fixed) + ' MiB/s';
    if (v >= BYTES_IN_KIB) return formatDecimal(v / BYTES_IN_KIB, fixed) + ' KiB/s';
    return formatDecimal(v, fixed) + ' B/s';
}
