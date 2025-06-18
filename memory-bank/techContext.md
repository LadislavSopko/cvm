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
│   └── types/           # Shared types & CVMValue
├── apps/
│   └── cvm-server/      # npm package (v0.2.7)
├── memory-bank/         # Project documentation
├── examples/            # Example CVM programs
└── test/               # Integration tests
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
- Unit tests next to source files
- Integration tests in test/integration
- 118 tests currently passing
- NO code without tests