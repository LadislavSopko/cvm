# Tech Context

## Technologies Used

### Core Stack
- **TypeScript 5.8.2** - Primary language for all code
- **Node.js 18.16+** - Runtime environment
- **Nx 21.2.0** - Monorepo build system and tooling
- **Vitest 3.0.0** - Testing framework with coverage

### Build Tools
- **Vite 6.0.0** - Fast build tool for packages
- **ESBuild 0.19.2** - JavaScript bundler
- **SWC** - Fast TypeScript/JavaScript compiler

### Key Dependencies
- **@modelcontextprotocol/sdk** - MCP protocol implementation
- **mongodb 6.x** - MongoDB driver for storage option
- **zod** - Schema validation for MCP tools
- **TypeScript Compiler API** - For parsing CVM source

## Development Setup

### Prerequisites
- Node.js 18.16 or higher
- npm or yarn
- Git
- Optional: MongoDB for database storage
- Optional: Claude Desktop for MCP integration

### Environment Setup
```bash
# Clone repository
git clone https://github.com/LadislavSopko/cvm.git
cd cvm

# Install dependencies
npm install

# Build all packages
npx nx run-many --target=build --all

# Run tests
npx nx run-many --target=test --all
```

## Technical Constraints

### Module System
- **CRITICAL**: Uses `"moduleResolution": "nodenext"`
- ALL imports must use `.js` extension
- Example: `import { foo } from './bar.js'` (even for .ts files)
- TypeScript resolves .js to actual .ts files

### Language Constraints
CVM implements TypeScript subset:
- ✅ Basic types, control flow, arrays, objects
- ✅ Functions (without parameters currently)
- ❌ Classes, async/await, modules
- ❌ Try/catch, destructuring, spread

### Runtime Constraints
- No network access from CVM programs
- File system access sandboxed to working directory
- No shell command execution
- Memory limits for heap allocations

## Dependencies

### Package Dependencies
```
parser → (no internal deps)
types → (no internal deps)
mongodb → types
storage → types
vm → parser, types, storage
mcp-server → vm, parser
cvm-server → mcp-server
```

### External Dependencies
- **Production**: Minimal - just MCP SDK and optional MongoDB
- **Development**: Full Nx toolchain, TypeScript, Vitest

## Tool Usage Patterns

### Nx Commands
```bash
# Build specific package
npx nx build <package>

# Test specific package
npx nx test <package>

# Run E2E tests
cd test/integration
npx tsx mcp-test-client.ts ../programs/test.ts

# Clean build
npx nx reset
npx nx run-many --target=build --all --skip-nx-cache
```

### MCP Integration
```json
// Claude Desktop config
{
  "mcpServers": {
    "cvm": {
      "command": "npx",
      "args": ["cvm-server@latest"],
      "env": {
        "CVM_STORAGE_TYPE": "file",
        "CVM_DATA_DIR": ".cvm"
      }
    }
  }
}
```

### Testing Patterns
- Unit tests: Per package with Vitest
- Integration tests: Cross-package in `packages/integration`
- E2E tests: Full stack in `test/integration`
- Coverage target: 85%+ for core packages

## Configuration

### Environment Variables
```bash
# Storage
CVM_STORAGE_TYPE=file|mongodb
CVM_DATA_DIR=.cvm
MONGODB_URL=mongodb://localhost:27017/cvm

# Logging
CVM_LOG_LEVEL=debug|info|warn|error
CVM_LOG_FORMAT=pretty|json

# Environment
NODE_ENV=development|production
```

### TypeScript Configuration
- Strict mode enabled
- ES2022 target
- NodeNext module resolution
- Source maps for debugging

### Build Configuration
- Vite for library builds
- Outputs CommonJS and ESM
- Type definitions generated
- Tree shaking enabled

## Deployment

### NPM Publishing
```bash
# Bump version and publish
npx nx release

# Manual publish
cd apps/cvm-server/dist
npm publish
```

### Docker (Future)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY dist .
CMD ["node", "main.js"]
```

## Security Considerations

### Sandboxing
- CVM programs run in restricted environment
- No access to Node.js globals
- File operations limited to sandbox
- Resource limits enforced

### Input Validation
- All MCP inputs validated with Zod
- Program source validated before compilation
- CC responses sanitized

This technical foundation enables CVM to be a reliable, extensible platform for AI task orchestration.