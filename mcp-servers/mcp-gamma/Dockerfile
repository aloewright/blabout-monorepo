# Stage 1: Build TypeScript code
FROM node:22-alpine AS builder

LABEL org.opencontainers.image.source="https://github.com/warp-ds/mcp-gamma"
LABEL org.opencontainers.image.description="MCP Server for Gamma.app API integration"
LABEL org.opencontainers.image.version="1.0.0"

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build files
COPY tsconfig.json ./
COPY src/ src/
RUN npm run build

# Stage 2: Runtime
FROM node:22-alpine

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm install --only=production

# Copy built files from builder stage
COPY --from=builder /app/dist/ dist/

# Set environment
ENV NODE_ENV=production
ENV DEBUG=mcp-gamma:*

CMD ["node", "dist/index.js"]
