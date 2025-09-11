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
- **Component Architecture**: Blocksuite framework + Shadcn UI + HeadlessUI.com
- **Styling**: TailwindCSS + Tamagui
- **Animation**: Motion + GSAP + React-Spring + @use-gesture (touch gestures)
- **State**: React Redux Toolkit + TanStack Query
- **Rich Text**: TipTap editor
- **Drag & Drop**: @hello-pangea/dnd
- **3D Graphics**: react-three-fiber (when needed)
- **Canvas**: Excalidraw integration
- **File Handling**: FileReader API + FormData API
- **Search**: Meilisearch
- **Localization**: react-i18n-next
- **Testing**: Testsprite (preferred) OR Vitest + React Testing Library + Snapshot Tests
- **E2E Testing**: Playwright
- **Component Development**: React Cosmos for testing components
- **Code Quality**: ESLint + Prettier
- **Package Management**: npm
- **Bundling**: Webpack
- **Dark/Light Mode**: Always implement both modes

### Backend (Rust)
- **Framework**: Axum + Tokio + Node.js compatibility
- **Database**: ParadeDB (PostgreSQL-compatible)
- **Auth**: Kinde Integration
- **Deployment**: Cloudflare Workers + Traditional server
- **Real-time**: WebSockets + Redis

### Mobile (React Native + Expo)
- **Framework**: Expo + React Native
- **UI**: Tamagui + Expo Vector Icons
- **Navigation**: React Navigation
- **Chat/Voice/Video**: Sendbird API integration
- **Deployment**: EAS Build → App Store + Play Store

### Desktop (Electron)
- **Framework**: Electron + React
- **Packaging**: Electron Builder
- **Distribution**: Mac App Store + Windows Store + Linux

### Additional Integrations
- **Video Editing**: Remotion API
- **Documentation**: Docusaurus
- **Analytics**: PostHog
- **Newsletters**: Mautic automation
- **Design Resources**: Storytale.io (mockups), Blush.design + Storyset.com (illustrations)
- **Icons**: Heroicons.com

## 🛠️ Development Workflow

### Before Starting Any Task

**🚨 CRITICAL: Always consult these resources BEFORE beginning any development work:**

1. **Mandatory Resource Check**:
   ```bash
   # Check ALL package.json files for available dependencies
   find . -name "package.json" -exec echo "=== {} ===" \; -exec cat {} \;
   
   # Review MCP servers and their capabilities
   ls -la mcp-servers/
   cat mcp-servers/*.json
   
   # Check shared utilities and existing code snippets
   find shared/ -name "*.js" -o -name "*.ts" -o -name "*.tsx" | head -20
   ```

2. **Review Available Open Source Libraries & Tools**:
   - **Component Libraries**: Shadcn UI, HeadlessUI, Blocksuite
   - **Animation Libraries**: Motion, GSAP, React-Spring, @use-gesture
   - **State Management**: React Redux Toolkit, TanStack Query
   - **Testing Tools**: Testsprite, Vitest, React Testing Library, Playwright
   - **Design Resources**: Storytale.io, Blush.design, Storyset.com, Heroicons
   - **Specialized Tools**: TipTap, Excalidraw, Sendbird, Remotion, Meilisearch
   - Use React Cosmos for component development: `npm run cosmos`
   - Leverage existing utilities in `shared/` directory

3. **MCP Server Consultation**:
   ```bash
   # Check what MCP servers are available
   # These provide pre-built integrations and tools
   # Always use MCP servers before building custom solutions
   cat mcp-servers/composio-server.json
   cat mcp-servers/filesystem-server.json
   ```

4. **Environment Setup**:
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

1. **MANDATORY: Always use React Cosmos** to develop and test components:
   ```bash
   cd frontend && npm run cosmos
   ```

2. **Component Structure (Using Specified Libraries)**:
   ```typescript
   // src/components/MyComponent/MyComponent.tsx
   import { motion } from 'motion'; // Primary animation library
   import { useSpring, animated } from 'react-spring'; // Secondary animation
   import { useDrag } from '@use-gesture/react'; // Touch gestures
   import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
   import { Button } from '@/components/ui/button'; // Shadcn UI
   import { Disclosure } from '@headlessui/react'; // HeadlessUI
   import { useEditor } from '@tiptap/react'; // Rich text editing
   import { Excalidraw } from '@excalidraw/excalidraw'; // Canvas
   import { useTranslation } from 'react-i18next'; // Localization
   
   interface MyComponentProps {
     // Define props with TypeScript
   }
   
   export const MyComponent: React.FC<MyComponentProps> = ({ ...props }) => {
     const { t } = useTranslation();
     const [springs, api] = useSpring(() => ({ opacity: 0 }));
     
     return (
       <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         className="dark:bg-gray-900 bg-white text-gray-900 dark:text-white"
       >
         <animated.div style={springs}>
           {/* Always support dark/light mode */}
           {t('component.title')}
         </animated.div>
       </motion.div>
     );
   };
   ```

3. **Create Cosmos Fixtures for Component Testing**:
   ```typescript
   // src/components/MyComponent/MyComponent.fixture.tsx
   import { MyComponent } from './MyComponent';
   
   export default {
     'Default Light Mode': <MyComponent />,
     'Default Dark Mode': (
       <div className="dark">
         <MyComponent />
       </div>
     ),
     'With Props': <MyComponent prop="value" />,
     'With Animation': <MyComponent animated={true} />,
   };
   ```

### Testing Strategy

1. **Primary Testing: Testsprite** (Preferred):
   ```typescript
   // Use Testsprite for comprehensive testing when available
   import { testsprite } from 'testsprite';
   
   testsprite('MyComponent', {
     component: MyComponent,
     props: { variant: 'primary' },
     scenarios: ['default', 'dark-mode', 'responsive']
   });
   ```

2. **Fallback: Unit Tests** (Vitest + React Testing Library):
   ```typescript
   import { render, screen } from '@testing-library/react';
   import { MyComponent } from './MyComponent';
   
   test('renders correctly in light mode', () => {
     render(<MyComponent />);
     expect(screen.getByText('Expected Text')).toBeInTheDocument();
   });
   
   test('renders correctly in dark mode', () => {
     render(<div className="dark"><MyComponent /></div>);
     expect(screen.getByText('Expected Text')).toBeInTheDocument();
   });
   ```

3. **E2E Tests** (Playwright):
   ```typescript
   import { test, expect } from '@playwright/test';
   
   test('user flow works correctly', async ({ page }) => {
     await page.goto('/');
     await expect(page.locator('h1')).toContainText('Welcome');
     
     // Test dark mode toggle
     await page.click('[data-testid="theme-toggle"]');
     await expect(page.locator('html')).toHaveClass(/dark/);
   });
   ```

4. **Snapshot Tests** for visual regression testing:
   ```typescript
   import { render } from '@testing-library/react';
   import { MyComponent } from './MyComponent';
   
   test('matches snapshot - light mode', () => {
     const { container } = render(<MyComponent />);
     expect(container.firstChild).toMatchSnapshot();
   });
   
   test('matches snapshot - dark mode', () => {
     const { container } = render(<div className="dark"><MyComponent /></div>);
     expect(container.firstChild).toMatchSnapshot();
   });
   ```

5. **Devlooper Integration Testing**:
   - Run before deployment to catch integration issues
   - Automatically fixes environment setup problems
   - Ensures all dependencies are correctly installed

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

## 🗑️ What Can Be Removed / Optional Components

### Template Customization Guide

**🔧 Comment out or remove these dependencies if your application doesn't need them:**

#### 3D Graphics & Visualization
```json
// In package.json - Remove if no 3D features needed
{
  "react-three-fiber": "^8.0.0", // OPTIONAL: 3D graphics
  "three": "^0.150.0", // OPTIONAL: 3D library
  "@react-three/drei": "^9.0.0" // OPTIONAL: 3D helpers
}
```

#### Rich Text Editing
```json
// Remove if no rich text editing needed
{
  "@tiptap/react": "^2.0.0", // OPTIONAL: Rich text editor
  "@tiptap/starter-kit": "^2.0.0", // OPTIONAL: TipTap plugins
  "@tiptap/extension-*": "^2.0.0" // OPTIONAL: Various TipTap extensions
}
```

#### Canvas & Drawing
```json
// Remove if no drawing/diagramming needed
{
  "@excalidraw/excalidraw": "^0.15.0", // OPTIONAL: Canvas drawing
  "rough-js": "^4.5.0" // OPTIONAL: Hand-drawn graphics
}
```

#### Video & Media
```json
// Remove if no video editing needed
{
  "@remotion/cli": "^4.0.0", // OPTIONAL: Video editing API
  "@remotion/renderer": "^4.0.0", // OPTIONAL: Video rendering
  "ffmpeg": "^4.4.0" // OPTIONAL: Video processing
}
```

#### Chat & Communication
```json
// Remove if no chat/voice/video needed
{
  "sendbird": "^3.1.0", // OPTIONAL: Chat, voice, video APIs
  "@sendbird/uikit-react": "^3.0.0" // OPTIONAL: Sendbird UI components
}
```

#### Search & Analytics
```json
// Remove if not using search or analytics
{
  "meilisearch": "^0.33.0", // OPTIONAL: Search engine
  "posthog-js": "^1.80.0", // OPTIONAL: Analytics
  "posthog-node": "^3.0.0" // OPTIONAL: Server-side analytics
}
```

#### Newsletter & Marketing
```json
// Remove if no newsletter/marketing automation
{
  "mautic": "^1.0.0", // OPTIONAL: Newsletter automation
  "@mautic/api": "^1.0.0" // OPTIONAL: Mautic API integration
}
```

#### Drag & Drop
```json
// Remove if no drag and drop needed
{
  "@hello-pangea/dnd": "^16.0.0", // OPTIONAL: Drag and drop
  "react-beautiful-dnd": "^13.0.0" // ALTERNATIVE: Older DnD library
}
```

#### Advanced Animations
```json
// Keep motion, but remove others if basic animations suffice
{
  "gsap": "^3.12.0", // OPTIONAL: Advanced animations
  "react-spring": "^9.7.0", // OPTIONAL: Physics-based animations
  "@use-gesture/react": "^10.2.0" // OPTIONAL: Touch/gesture handling
}
```

### Removing Unused Components Process

1. **Identify Dependencies**:
   ```bash
   # Check what's actually imported in your codebase
   grep -r "import.*from.*package-name" src/
   ```

2. **Remove Dependencies**:
   ```bash
   # Remove from package.json
   npm uninstall package-name
   
   # Or comment out in package.json
   // "package-name": "^1.0.0", // OPTIONAL: Description of what this does
   ```

3. **Remove Related Code**:
   ```bash
   # Remove component files that depend on removed libraries
   rm -rf src/components/ComponentUsingRemovedLibrary/
   
   # Remove imports and references in other files
   ```

4. **Update Documentation**:
   ```bash
   # Update README and component stories
   # Remove related test files
   # Update deployment scripts if needed
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
