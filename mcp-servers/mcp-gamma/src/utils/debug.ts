/**
 * Debug logging utility function that only logs when DEBUG_TESTS env var is set
 */
export function debugLog(...args: any[]) {
  if (process.env.DEBUG_TESTS) {
    console.log('[DEBUG]', ...args);
  }
}