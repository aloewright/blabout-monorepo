# 🤖 Agent Instructions & Best Practices

## Overview
This document provides comprehensive instructions for AI agents working with this monorepo template. Follow these guidelines to build efficiently and maintain consistency across all applications.

## ⚠️ **CRITICAL: PRE-DEPLOYMENT TESTING**

### 🧪 **MANDATORY: Use Devlooper Before Any Deployment**

**RULE**: Before pushing any code changes or deploying to production, ALWAYS run devlooper to ensure code quality and eliminate errors.

#### Devlooper Setup
```bash
# Devlooper is installed at: /Users/aloe/Code/devlooper
# Modal is configured and authenticated to aloewright workspace
```

#### Pre-Deployment Testing Protocol

1. **Before any git push or deployment**:
   ```bash
   # Navigate to devlooper
   cd /Users/aloe/Code/devlooper
   
   # Test React frontend
   modal run src.main --prompt="test and fix any compilation errors in the React app" --template="react" --input-path="/Users/aloe/Code/blabout-monorepo/frontend"
   
   # Test Rust backend
   modal run src.main --prompt="test and fix any compilation errors in the Rust backend" --template="rust" --input-path="/Users/aloe/Code/blabout-monorepo/backend"
   
   # Test mobile app
   modal run src.main --prompt="test and fix any compilation errors in the React Native/Expo app" --template="react" --input-path="/Users/aloe/Code/blabout-monorepo/mobile"
   ```

2. **Only after ALL tests pass**, proceed with deployment

3. **If devlooper identifies issues**:
   - Apply the suggested fixes
   - Re-run tests until clean
   - Document any architectural changes

#### Available Test Templates
- **React + Jest**: For frontend and mobile testing
- **Rust**: For backend compilation and unit tests  
- **Python**: For utility scripts and tools

### 🏗️ Architecture Overview

### Project Structure
```
monorepo/
├── frontend/          # React + TypeScript + Tamagui + Modern Stack
├── backend/           # Rust + Axum + ParadeDB + Cloudflare Workers
├── desktop/           # Electron + Modern UI
├── mobile/            # Expo + React Native + Tamagui
├── shared/            # Shared utilities and types
├── mcp-servers/       # MCP server configurations
├── agents/            # Agent instructions (this folder)
└── docs/              # Documentation
```

## 🔧 Technology Stack

### Frontend (React)
- **UI Framework**: React 18 + TypeScript
- **Styling**: TailwindCSS + Emotion CSS + Tamagui (when applicable)
- **Components**: Shadcn UI + HeadlessUI + Blocksuite
- **Animation**: Framer Motion + GSAP + React Spring + use-gesture
- **State**: Redux Toolkit + TanStack Query
- **Testing**: Vitest + React Testing Library + Playwright (E2E)
- **Bundling**: Parcel (upgradeable to Webpack)

### Backend (Rust)
- **Framework**: Axum + Tokio
- **Database**: ParadeDB (PostgreSQL-compatible)
- **Auth**: Kinde Integration
- **Deployment**: Cloudflare Workers + Traditional server
- **Real-time**: WebSockets + Redis

### Mobile (React Native + Expo)
- **Framework**: Expo + React Native
- **UI**: Tamagui + Expo Vector Icons
- **Navigation**: React Navigation
- **Deployment**: EAS Build → App Store + Play Store

### Desktop (Electron)
- **Framework**: Electron + React
- **Packaging**: Electron Builder
- **Distribution**: Mac App Store + Windows Store + Linux

## 🛠️ Development Workflow

### Before Starting Any Task

1. **Consult Available Resources**:
   ```bash
   # Check package.json files for available dependencies
   find . -name "package.json" -exec echo "=== {} ===" \; -exec cat {} \;
   
   # Review MCP servers
   ls -la mcp-servers/
   
   # Check shared utilities
   ls -la shared/
   ```

2. **Review Open Source Libraries**:
   - Check if functionality already exists in installed packages
   - Use React Cosmos for component development: `npm run cosmos`
   - Leverage existing utilities in `shared/` directory

3. **Environment Setup**:
   ```bash
   # Install all dependencies
   npm run install:all
   
   # Start development servers
   npm run dev  # Frontend + Backend
   ```

### 🚀 **Deployment Workflow**

#### Pre-Deployment Checklist

1. **Code Quality Check**:
   ```bash
   # Run linting and formatting
   npm run lint:all
   npm run format:all
   ```

2. **Run Tests**:
   ```bash
   npm run test:all
   ```

3. **MANDATORY: Devlooper Testing**:
   ```bash
   cd /Users/aloe/Code/devlooper
   
   # Test each component
   modal run src.main --prompt="ensure all tests pass and fix any issues" --template="react" --input-path="/Users/aloe/Code/blabout-monorepo/frontend"
   modal run src.main --prompt="ensure all tests pass and fix any issues" --template="rust" --input-path="/Users/aloe/Code/blabout-monorepo/backend"
   ```

4. **Only after devlooper confirms clean tests**:
   ```bash
   git add -A
   git commit -m "feat: your changes"
   git push origin main
   ```

### Component Development

1. **Always use React Cosmos** to develop and test components:
   ```bash
   cd frontend && npm run cosmos
   ```

2. **Component Structure**:
   ```typescript
   // src/components/MyComponent/MyComponent.tsx
   import { motion } from 'framer-motion';
   import { Button } from '@/components/ui/button';
   
   interface MyComponentProps {
     // Define props with TypeScript
   }
   
   export const MyComponent: React.FC<MyComponentProps> = ({ ...props }) => {
     return (
       <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         className="dark:bg-gray-900 bg-white"
       >
         {/* Always support dark/light mode */}
       </motion.div>
     );
   };
   ```

3. **Create Cosmos fixtures**:
   ```typescript
   // src/components/MyComponent/MyComponent.fixture.tsx
   import { MyComponent } from './MyComponent';
   
   export default {
     'Default': <MyComponent />,
     'With Props': <MyComponent prop="value" />,
   };
   ```

### Testing Strategy

1. **Unit Tests** (Vitest):
   ```typescript
   import { render, screen } from '@testing-library/react';
   import { MyComponent } from './MyComponent';
   
   test('renders correctly', () => {
     render(<MyComponent />);
     expect(screen.getByText('Expected Text')).toBeInTheDocument();
   });
   ```

2. **E2E Tests** (Playwright):
   ```typescript
   import { test, expect } from '@playwright/test';
   
   test('user flow works correctly', async ({ page }) => {
     await page.goto('/');
     await expect(page.locator('h1')).toContainText('Welcome');
   });
   ```

3. **Devlooper Integration Testing**:
   - Run before deployment to catch integration issues
   - Automatically fixes environment setup problems
   - Ensures all dependencies are correctly installed

4. **Snapshot Tests** for visual regression testing

## 🎨 UI/UX Guidelines

### Design System
- **Colors**: Use Tailwind color palette with dark/light mode support
- **Icons**: Heroicons for UI, Lucide icons via Tamagui
- **Illustrations**: Blush.design + Storyset.com
- **Mockups**: Storytale.io

### Responsive Design
```css
/* Always mobile-first */
.component {
  @apply text-sm;
  @apply md:text-base;
  @apply lg:text-lg;
}
```

### Dark/Light Mode
```typescript
// Always implement both modes
const Component = () => (
  <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
    Content
  </div>
);
```

## 🔐 Authentication & Security

### Kinde Integration
```typescript
// Frontend
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';

const { login, logout, user, isAuthenticated } = useKindeAuth();
```

### Environment Variables
- Store in Cloudflare Workers for production
- Use `.env` files for local development
- Never commit secrets to repository
- All secrets stored in Google Cloud Secret Manager

### Available Secrets in Google Cloud
```bash
# Authentication
kinde-client-id, kinde-client-secret, kinde-domain
kinde-redirect-uri-prod, kinde-post-login-redirect-uri-prod, kinde-post-logout-redirect-uri-prod

# Analytics & Monitoring  
posthog-key, posthog-host, datadog-api-secret-key, datadog-api-key-id

# AI & LLM Services
openai-api-key, openrouter-api-key-new, gemini-api-key, mistral-api-key
perplexity-api-key, hume-api-key, elevenlabs-api-key, gamma-api-key

# Development & Deployment
modal-token, github-api-key, cloudflare-api-key
digitalocean-api-key, render-api-key, aws-access-key, aws-secret-access-key

# External Services
stripe-api-key, sendgrid-api-key, canvas-api-key, redis-api-key
# ... and many more (see gcloud secrets list)
```

## 📱 Mobile Development

### Tamagui Usage
```typescript
import { Button, XStack, YStack, Text } from 'tamagui';

export const MobileComponent = () => (
  <YStack padding="$4" space="$3">
    <Text fontSize="$6" fontWeight="bold">Title</Text>
    <XStack space="$2">
      <Button theme="active">Primary</Button>
      <Button theme="alt2">Secondary</Button>
    </XStack>
  </YStack>
);
```

### Expo Features
- Use Expo Camera for photo/video
- Expo Location for geolocation
- Expo SecureStore for sensitive data

## 🚀 Deployment

### Frontend (Cloudflare Pages)
```bash
# After devlooper testing passes:
npm run build:frontend
./deploy-to-cloud-run.sh gen-lang-client-0050235412
```

### Backend (Cloudflare Workers)
```bash
cd backend
wrangler deploy --env production
```

### Mobile (EAS Build)
```bash
cd mobile
eas build --platform all
eas submit --platform all
```

### Desktop (Electron)
```bash
cd desktop
npm run build  # Creates distributables for all platforms
```

## 🧩 MCP Server Usage

### Available Servers
1. **Composio Server**: GitHub, Slack, Linear, Notion integrations
2. **Filesystem Server**: File operations
3. **Database Server**: ParadeDB operations (if configured)

### Integration Example
```typescript
// Use MCP servers for external integrations
import { McpClient } from '@mcp/client';

const client = new McpClient();
await client.connect('composio-server');
await client.callTool('github_integration', { action: 'create_issue' });
```

## 🔄 **Error Prevention & Quality Assurance**

### Modal Devlooper Integration

Based on the [Modal Devlooper documentation](https://github.com/modal-labs/devlooper), this tool provides program synthesis with autonomous error fixing:

#### How Devlooper Works
1. **Sandbox Testing**: Uses Modal's Sandbox primitive for isolated testing
2. **Iterative Fixing**: Runs tests and fixes issues automatically
3. **Environment Setup**: Installs packages and fixes dependencies
4. **Debug Loop**: Diagnoses errors using LLM and creates DebugPlan

#### Available Actions
- Inspect and fix files
- Install packages in the image
- Run commands in the sandbox environment

#### Usage Examples
```bash
# Test React component
modal run src.main --prompt="create a user authentication component" --template="react"

# Test Rust backend  
modal run src.main --prompt="create a REST API with CRUD operations" --template="rust"

# Test Python utilities
modal run src.main --prompt="create a data processing utility" --template="python"
```

## 🎯 Best Practices

### Code Quality
1. **TypeScript**: Always use strict typing
2. **ESLint + Prettier**: Auto-format on save
3. **Consistent naming**: camelCase for variables, PascalCase for components
4. **Error handling**: Always handle errors gracefully
5. **Devlooper testing**: MANDATORY before any deployment

### Performance
1. **Lazy loading**: Use React.lazy for route-based code splitting
2. **Memoization**: Use useMemo/useCallback appropriately
3. **Bundle analysis**: Regular bundle size monitoring

### Accessibility
1. **Semantic HTML**: Use proper HTML elements
2. **ARIA labels**: For complex interactions
3. **Keyboard navigation**: Ensure all features are keyboard accessible
4. **Screen reader**: Test with screen readers

## 🗑️ What Can Be Removed

### Optional Components (Comment out if not needed):
- **3D Features**: `react-three-fiber` + `three`
- **Rich Text**: `@tiptap/react` + `@tiptap/starter-kit`
- **Canvas Drawing**: `@excalidraw/excalidraw`
- **Video Editing**: Remotion API integration
- **Chat Features**: Sendbird integration
- **Search**: Meilisearch integration
- **Analytics**: PostHog integration
- **Newsletter**: Mautic integration

### Removing Components
```bash
# Remove unused dependencies
npm uninstall package-name

# Comment out imports in package.json
# "package-name": "^1.0.0", // OPTIONAL: Remove if not using 3D features
```

## 📚 Learning Resources

### Documentation
- React: https://react.dev
- TypeScript: https://typescriptlang.org
- Tamagui: https://tamagui.dev
- Expo: https://docs.expo.dev
- Rust: https://doc.rust-lang.org
- Axum: https://docs.rs/axum
- Modal: https://modal.com/docs
- Devlooper: https://github.com/modal-labs/devlooper

### Component Libraries
- Shadcn UI: https://ui.shadcn.com
- HeadlessUI: https://headlessui.com
- Heroicons: https://heroicons.com

## 🤝 Contributing

1. Follow the established patterns
2. Write tests for new features
3. **RUN DEVLOOPER TESTING** before any commit
4. Update documentation
5. Use React Cosmos for component development
6. Ensure dark/light mode support
7. Test across all platforms (web, mobile, desktop)

## 🛡️ Quality Gates

### Mandatory Checks Before Push
1. ✅ **Linting**: `npm run lint:all`
2. ✅ **Formatting**: `npm run format:all`
3. ✅ **Unit Tests**: `npm run test:all`
4. ✅ **Devlooper Testing**: Modal sandbox validation
5. ✅ **Build Verification**: `npm run build:all`

### Deployment Readiness
- All devlooper tests pass
- No compilation errors
- Environment variables configured
- Secrets properly managed in Google Cloud
- CI/CD pipeline validates build

---

**Remember**: This monorepo is designed for rapid development while maintaining high code quality. Devlooper ensures that any code deployed is production-ready and error-free. Always leverage existing tools and patterns before creating new ones.
