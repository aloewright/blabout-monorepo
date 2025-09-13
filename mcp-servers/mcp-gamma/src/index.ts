import { fetch } from 'undici';
import { z } from 'zod';
import debug from 'debug';
import { createInterface } from 'readline';

const log = debug('mcp-gamma');

const GAMMA_API_KEY = process.env.GAMMA_API_KEY;
const GAMMA_BASE_URL = process.env.GAMMA_BASE_URL || 'https://public-api.gamma.app/v0.2';
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 30000);

if (!GAMMA_API_KEY) {
  throw new Error('GAMMA_API_KEY environment variable is required');
}

// Input schemas
const PingSchema = z.object({});

const TextOptionsSchema = z.object({
  amount: z.enum(['brief', 'detailed']).optional(),
  tone: z.string().optional(),
  audience: z.string().optional(),
  language: z.string().optional()
});

const ImageOptionsSchema = z.object({
  source: z.enum(['aiGenerated', 'stock']).optional(),
  model: z.string().optional(),
  style: z.string().optional()
});

const CardOptionsSchema = z.object({
  dimensions: z.enum(['fluid', 'fixed']).optional()
});

const SharingOptionsSchema = z.object({
  workspaceAccess: z.enum(['view', 'edit', 'none']).optional(),
  externalAccess: z.enum(['view', 'edit', 'noAccess']).optional()
});

const GenerateSchema = z.object({
  inputText: z.string(),
  textMode: z.enum(['generate', 'enhance', 'summarize']).optional(),
  format: z.enum(['presentation', 'document']),
  themeName: z.string().optional(),
  numCards: z.number().optional(),
  cardSplit: z.enum(['auto', 'manual']).optional(),
  additionalInstructions: z.string().optional(),
  exportAs: z.enum(['pdf', 'pptx', 'docx']).optional(),
  textOptions: TextOptionsSchema.optional(),
  imageOptions: ImageOptionsSchema.optional(),
  cardOptions: CardOptionsSchema.optional(),
  sharingOptions: SharingOptionsSchema.optional()
});

const RequestSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  path: z.string().startsWith('/'),
  headers: z.record(z.string()).optional(),
  query: z.record(z.string()).optional(),
  body: z.any().optional()
});

const VerifyAuthSchema = z.object({});

// Tool implementation functions
async function ping(_args: z.infer<typeof PingSchema>) {
  return { message: 'pong' };
}

async function request(params: z.infer<typeof RequestSchema>) {
  const { method, path, headers = {}, query = {}, body } = params;

  const queryString = new URLSearchParams(query).toString();
  const url = `${GAMMA_BASE_URL}${path}${queryString ? '?' + queryString : ''}`;

  // Add authorization header and merge with user-provided headers
  const allHeaders = {
    'X-API-KEY': GAMMA_API_KEY,
    'Content-Type': 'application/json',
    ...headers
  };

  try {
    const response = await fetch(url, {
      method,
      headers: allHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });

    const contentType = response.headers.get('content-type');
    const data = contentType?.includes('application/json') 
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
    }

    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data
    };
  } catch (error) {
    log('Request failed:', error);
    throw error;
  }
}

async function verifyAuth(_args: z.infer<typeof VerifyAuthSchema>) {
  try {
    // Verify auth by attempting a minimal generation request
    const response = await request({
      method: 'POST',
      path: '/generate',
      body: {
        format: "presentation",
        prompt: "Test prompt"
      }
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

// Tool handler map
async function generate(params: z.infer<typeof GenerateSchema>) {
  return request({
    method: 'POST',
    path: '/generations',
    body: params
  });
}

const tools = {
  'gamma.ping': {
    description: 'Simple health check that returns "pong"',
    handler: ping,
    schema: PingSchema
  },
  'gamma.request': {
    description: 'Make an authenticated request to the Gamma API',
    handler: request,
    schema: RequestSchema
  },
  'gamma.generate': {
    description: 'Generate content using Gamma AI',
    handler: generate,
    schema: GenerateSchema
  },
  'gamma.verifyAuth': {
    description: 'Verify API key authentication is working',
    handler: verifyAuth,
    schema: VerifyAuthSchema
  }
};

// Set up stdio interface for MCP communication
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', async (line) => {
  try {
    const request = JSON.parse(line);
    if (request.type !== 'invoke') {
      throw new Error(`Unsupported request type: ${request.type}`);
    }

    const { tool, arguments: args } = request;
    const toolImpl = tools[tool as keyof typeof tools];
    if (!toolImpl) {
      throw new Error(`Tool not found: ${tool}`);
    }

    try {
      const validatedArgs: any = toolImpl.schema.parse(args);
      const result = await toolImpl.handler(validatedArgs as any);
      console.log(JSON.stringify({ type: 'success', result }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log(JSON.stringify({
          type: 'error',
          error: { message: 'Invalid arguments', details: error.errors }
        }));
      } else {
        console.log(JSON.stringify({
          type: 'error',
          error: { message: error instanceof Error ? error.message : String(error) }
        }));
      }
    }
  } catch (error) {
    console.log(JSON.stringify({
      type: 'error',
      error: { message: 'Invalid request', details: String(error) }
    }));
  }
});

// Initial ready message
console.log(JSON.stringify({ type: 'ready' }));
