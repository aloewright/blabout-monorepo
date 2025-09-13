# Gamma API MCP Server

MCP Server implementation for the [Gamma.app](https://gamma.app) API.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   export GAMMA_API_KEY="your-api-key"  # Required
   export GAMMA_BASE_URL="https://api.gamma.app"  # Optional
   export REQUEST_TIMEOUT_MS="30000"  # Optional
   ```

## Development

```bash
# Start the development server with auto-reload:
npm run dev

# Run tests:
npm test

# Run linting:
npm run lint

# Build for production:
npm run build
```

## MCP Tools

### gamma.ping
Simple health check that returns "pong". Use this to verify the MCP server is running.

Example:
```typescript
await mcp.invoke('gamma.ping', {});
// Returns: { message: 'pong' }
```

### gamma.request
Makes an authenticated request to the Gamma API.

Example:
```typescript
await mcp.invoke('gamma.request', {
  method: 'GET',
  path: '/v1/endpoint',
  headers: { 'Custom-Header': 'value' },  // Optional
  query: { param: 'value' },  // Optional
  body: { key: 'value' }  // Optional
});
```

### gamma.generate
Generates content using Gamma AI. This endpoint supports creating presentations and documents with various customization options.

Example:
```typescript
await mcp.invoke('gamma.generate', {
  inputText: "Best hikes in the United States",
  textMode: "generate",
  format: "presentation",
  themeName: "Oasis",
  numCards: 10,
  cardSplit: "auto",
  additionalInstructions: "Make the titles catchy",
  exportAs: "pdf",
  textOptions: {
    amount: "detailed",
    tone: "professional, inspiring",
    audience: "outdoors enthusiasts, adventure seekers",
    language: "en"
  },
  imageOptions: {
    source: "aiGenerated",
    model: "imagen-4-pro",
    style: "photorealistic"
  },
  cardOptions: {
    dimensions: "fluid"
  },
  sharingOptions: {
    workspaceAccess: "view",
    externalAccess: "noAccess"
  }
});
```

### gamma.verifyAuth
Verifies that the API key authentication is working.

Example:
```typescript
await mcp.invoke('gamma.verifyAuth', {});
// Returns: { success: true, data: {...} }
// Or: { success: false, error: 'error message' }
```

## Troubleshooting

### 401/403 Errors
- Verify your GAMMA_API_KEY environment variable is set correctly
- Check that the API key has the required permissions
- Ensure the API key is still valid

### 429 Errors (Rate Limits)
- The server implements exponential backoff automatically
- If you consistently hit rate limits, consider implementing caching or reducing request frequency

### 5xx Errors
- These indicate server-side issues
- The client will automatically retry with exponential backoff
- If persistent, check Gamma's status page or contact support

## Security Notes

- Store the API key securely (use environment variables, gopass, or a secret manager)
- Never commit API keys or other secrets to version control
- The server redacts Authorization headers in logs

## Docker Usage

Build the image:
```bash
docker build -t local/mcp-gamma:latest .
```

Run with your API key:
```bash
docker run --rm -i \
  -e GAMMA_API_KEY="your-api-key" \
  -e GAMMA_BASE_URL="https://api.gamma.app" \
  local/mcp-gamma:latest
```

## License

MIT
