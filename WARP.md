# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Critical Requirements

- Node.js 18+ and npm 9+ required for development
- Rust 1.70+ and Cargo for backend development
- Run `codeflash --all` before any deployment or push
- Complete deployments fully without stopping until working application is verified
- Always provide working URLs after deployment tasks
- Use gopass for password management
- Use claude-sonnet-4 model when model selection is required
- Follow Google's ADK (Agent Development Kit) best practices when working with agents

## Essential Commands

```bash
# Full Development Setup
npm run install:all          # Install all dependencies
npm run dev:full            # Start all development servers

# Individual Services
npm run start:frontend      # React frontend → http://localhost:3000
npm run start:backend       # Rust API → http://localhost:3001
npm run start:mobile        # Expo mobile → http://localhost:19000
npm run start:desktop       # Electron desktop app
npm run start:worker        # Cloudflare Worker (local)

# Development Tools
npm run cosmos             # React component playground
npm run test:all          # All test suites
npm run lint:all          # ESLint across all projects
npm run format:all        # Prettier formatting

# Deployment
npm run deploy:frontend   # Deploy to Cloudflare Pages
npm run deploy:backend    # Deploy to Cloudflare Workers
npm run deploy:mobile     # Deploy to app stores via EAS
npm run deploy:desktop    # Create cross-platform builds
```

## Key Architecture Overview

### Core Services
- **Frontend**: React 18 + TypeScript + Vite
  - State: Redux Toolkit + TanStack Query
  - UI: TailwindCSS + Shadcn UI
  - Auth: Kinde Auth

- **Backend**: Rust + Axum
  - Database: ParadeDB (PostgreSQL)
  - Real-time: WebSocket + Redis
  - Deployment: Cloudflare Workers + Traditional

- **Mobile**: Expo SDK 49 + React Native + Tamagui
  - Authentication via Kinde React Native SDK

- **Desktop**: Electron + React with auto-updates

### Infrastructure

- Authentication flow:
  1. Kinde handles user authentication
  2. JWT tokens used for API authorization
  3. Auto-refresh mechanism for token management
  4. Secure credential storage via gopass

- Real-time architecture:
  - WebSocket connections for live updates
  - Redis pub/sub for event distribution
  - Presence system via Redis
  - Automatic reconnection handling

## Environment Integration

1. MCP Server Configuration:
   - Composio for external service integration
   - Filesystem for code operations
   - ParadeDB for database management
   - Docker hub MCP for containerization

2. Google Cloud Integration:
   - Credentials stored in local environment
   - Used for automated deployment tasks
   - AI/ML model access configuration
   - Service account key management via gopass

## Critical Workflows

### Deployment Process
1. Run codeflash --all check (mandatory)
2. Execute relevant deployment command
3. Wait for full deployment completion
4. Verify application functionality
5. Confirm working URLs
6. Monitor for any post-deployment issues

### Error Recovery
1. Automatic retry with adjustments
2. Fallback to previous known good state
3. Logging and error reporting via configured channels
4. Notification of relevant team members
5. Documented resolution in knowledge base

## WARP Agent Guidelines

### Capabilities
- Full code operations (write/edit/review)
- Shell command execution and output analysis
- Error resolution without human intervention
- Integration with external documentation
- Complete task execution without unnecessary pauses

### Operational Parameters
- Execute tasks to completion unless explicitly configured otherwise
- Maintain code quality and testing standards
- Follow project-specific architecture patterns
- Use provided tools and integrations effectively
- Document significant decisions and changes

### Task Completion Requirements
- Verify functionality before marking complete
- Ensure deployment stability
- Provide working URLs when relevant
- Document any configuration changes
- Update related documentation as needed
