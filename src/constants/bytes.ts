/**
 * IEC binary byte units, from B to EiB, in ascending order.
 * - B   : Byte
 * - KiB : Kibibyte (1024 bytes)
 * - MiB : Mebibyte (1024^2 bytes)
 * - GiB : Gibibyte (1024^3 bytes)
 * - TiB : Tebibyte (1024^4 bytes)
 * - PiB : Pebibyte (1024^5 bytes)
 * - EiB : Exbibyte (1024^6 bytes)
 */
export const BYTE_UNITS = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB'] as const;

/**
 * Byte unit type, taken from BYTE_UNITS.
 */
export type ByteUnit = (typeof BYTE_UNITS)[number];

/**
 * Unit rank map, used for ordering or comparing units.
 * The larger the rank value, the larger the unit.
 *
 * @example
 * UnitRank["MiB"] // 2
 * UnitRank["B"]   // 0
 */
const UnitRank: Record<ByteUnit, number> = {
    B: 0,
    KiB: 1,
    MiB: 2,
    GiB: 3,
    TiB: 4,
    PiB: 5,
    EiB: 6,
};

/**
 * Constants for the real number of bytes in each byte unit.
 * Follows the IEC (base 1024) standard.
 */
export const BYTES_IN_B = 1 as const; // 1 byte
export const BYTES_IN_KIB = 1024 * BYTES_IN_B; // 1 KiB = 1024 B
export const BYTES_IN_MIB = 1024 * BYTES_IN_KIB; // 1 MiB = 1024 KiB
export const BYTES_IN_GIB = 1024 * BYTES_IN_MIB; // 1 GiB = 1024 MiB
export const BYTES_IN_TIB = 1024 * BYTES_IN_GIB; // 1 TiB = 1024 GiB
export const BYTES_IN_PIB = 1024 * BYTES_IN_TIB; // 1 PiB = 1024 TiB
export const BYTES_IN_EIB = 1024 * BYTES_IN_PIB; // 1 EiB = 1024 PiB

/**
 * Byte units in ascending order (from B to EiB), each entry holding the unit label and its size in bytes.
 *
 * @example
 * BYTES_UNITS[2] // { label: 'MiB', size: 1048576 }
 */
export const BYTES_UNITS: { label: ByteUnit; size: number }[] = [
    { label: 'B', size: BYTES_IN_B },
    { label: 'KiB', size: BYTES_IN_KIB },
    { label: 'MiB', size: BYTES_IN_MIB },
    { label: 'GiB', size: BYTES_IN_GIB },
    { label: 'TiB', size: BYTES_IN_TIB },
    { label: 'PiB', size: BYTES_IN_PIB },
    { label: 'EiB', size: BYTES_IN_EIB },
];

/**
 * Byte units in descending order (from EiB to B), typically used to pick the largest suitable unit when formatting.
 *
 * @example
 * BYTES_UNITS_DESC[0] // { label: 'EiB', size: ... }
 */
export const BYTES_UNITS_DESC: { label: ByteUnit; size: number }[] = [...BYTES_UNITS].reverse();

/**
 * Compares the size of two byte units.
 *
 * @param u1 - unit 1, e.g. 'KiB'
 * @param u2 - unit 2, e.g. 'MiB'
 * @returns negative when u1 < u2, positive when u1 > u2, 0 when they are equal
 *
 * @example
 * compareUnit('KiB', 'MiB') // -1
 * compareUnit('GiB', 'MiB') // 1
 * compareUnit('TiB', 'TiB') // 0
 */
export function compareUnit(u1: ByteUnit, u2: ByteUnit): number {
    return Math.sign(UnitRank[u1] - UnitRank[u2]);
}
