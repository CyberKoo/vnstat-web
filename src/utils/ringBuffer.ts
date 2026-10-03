/**
 * Ring buffer (RingBuffer), a FIFO queue with a fixed capacity.
 *
 * When the capacity is full, inserting a new element automatically overwrites the oldest one.
 *
 * @typeParam T - The type of the stored elements
 */
export class RingBuffer<T> {
    /** Array that actually holds the data (may contain undefined) */
    private readonly buf: (T | undefined)[];
    /** Buffer capacity (maximum number of storable elements) */
    private readonly capacity: number;
    /** Index pointing at the oldest element */
    private head: number = 0;
    /** Number of elements currently stored */
    private size: number = 0;

    /**
     * Creates a ring buffer with the given capacity
     * @param capacity - Buffer capacity (must be a positive integer)
     * @throws If the capacity is not a positive finite number
     */
    constructor(capacity: number) {
        if (!Number.isFinite(capacity) || capacity <= 0) {
            throw new Error('capacity must be a positive finite number');
        }
        this.capacity = capacity;
        this.buf = new Array<T | undefined>(capacity);
    }

    /**
     * Number of elements currently stored in the buffer
     */
    get length(): number {
        return this.size;
    }

    /**
     * Enqueue: appends an element to the tail of the buffer. If the buffer is full, the oldest
     * element is overwritten.
     * @param item - The element to add
     */
    push(item: T): void {
        const tail = (this.head + this.size) % this.capacity;
        this.buf[tail] = item;
        if (this.size < this.capacity) {
            this.size++;
        } else {
            // The oldest element was overwritten, so head moves forward
            this.head = (this.head + 1) % this.capacity;
        }
    }

    /**
     * Returns the newest element without removing it.
     * @returns The newest element, or undefined
     */
    peekBack(): T | undefined {
        if (this.size === 0) return undefined;
        const tail = (this.head + this.size - 1) % this.capacity;
        return this.buf[tail];
    }

    /**
     * Empties the buffer
     */
    clear(): void {
        this.buf.fill(undefined);
        this.head = 0;
        this.size = 0;
    }
}
