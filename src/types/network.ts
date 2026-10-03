/**
 * vnStat realtime network statistics structure.
 */
export interface NetworkStats {
    /** Unique identifier index */
    index: number;
    /** Number of seconds covered (usually the sampling interval in seconds) */
    seconds: number;
    /** Received (RX) traffic information */
    rx: {
        /** Rate as a string (e.g. "512 kbit/s") */
        ratestring: string;
        /** Bytes received per second */
        bytespersecond: number;
        /** Packets received per second */
        packetspersecond: number;
        /** Bytes received in the current period */
        bytes: number;
        /** Packets received in the current period */
        packets: number;
        /** Total bytes received */
        totalbytes: number;
        /** Total packets received */
        totalpackets: number;
    };
    /** Sent (TX) traffic information */
    tx: {
        /** Rate as a string (e.g. "512 kbit/s") */
        ratestring: string;
        /** Bytes sent per second */
        bytespersecond: number;
        /** Packets sent per second */
        packetspersecond: number;
        /** Bytes sent in the current period */
        bytes: number;
        /** Packets sent in the current period */
        packets: number;
        /** Total bytes sent */
        totalbytes: number;
        /** Total packets sent */
        totalpackets: number;
    };
}

/**
 * Date structure with some optional fields.
 */
export interface VnstatDate {
    /** Year (e.g. 2024) */
    year: number;
    /** Month (1-12), optional */
    month?: number;
    /** Day (1-31), optional */
    day?: number;
}

/**
 * Time structure.
 */
export interface VnstatTime {
    /** Hour (0-23) */
    hour: number;
    /** Minute (0-59) */
    minute: number;
}

/**
 * A single traffic data item.
 */
export interface TrafficItem {
    /** Date information */
    date: VnstatDate;
    /** Unique identifier ID */
    id: number;
    /** Bytes received */
    rx: number;
    /** Bytes sent */
    tx: number;
    /** Unix timestamp (seconds) */
    timestamp: number;
    /** Time information (optional, present in some types) */
    time?: VnstatTime;
}

/**
 * A single traffic data item. (simplified)
 */
export interface TrafficItemLite {
    /** Bytes received */
    rx: number;
    /** Bytes sent */
    tx: number;
}

/**
 * Collection of network traffic statistics.
 */
export interface Traffic {
    /** Traffic by day */
    day: TrafficItem[];
    /** Traffic in 5 minute intervals */
    fiveminute: TrafficItem[];
    /** Traffic by hour */
    hour: TrafficItem[];
    /** Traffic by month */
    month: TrafficItem[];
    /** Top N (highest traffic) statistics */
    top: TrafficItem[];
    /** Total traffic */
    total: {
        /** Total bytes received */
        rx: number;
        /** Total bytes sent */
        tx: number;
    };
    /** Traffic by year */
    year: TrafficItem[];
}

/**
 * Timestamp structure with a date and a timestamp.
 */
export interface Timestamp {
    /** Date information */
    date: VnstatDate;
    /** Unix timestamp (seconds) */
    timestamp: number;
    /** Time information (optional) */
    time?: VnstatTime;
}

/**
 * Detailed traffic information for a single network interface.
 */
export interface VnstatInterfaceDetail {
    /** Interface alias */
    alias: string;
    /** Creation time */
    created: Timestamp;
    /** Network interface name (e.g. eth0, wlan0) */
    name: string;
    /** Traffic statistics for each period type */
    traffic: Traffic;
    /** Last update time */
    updated: Timestamp;
}

/**
 * Realtime traffic data
 */
export interface TimedNetworkStats {
    timestamp: number;
    stats: NetworkStats;
}

/**
 * Link speed of a single network interface (from /interfaces/{name}/link-speed).
 */
export interface InterfaceLinkSpeed {
    /** Interface name */
    interface: string;
    /** Receive (RX) link speed (Mbps) */
    rx: number;
    /** Send (TX) link speed (Mbps) */
    tx: number;
}

/**
 * Interface summary information (from /interfaces/summary).
 */
export interface InterfaceSummary {
    /** Interface name */
    name: string;
    /** Interface alias */
    alias: string;
    /** Cumulative total traffic */
    total: {
        rx: number;
        tx: number;
    };
    /** Traffic received today (bytes) */
    todayRx: number;
    /** Traffic sent today (bytes) */
    todayTx: number;
    /** Last update time (Unix timestamp, seconds) */
    updatedTimestamp: number;
}

/**
 * Aggregated statistics across interfaces (from /interfaces/stats).
 */
export interface InterfaceStats {
    /** Total number of interfaces */
    totalInterfaces: number;
    /** Total traffic received across all interfaces (bytes) */
    totalRx: number;
    /** Total traffic sent across all interfaces (bytes) */
    totalTx: number;
}
