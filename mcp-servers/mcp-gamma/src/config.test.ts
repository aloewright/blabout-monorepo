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
let mockWritable: Writable | undefined;
const originalLog = console.log;

beforeEach(() => {
  vi.resetModules();
  process.env.GAMMA_API_KEY = 'test-api-key';
  process.env.GAMMA_BASE_URL = 'https://test.gamma.app/v1';
  process.env.REQUEST_TIMEOUT_MS = '5000';
  vi.clearAllMocks();

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

// Test helpers from index.test.ts
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

async function importServer() {
  return import('./index.js');
}

describe('Configuration Tests', () => {
  describe('API Endpoint Configuration', () => {
    it('uses custom API endpoint when configured', async () => {
      const { writable, getWritten } = createMockWritable();
      mockWritable = writable;

      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'application/json'
        }),
        json: async () => ({ data: 'test' })
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

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

      await importServer();

      expect(fetch).toHaveBeenCalledWith(
        'https://test.gamma.app/v1/test',
        expect.any(Object)
      );
    });

    it('handles custom headers', async () => {
      const { writable, getWritten } = createMockWritable();
      mockWritable = writable;

      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'application/json'
        }),
        json: async () => ({ data: 'test' })
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      vi.mocked(createInterface).mockReturnValue({
        on: vi.fn((event, handler) => {
          if (event === 'line') {
            handler(JSON.stringify({
              type: 'invoke',
              tool: 'gamma.request',
              arguments: {
                method: 'GET',
                path: '/test',
                headers: {
                  'X-Custom-Header': 'test',
                  'X-Version': '1.0'
                }
              }
            }));
          }
        })
      } as any);

      await importServer();

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'test',
            'X-Version': '1.0'
          })
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('handles timeout errors', async () => {
      const { writable, getWritten } = createMockWritable();
      mockWritable = writable;

      vi.mocked(fetch).mockRejectedValue(new Error('Request timed out'));

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

      await importServer();

      const written = getWritten();
      const responses = written.split('\n').filter(Boolean).map(line => JSON.parse(line));
      expect(responses).toContainEqual({
        type: 'error',
        error: {
          message: 'Request timed out'
        }
      });
    });

    it('handles network errors', async () => {
      const { writable, getWritten } = createMockWritable();
      mockWritable = writable;

      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

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

      await importServer();

      const written = getWritten();
      const responses = written.split('\n').filter(Boolean).map(line => JSON.parse(line));
      expect(responses).toContainEqual({
        type: 'error',
        error: {
          message: 'Network error'
        }
      });
    });

    it('handles rate limit responses', async () => {
      const { writable, getWritten } = createMockWritable();
      mockWritable = writable;

      const mockResponse = {
        ok: false,
        status: 429,
        headers: new Headers({
          'content-type': 'application/json',
          'retry-after': '60'
        }),
        json: async () => ({ error: 'Rate limit exceeded' })
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

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

      await importServer();

      const written = getWritten();
      const responses = written.split('\n').filter(Boolean).map(line => JSON.parse(line));
      expect(responses).toContainEqual({
        type: 'error',
        error: {
          message: 'HTTP 429: {"error":"Rate limit exceeded"}'
        }
      });
    });
  });

  describe('Security Validation', () => {
    it('sanitizes error messages', async () => {
      const { writable, getWritten } = createMockWritable();
      mockWritable = writable;

      vi.mocked(createInterface).mockReturnValue({
        on: vi.fn((event, handler) => {
          if (event === 'line') {
            handler('{"invalid": json');
          }
        })
      } as any);

      await importServer();

      const written = getWritten();
      const responses = written.split('\n').filter(Boolean).map(line => JSON.parse(line));
      expect(responses.find(r => r.type === 'error')).toMatchObject({
        type: 'error',
        error: {
          message: 'Invalid request'
        }
      });
    });

    it('validates request schema', async () => {
      const { writable, getWritten } = createMockWritable();
      mockWritable = writable;

      vi.mocked(createInterface).mockReturnValue({
        on: vi.fn((event, handler) => {
          if (event === 'line') {
            handler(JSON.stringify({
              type: 'invoke',
              tool: 'gamma.request',
              arguments: {
                method: 'INVALID',
                path: '/test'
              }
            }));
          }
        })
      } as any);

      await importServer();

      const written = getWritten();
      const responses = written.split('\n').filter(Boolean).map(line => JSON.parse(line));
      expect(responses.find(r => r.type === 'error')).toMatchObject({
        type: 'error',
        error: {
          message: 'Invalid arguments'
        }
      });
    });

    it('requires paths to start with /', async () => {
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
                path: 'test'
              }
            }));
          }
        })
      } as any);

      await importServer();

      const written = getWritten();
      const responses = written.split('\n').filter(Boolean).map(line => JSON.parse(line));
      expect(responses.find(r => r.type === 'error')).toMatchObject({
        type: 'error',
        error: {
          message: 'Invalid arguments'
        }
      });
    });
  });
});