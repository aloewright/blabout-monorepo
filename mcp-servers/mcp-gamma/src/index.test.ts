import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { fetch } from 'undici';
import { createInterface } from 'readline';
import { Readable, Writable } from 'stream';

// Mock undici fetch
vi.mock('undici', () => ({
  fetch: vi.fn()
}));

// Mock readline
vi.mock('readline', () => ({
  createInterface: vi.fn()
}));

// Mock process.env and restore it after each test
const originalEnv = { ...process.env };
// Mock console.log to write to our test output stream
let mockWritable: Writable | undefined;
const originalLog = console.log;

beforeEach(() => {
  vi.resetModules();
  process.env.GAMMA_API_KEY = 'test-api-key';
  vi.clearAllMocks();

  // Intercept console.log to write to our test stream
  console.log = (...args) => {
    if (mockWritable) {
      mockWritable.write(args[0] + '\n');
    }
  };
});

afterEach(() => {
  process.env = { ...originalEnv };
  console.log = originalLog;
  mockWritable = undefined;
});

// Test helpers
function createMockReadable() {
  return new Readable({
    read() {}
  });
}

function createMockWritable() {
  let written = '';
  const writable = new Writable({
    write(chunk, encoding, callback) {
      written += chunk.toString();
      callback();
    }
  });
  return { writable, getWritten: () => written };
}

// Helper functions
const DEFAULT_BASE_URL = 'https://api.gamma.app/v1';

// Import server dynamically after mocks are set up
async function importServer() {
  return import('./index.js');
}

// Helper to construct API URLs
function getApiUrl(path: string): string {
  return `${DEFAULT_BASE_URL}${path}`;
}

describe('MCP Server', () => {
  it('requires GAMMA_API_KEY', async () => {
    delete process.env.GAMMA_API_KEY;
    await expect(importServer()).rejects.toThrow('GAMMA_API_KEY environment variable is required');
  });

  describe('Tool: gamma.ping', () => {
    it('responds with pong', async () => {
      // Mock readline
      const input = createMockReadable();
      const { writable, getWritten } = createMockWritable();
      mockWritable = writable;
      vi.mocked(createInterface).mockReturnValue({
        on: vi.fn((event, handler) => {
          if (event === 'line') {
            handler(JSON.stringify({
              type: 'invoke',
              tool: 'gamma.ping',
              arguments: {}
            }));
          }
        })
      } as any);

      // Import server (this will trigger the readline handler)
      await importServer();

      // Check the output
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait longer for async handlers
      const written = getWritten();
const responses = written.split('\n').filter(Boolean).map(line => JSON.parse(line));
      expect(responses).toContainEqual({
        type: 'ready'
      });
      expect(responses).toContainEqual({
        type: 'success',
        result: { message: 'pong' }
      });
    });
  });

  describe('Tool: gamma.request', () => {
    it('makes an authenticated request', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'application/json'
        }),
        json: async () => ({ data: 'test' })
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      // Mock readline
      const input = createMockReadable();
      const { writable, getWritten } = createMockWritable();
      mockWritable = writable;
      vi.mocked(createInterface).mockReturnValue({
        on: vi.fn((event, handler) => {
          if (event === 'line') {
            handler(JSON.stringify({
              type: 'invoke',
              tool: 'gamma.request',
              arguments: {
                method: 'GET',
                path: '/test'
              }
            }));
          }
        })
      } as any);

      // Import server
      await importServer();

      // Verify fetch was called correctly
      expect(fetch).toHaveBeenCalledWith(
        getApiUrl('/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      );

      // Check the output
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for async handlers
      const written = getWritten();
const responses = written.split('\n').filter(Boolean).map(line => JSON.parse(line));
      expect(responses).toContainEqual({
        type: 'success',
        result: {
          status: 200,
          headers: { 'content-type': 'application/json' },
          data: { data: 'test' }
        }
      });
    });

    it('handles request errors', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        headers: new Headers({
          'content-type': 'application/json'
        }),
        json: async () => ({ error: 'Unauthorized' })
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      // Mock readline
      const input = createMockReadable();
      const { writable, getWritten } = createMockWritable();
      mockWritable = writable;
      vi.mocked(createInterface).mockReturnValue({
        on: vi.fn((event, handler) => {
          if (event === 'line') {
            handler(JSON.stringify({
              type: 'invoke',
              tool: 'gamma.request',
              arguments: {
                method: 'GET',
                path: '/test'
              }
            }));
          }
        })
      } as any);

      // Import server
      await importServer();

      // Check the output
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for async handlers
      const written = getWritten();
const responses = written.split('\n').filter(Boolean).map(line => JSON.parse(line));
      expect(responses).toContainEqual({
        type: 'error',
        error: {
          message: 'HTTP 401: {"error":"Unauthorized"}'
        }
      });
    });
  });

  describe('Tool: gamma.verifyAuth', () => {
    it('returns success when auth is valid', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'application/json'
        }),
        json: async () => ({ user: 'test' })
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      // Mock readline
      const input = createMockReadable();
      const { writable, getWritten } = createMockWritable();
      mockWritable = writable;
      vi.mocked(createInterface).mockReturnValue({
        on: vi.fn((event, handler) => {
          if (event === 'line') {
            handler(JSON.stringify({
              type: 'invoke',
              tool: 'gamma.verifyAuth',
              arguments: {}
            }));
          }
        })
      } as any);

      // Import server
      await importServer();

      // Check the output
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for async handlers
      const written = getWritten();
const responses = written.split('\n').filter(Boolean).map(line => JSON.parse(line));
      expect(responses).toContainEqual({
        type: 'success',
        result: {
          success: true,
          data: { user: 'test' }
        }
      });
    });

    it('returns failure when auth is invalid', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        headers: new Headers({
          'content-type': 'application/json'
        }),
        json: async () => ({ error: 'Unauthorized' })
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      // Mock readline
      const input = createMockReadable();
      const { writable, getWritten } = createMockWritable();
      mockWritable = writable;
      vi.mocked(createInterface).mockReturnValue({
        on: vi.fn((event, handler) => {
          if (event === 'line') {
            handler(JSON.stringify({
              type: 'invoke',
              tool: 'gamma.verifyAuth',
              arguments: {}
            }));
          }
        })
      } as any);

      // Import server
      await importServer();

      // Check the output
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for async handlers
      const written = getWritten();
const responses = written.split('\n').filter(Boolean).map(line => JSON.parse(line));
      expect(responses).toContainEqual({
        type: 'success',
        result: {
          success: false,
          error: 'HTTP 401: {"error":"Unauthorized"}'
        }
      });
    });
  });
});
