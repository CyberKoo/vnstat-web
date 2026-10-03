/**
 * minmax - Finds the minimum and maximum elements of an array in a single pass with a comparator
 *
 * @template T The element type
 * @param arr - The array to process (read-only)
 * @param comparator - Comparator: a result < 0 means a is smaller, > 0 means a is larger, = 0 means equal
 * @returns An object with the minimum and maximum of the array. For an empty array it returns
 * { min: undefined, max: undefined }
 *
 * @remarks
 * - The array is traversed only once, so the time complexity is O(n).
 * - comparator should be reflexive and transitive, like the comparator given to Array.prototype.sort.
 * - To get the "last occurring" minimum/maximum, change the < / > comparisons to <= / >=
 *
 * @example
 * // Smallest and largest numbers
 * const arr = [4, 1, 8, 5];
 * minmax(arr, (a, b) => a - b); // { min: 1, max: 8 }
 *
 * // Empty array
 * minmax([], (a, b) => a - b); // { min: undefined, max: undefined }
 *
 * // Array of objects
 * const objs = [{v: 2}, {v: 5}, {v: 1}];
 * minmax(objs, (a, b) => a.v - b.v); // { min: {v: 1}, max: {v: 5} }
 */
export function minMax<T>(
    arr: readonly T[],
    comparator: (a: T, b: T) => number,
): {
    min: T | undefined;
    max: T | undefined;
} {
    const n = arr.length;
    if (n === 0) return { min: undefined, max: undefined };

    let min = arr[0];
    let max = arr[0];

    for (let i = 1; i < n; i++) {
        const x = arr[i];
        if (comparator(x!, min!) < 0) min = x;
        if (comparator(x!, max!) > 0) max = x;
    }

    return { min, max };
}
