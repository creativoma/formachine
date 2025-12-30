export interface TimestampedData<T> {
  timestamp: number
  data: T
}

export function isExpired(timestamp: number, ttl: number): boolean {
  if (ttl <= 0) {
    return false // No expiration
  }
  return Date.now() > timestamp + ttl
}

export function wrapWithTimestamp<T>(data: T): TimestampedData<T> {
  return {
    timestamp: Date.now(),
    data,
  }
}

export function unwrapIfNotExpired<T>(timestamped: TimestampedData<T>, ttl: number): T | null {
  if (isExpired(timestamped.timestamp, ttl)) {
    return null
  }
  return timestamped.data
}
