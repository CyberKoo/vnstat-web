/**
 * 1 byte = 8 bits
 */
export const BITS_PER_BYTE = 8 as const;

/**
 * 1 kilobit (Kbit) = 1000 bits
 */
export const BITS_PER_KBIT = 1000 as const;

/**
 * 1 megabit (Mbit) = 1000 kilobits (Kbit) = 1,000,000 bits
 */
export const BITS_PER_MBIT = 1000 * BITS_PER_KBIT;

/**
 * Rate unit constants
 */
export const RATE_UNITS = ['bps', 'Kbps', 'Mbps', 'Gbps'] as const;

/**
 * Rate unit type
 * For example: "bps" | "Kbps" | "Mbps" | "Gbps"
 */
export type RateUnit = (typeof RATE_UNITS)[number];
