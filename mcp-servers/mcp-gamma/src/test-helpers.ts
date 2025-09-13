import { vi } from 'vitest';
import { Readable, Writable } from 'stream';

// Debug mode flag
export const DEBUG = process.env.DEBUG_TESTS === 'true';

// Helper to log debug messages
export function debugLog(...args: any[]) {
  if (DEBUG) {
    process.stderr.write(`[DEBUG] ${args.map(arg => {
      if (typeof arg === 'object') return JSON.stringify(arg, null, 2);
      return String(arg);
    }).join(' ')}\n`);
  }
}

// Mock API response helper with consistent nesting structure
export function createMockApiResponse(options = {}) {
  const { data = { message: 'test' }, headers = {}, status = 200, ...rest } = options;
  
  // Format response data consistently
  const responseData = {
    type: 'success',
    success: true,
    result: {
      success: true,
      data: {
        data,
        success: true
      }
    },
    // Include original status and response details for fetch mocking
    status,
    ok: true,
    json: async () => responseData,
    headers: new Headers({
      'content-type': 'application/json',
      ...headers
    })
  };
  
  return {
    ok: true,
    status,
    headers: new Headers({
      'content-type': 'application/json',
      ...headers
    }),
    json: async () => responseData,
    ...rest
  };
}

// Stream helpers
export function createMockReadable() {
  return new Readable({
    read() {}
  });
}

export function createMockWritable() {
  let written = '';
  const writable = new Writable({
    write(chunk, encoding, callback) {
      written += chunk.toString();
      callback();
    }
  });
  return { writable, getWritten: () => written };
}

// Response tracking utility
export interface ResponseTracker {
  responses: any[];
  successes: number;
  errors: number;
  addResponse: (response: any) => void;
  getResponses: () => any[];
  getSuccessCount: () => number;
  getErrorCount: () => number;
  clear: () => void;
}

export function createResponseTracker(): ResponseTracker {
  const state = {
    responses: [] as any[],
    successes: 0,
    errors: 0
  };

  return {
    responses: state.responses,
    successes: state.successes,
    errors: state.errors,
    addResponse: (response: any) => {
      state.responses.push(response);
      // If it's an error response, always count it
      if (response.type === 'error') {
        state.errors++;
        debugLog('Added error response:', response);
      } else if (response.type === 'success') {
        // Check for explicit success flags
        const hasSuccessFlag = response.success === true || response.result?.success === true;

        // Check for valid data
        const hasData = response.result?.data && (
          typeof response.result.data === 'object' || 
          response.result.data.success === true
        );

        // Consider either success flag or valid data as success
        if (hasSuccessFlag || hasData) {
          state.successes++;
          debugLog('Added success response:', response);
        } else {
          debugLog('Response not counted as success:', response);
        }
      }
      // Always append the response for tracking
      debugLog('Added response to tracker, current counts:', 
        { successes: state.successes, errors: state.errors });
    },
    getResponses: () => state.responses,
    getSuccessCount: () => state.successes,
    getErrorCount: () => state.errors,
    clear: () => {
      state.responses = [];
      state.successes = 0;
      state.errors = 0;
    }
  };
}

// Mock readline helper with better concurrency support
export function createMockLineHandler(messages: object[], options: { delay?: number } = {}) {
  const { delay = 0 } = options;
  let messagesSent = 0;
  
  return {
    on: vi.fn((event, handler) => {
      if (event === 'line') {
        // Send all messages concurrently after delay
        Promise.all(messages.map((msg, index) => {
          return new Promise(resolve => {
            setTimeout(() => {
              if (messagesSent < messages.length) {
                handler(JSON.stringify(msg));
                resolve(undefined);
              }
            }, delay);
          });
        }));
      }
    })
  } as any;
}

// Performance test helpers with improved metrics tracking
export interface PerformanceMetrics {
  startTime: number;
  currentTime: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    snapshots: Array<{
      timestamp: number;
      heapUsed: number;
      heapTotal: number;
    }>
  };
  timeRecords: Array<{
    type: 'request' | 'response' | 'custom';
    name?: string;
    startTime: number;
    endTime?: number;
    details?: any;
  }>
}

export function mockPerformanceMetrics(): PerformanceMetrics {
  const metrics: PerformanceMetrics = {
    startTime: Date.now(),
    currentTime: Date.now(),
    memoryUsage: {
      heapUsed: 0,
      heapTotal: 0,
      snapshots: []
    },
    timeRecords: []
  };

  // Mock process.memoryUsage
  vi.spyOn(process, 'memoryUsage').mockImplementation(() => {
    const snapshot = {
      timestamp: Date.now() - metrics.startTime,
      heapUsed: metrics.memoryUsage.heapUsed,
      heapTotal: metrics.memoryUsage.heapTotal
    };
    metrics.memoryUsage.snapshots.push(snapshot);


    return {
      heapUsed: metrics.memoryUsage.heapUsed,
      heapTotal: metrics.memoryUsage.heapTotal,
      external: 0,
      arrayBuffers: 0,
      rss: 0
    };
  });

  // Mock performance.now with more accurate timestamps
  vi.spyOn(performance, 'now').mockImplementation(() => {
    metrics.currentTime = Date.now();
    return metrics.currentTime - metrics.startTime;
  });

  // Helper to record timing events
  const recordTiming = (type: 'request' | 'response' | 'custom', name?: string, details?: any) => {
    const record = {
      type,
      name,
      startTime: performance.now(),
      details
    };
    metrics.timeRecords.push(record);
    return metrics.timeRecords.length - 1; // Return index for ending the timing
  };

  // Helper to end timing record
  const endTiming = (index: number, details?: any) => {
    if (metrics.timeRecords[index]) {
      metrics.timeRecords[index].endTime = performance.now();
      if (details) {
        metrics.timeRecords[index].details = {
          ...metrics.timeRecords[index].details,
          ...details
        };
      }
    }
  };

  // Add helpers to metrics object
  return Object.assign(metrics, {
    recordTiming,
    endTiming,
    // Simulate memory allocation
    allocateMemory: (bytes: number) => {
      metrics.memoryUsage.heapUsed += bytes;
      metrics.memoryUsage.heapTotal = Math.max(
        metrics.memoryUsage.heapTotal,
        metrics.memoryUsage.heapUsed + 1024 * 1024 // 1MB buffer
      );
    },
    // Simulate memory release
    releaseMemory: (bytes: number) => {
      metrics.memoryUsage.heapUsed = Math.max(0, metrics.memoryUsage.heapUsed - bytes);
    }
  });
}

// Network helpers
export const DEFAULT_TIMEOUT = 5000;
export const DEFAULT_BASE_URL = 'https://api.gamma.app/v1';

export function setupNetworkMocks() {
  process.env.REQUEST_TIMEOUT_MS = String(DEFAULT_TIMEOUT);
  process.env.GAMMA_BASE_URL = DEFAULT_BASE_URL;
}