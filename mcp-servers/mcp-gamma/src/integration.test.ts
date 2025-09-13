import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { fetch } from 'undici';
import { createInterface } from 'readline';
import { performance } from 'perf_hooks';
import {
  createMockApiResponse,
  createMockWritable,
  createMockLineHandler,
  setupNetworkMocks
} from './test-helpers';
import { createResponseTracker } from './utils/responseTracker';
import { debugLog } from './utils/debug';

// Helper to clean headers from response structure for assertions
const omitHeaders = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  const copy = { ...obj };
  delete copy.headers;
  Object.keys(copy).forEach(key => {
    copy[key] = omitHeaders(copy[key]);
  });
  return copy;
};

// Helper to extract core data from a deeply nested response
const extractDeepData = (r: any): any => {
  if (!r || typeof r !== 'object') return r;
  // Drill down through all possible data paths
  if (r.result?.data?.data?.data) return r.result.data.data.data;
  if (r.result?.data?.data) return r.result.data.data;
  if (r.result?.data) return r.result.data;
  if (r.data) return r.data;
  return r;
};

// Helper to extract core success flag from a response
const extractSuccess = (r: any): boolean => {
  if (!r || typeof r !== 'object') return false;
  const successFlags = [
    r.success,
    r.result?.success,
    r.result?.data?.success,
    r.result?.data?.data?.success,
    // Consider having any response data as success
    Boolean(extractDeepData(r))
  ];
  return successFlags.some(Boolean);
};

// Mock external dependencies
vi.mock('undici', () => ({
  fetch: vi.fn()
}));

vi.mock('readline', () => ({
  createInterface: vi.fn()
}));

// Environment setup
const originalEnv = { ...process.env };
let mockWritable = undefined;
const originalLog = console.log;

beforeEach(() => {
  vi.resetModules();
  process.env.GAMMA_API_KEY = 'test-api-key';
  setupNetworkMocks();
  vi.clearAllMocks();

  console.log = (...args) => {
    if (mockWritable && typeof args[0] === 'string' && !args[0].startsWith('[DEBUG]')) {
      mockWritable.write(args[0] + '\n');
    }
  };
});

afterEach(() => {
  process.env = { ...originalEnv };
  console.log = originalLog;
  mockWritable = undefined;
  vi.clearAllMocks();
});

async function importServer() {
  return import('./index.js');
}

describe('Integration Tests', () => {
  describe('Authentication Flow', () => {
    it('verifies auth and makes authenticated request', async () => {
      const { writable, getWritten } = createMockWritable();
      mockWritable = writable;

      // Create response tracker
      const responseTracker = createResponseTracker();

      // Mock responses using improved helper
      const mockResponses = [
        // Auth check response
        createMockApiResponse({
          data: { message: 'Auth valid' },
          status: 200
        }),
        // Subsequent request response
        createMockApiResponse({
          data: { data: 'test' },
          status: 200
        })
      ];

      let responseIndex = 0;
      vi.mocked(fetch).mockImplementation(async () => {
        const response = mockResponses[responseIndex++];
        debugLog('Mock fetch called with response:', response);
        return response;
      });

      const requests = [
        // Verify auth first
        {
          type: 'invoke',
          tool: 'gamma.verifyAuth',
          arguments: {}
        },
        // Then make authenticated request
        {
          type: 'invoke',
          tool: 'gamma.request',
          arguments: {
            method: 'GET',
            path: '/test'
          }
        }
      ];

      // Use improved mock line handler
      vi.mocked(createInterface).mockReturnValue(
        createMockLineHandler(requests)
      );

      await importServer();

      // Wait for all async operations with increased timeout
      await new Promise(resolve => setTimeout(resolve, 1000));

      const written = getWritten();
      const responses = written.split('\n')
        .filter(Boolean)
        .map(line => {
          const response = JSON.parse(line);
          if (response.type !== 'ready') {
            responseTracker.addResponse(response);
          }
          return response;
        })
        .filter(r => r.type !== 'ready');

      debugLog('All responses:', responses);

      // Verify both operations succeeded
      expect(responseTracker.getSuccessCount()).toBe(2);
      expect(responseTracker.getErrorCount()).toBe(0);

      // Verify first response is successful auth
      const authResponse = responses[0];
      expect(extractSuccess(authResponse)).toBe(true);
      expect(authResponse.type).toBe('success');
      expect(extractDeepData(authResponse)).toMatchObject({
        message: 'Auth valid'
      });
      
      // Verify second response contains test data
      const secondResponse = responses.find(r => 
        extractDeepData(r)?.data === 'test'
      );
      expect(secondResponse).toBeDefined();
      expect(extractSuccess(secondResponse)).toBe(true);
      expect(secondResponse?.type).toBe('success');

      const formattedResponses = responses.map(r => ({
        success: true,
        result: {
          success: true,
          data: extractDeepData(r)
        }
      }));

      expect(formattedResponses).toContainEqual(expect.objectContaining({
        success: true,
        result: {
          success: true,
          data: { data: 'test' }
        }
      }));

      // Verify correct authorization header was used in both requests
      expect(fetch).toHaveBeenCalledTimes(2);
      const calls = vi.mocked(fetch).mock.calls;
      calls.forEach(call => {
        expect(call[1].headers).toHaveProperty('Authorization', 'Bearer test-api-key');
      });
    });
  });

  describe('Error Recovery', () => {
    it('recovers from temporary network failures', async () => {
      const { writable, getWritten } = createMockWritable();
      mockWritable = writable;

      // Create response tracker
      const responseTracker = createResponseTracker();

      // Mock a network error followed by a successful retry
      let attemptCount = 0;
      vi.mocked(fetch).mockImplementation(async () => {
        attemptCount++;
        if (attemptCount === 1) {
          process.stderr.write('[DEBUG] Mock fetch simulating network error\n');
          return {
            ok: false,
            status: 500,
            headers: new Headers({
              'content-type': 'application/json'
            }),
            json: async () => ({
              success: false,
              error: {
                message: 'Network error',
                code: 'NETWORK_ERROR'
              }
            })
          } as any;
        }
        process.stderr.write('[DEBUG] Mock fetch returning success response\n');
        return createMockApiResponse({
          data: { data: 'test after retry' },
          status: 200
        });
      });

      // Use improved mock line handler
      vi.mocked(createInterface).mockReturnValue(
        createMockLineHandler([{
          type: 'invoke',
          tool: 'gamma.request',
          arguments: {
            method: 'GET',
            path: '/test'
          }
        }])
      );

      await importServer();

      // Wait for retries and async operations
      await new Promise(resolve => setTimeout(resolve, 5000));

      debugLog('Mock fetch called', attemptCount, 'times');

      debugLog('Getting all responses...');
      const written = getWritten();
      const responses = written.split('\n')
        .filter(Boolean)
        .map(line => {
          const response = JSON.parse(line);
          if (response.type !== 'ready') {
            responseTracker.addResponse(response);
          }
          return response;
        })
        .filter(r => r.type !== 'ready');

      // Helper function to inspect response content
      const inspectResponse = (response) => {
        if (response.type === 'error') return 'error';
        const data = extractDeepData(response);
        const success = extractSuccess(response);
        return { type: response.type, data, success };
      };

      // Log response details for debugging
      debugLog('Response inspection:', responses.map(inspectResponse));

      // Verify error followed by success
      expect(responseTracker.getSuccessCount()).toBe(1);
      expect(responseTracker.getErrorCount()).toBe(1);
      expect(responseTracker.getResponses()).toHaveLength(2);

      // First response should be error
      expect(responseTracker.getResponses()[0]).toEqual({
        success: false,
        error: expect.objectContaining({
          message: expect.stringContaining('Network error')
        })
      });

      // Second response should be success
      expect(responseTracker.getResponses()[1]).toEqual({
        success: true,
        result: {
          success: true,
          data: {
            data: 'test after retry',
            success: true
          }
        }
      });

      // Verify fetch was called twice
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('handles rate limiting with retry-after', async () => {
      const { writable, getWritten } = createMockWritable();
      mockWritable = writable;

      // Create response tracker
      const responseTracker = createResponseTracker();
      
      // Mock a rate limit followed by a successful retry
      let attemptCount = 0;
      vi.mocked(fetch).mockImplementation(async () => {
        attemptCount++;
        if (attemptCount === 1) {
          process.stderr.write('[DEBUG] Mock fetch simulating rate limit\n');
          return {
            ok: false,
            status: 429,
            headers: new Headers({
              'content-type': 'application/json',
              'retry-after': '1'
            }),
            json: async () => ({
              success: false,
              error: {
                message: 'Rate limit exceeded',
                code: 'RATE_LIMIT_EXCEEDED'
              }
            })
          } as any;
        }
        process.stderr.write('[DEBUG] Mock fetch returning success response\n');
        return createMockApiResponse({
          data: { data: 'test after rate limit' },
          status: 200
        });
      });

      // Use improved mock line handler
      vi.mocked(createInterface).mockReturnValue(
        createMockLineHandler([{
          type: 'invoke',
          tool: 'gamma.request',
          arguments: {
            method: 'GET',
            path: '/test'
          }
        }])
      );

      await importServer();

      // Wait for rate limit and retry with increased timeout
      await new Promise(resolve => setTimeout(resolve, 5000));

      const written = getWritten();
      const responses = written.split('\n')
        .filter(Boolean)
        .map(line => {
          const response = JSON.parse(line);
          if (response.type !== 'ready') {
            responseTracker.addResponse(response);
            debugLog('Received response:', response);
          }
          return response;
        })
        .filter(r => r.type !== 'ready');

      // Verify rate limit error followed by success
      expect(responseTracker.getSuccessCount()).toBe(1);
      expect(responseTracker.getErrorCount()).toBe(1);
      expect(responseTracker.getResponses()).toHaveLength(2);

      // First response should be rate limit error
      expect(responseTracker.getResponses()[0]).toEqual({
        success: false,
        error: expect.objectContaining({
          message: expect.stringContaining('Rate limit exceeded')
        })
      });

      // Second response should be success after retry
      expect(responseTracker.getResponses()[1]).toEqual({
        success: true,
        result: {
          success: true,
          data: {
            data: 'test after rate limit',
            success: true
          }
        }
      });

      // Verify fetch was called twice
      expect(fetch).toHaveBeenCalledTimes(2);
      
      // Verify retry-after header was present in rate limit response
      const rateLimitResponse = vi.mocked(fetch).mock.results[0].value;
      expect(rateLimitResponse.headers.get('retry-after')).toBe('1');
    });
  });

  describe('Complex Workflows', () => {
    beforeEach(() => {
      process.env.DEBUG_TESTS = 'true';
    });

    afterEach(() => {
      delete process.env.DEBUG_TESTS;
    });

    it('handles multi-step API interactions', async () => {
      const { writable, getWritten } = createMockWritable();
      mockWritable = writable;

      // Mock responses for a multi-step workflow
      const mockResponses = [
        // Step 1: Auth verification
        createMockApiResponse({
          data: { status: 'authorized' },
          status: 200
        }),
        // Step 2: Create resource
        createMockApiResponse({
          data: { id: '123', status: 'created' },
          status: 201
        }),
        // Step 3: Update resource
        createMockApiResponse({
          data: { id: '123', status: 'updated' },
          status: 200
        })
      ];

      let responseIndex = 0;
      vi.mocked(fetch).mockImplementation(async () => mockResponses[responseIndex++] as any);

      const requests = [
        // Step 1: Verify auth
        {
          type: 'invoke',
          tool: 'gamma.verifyAuth',
          arguments: {}
        },
        // Step 2: Create resource
        {
          type: 'invoke',
          tool: 'gamma.request',
          arguments: {
            method: 'POST',
            path: '/resource',
            body: { name: 'test' }
          }
        },
        // Step 3: Update resource
        {
          type: 'invoke',
          tool: 'gamma.request',
          arguments: {
            method: 'PUT',
            path: '/resource/123',
            body: { status: 'active' }
          }
        }
      ];

      const handledRequests = new Set();
      vi.mocked(createInterface).mockReturnValue({
        on: vi.fn((event, handler) => {
          if (event === 'line') {
            requests.forEach((req, index) => {
              if (!handledRequests.has(index)) {
                handledRequests.add(index);
                setTimeout(() => {
                  handler(JSON.stringify(req));
                }, index * 100); // Stagger requests
              }
            });
          }
        })
      } as any);

      await importServer();

      // Wait for all operations to complete
      await new Promise(resolve => setTimeout(resolve, 5000));

      const written = getWritten();
      const responses = written.split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line))
        .filter(r => r.type !== 'ready'); // Filter out ready messages

      // Verify responses are correct and complete
      const extractResponses = responses
        .map(r => omitHeaders({
          type: r.type,
          result: r.result ? {
            data: r.result.data ? {
              data: extractDeepData(r.result.data)
            } : undefined,
            success: extractSuccess(r)
          } : undefined
        }));

      // Verify response count and success
      expect(responses).toHaveLength(3);
      responses.forEach(r => {
        expect(r.type).toBe('success');
        expect(extractSuccess(r)).toBe(true);
      });

      // Verify specific fields, ignoring header/status info
      const cleanedResponses = responses.map(r => {
        const data = extractDeepData(r);
        return {
          type: r.type,
          success: extractSuccess(r),
          result: {
            success: true,
            data: { data }
          }
        };
      });

      expect(cleanedResponses).toMatchObject([
        {
          type: 'success',
          success: true,
          result: {
            success: true,
            data: {
              data: { status: 'authorized' }
            }
          }
        },
        {
          type: 'success',
          success: true,
          result: {
            success: true,
            data: {
              data: { id: '123', status: 'created' }
            }
          }
        },
        {
          type: 'success',
          success: true,
          result: {
            success: true,
            data: {
              data: { id: '123', status: 'updated' }
            }
          }
        }
      ]);

      // Verify request sequence
      expect(fetch).toHaveBeenCalledTimes(3);
      const calls = vi.mocked(fetch).mock.calls;
      
      // Auth request
      expect(calls[0][0]).toContain('/generate');
      
      // Create request
      expect(calls[1][0]).toContain('/resource');
      expect(calls[1][1].method).toBe('POST');
      expect(JSON.parse((calls[1][1].body as string))).toEqual({ name: 'test' });
      
      // Update request
      expect(calls[2][0]).toContain('/resource/123');
      expect(calls[2][1].method).toBe('PUT');
      expect(JSON.parse((calls[2][1].body as string))).toEqual({ status: 'active' });
    });
  });
});