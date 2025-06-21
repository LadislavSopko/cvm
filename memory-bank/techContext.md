# Tech Context - CVM Development Environment

## Technology Stack
- **Language**: TypeScript 5.8.2
- **Runtime**: Node.js
- **Build System**: NX 21.2.0 (monorepo)
- **Package Manager**: npm with workspaces
- **Database**: MongoDB (optional)
- **Protocol**: MCP (Model Context Protocol)
- **Testing**: Vitest
- **Bundler**: SWC

## Project Structure
```
/home/laco/cvm/
├── packages/              # Core libraries
│   ├── parser/           # TypeScript AST → bytecode
│   ├── vm/              # Bytecode executor
│   ├── mcp-server/      # MCP protocol layer
│   ├── storage/         # Storage abstraction
│   ├── mongodb/         # MongoDB adapter
│   └── types/           # Shared types & CVMValue
├── apps/
│   └── cvm-server/      # npm package (v0.9.2)
├── memory-bank/         # Project documentation
├── docs/               # API documentation
├── test/               # Testing
│   ├── examples/       # Simple test programs
│   ├── programs/       # Integration test programs
│   └── integration/    # Integration testing client
└── tmp/                # Temporary debugging files
```

## Critical Configuration

### TypeScript
- **Module Resolution**: `nodenext` - MUST use `.js` imports
- Example: `import { foo } from './bar.js'` (even for .ts files)

### NX Commands (STRICT TDD)
```bash
# TDD Cycle
npx nx test {project} --watch     # Write failing test first
npx nx test {project}             # Verify test passes

# Build & Verify
npx nx run-many --target=build,typecheck,test --projects={project}

# Run specific test
npx nx test {project} -- {test-file}
```

### Environment Variables
```bash
# Storage configuration
CVM_STORAGE_TYPE=file      # or 'mongodb'
MONGODB_URI=mongodb://...  # if using MongoDB
CVM_DATA_DIR=./.cvm       # for file storage

# File system sandboxing (Phase 4)
CVM_SANDBOX_PATHS=/path1:/path2  # Colon-separated allowed paths
```

## Key Dependencies
- `typescript`: Required at runtime (parser uses compiler API)
- `@modelcontextprotocol/sdk`: MCP implementation
- `mongodb`: MongoDB driver (optional)
- `zod`: Schema validation
- `vitest`: Testing framework

## Development Workflow
1. **Write test first** (no exceptions)
2. **Implement minimal code** to pass test
3. **Run build, typecheck, test** before committing
4. **Use nx commands** exclusively

## Storage Options
1. **File Storage** (default): Zero setup, .cvm directory
2. **MongoDB**: Full persistence, requires connection

## Testing Strategy
- Unit tests next to source files (.spec.ts, .test.ts)
- Integration tests in test/integration/ with MCP client
- Test programs in test/programs/ for E2E validation  
- Test examples in test/examples/ for simple scenarios
- 580+ tests currently passing across all packages
- NO code without tests (STRICT TDD)

## Integration Testing
```bash
# CRITICAL: Always rebuild before integration testing
npx nx reset
npx nx run-many --target=build --all --skip-nx-cache

# Run integration tests
cd test/integration
npx tsx mcp-test-client.ts ../programs/test-name.ts [cc-responses...]
```