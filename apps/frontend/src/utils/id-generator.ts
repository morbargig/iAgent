/**
 * Generates a unique ID using timestamp and random string
 * This ensures uniqueness even if called multiple times in the same millisecond
 */
export function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generates a unique ID with a prefix
 */
export function generateUniqueIdWithPrefix(prefix: string): string {
  return `${prefix}-${generateUniqueId()}`;
} 