# Tech Context - CVM Development Environment

## Technology Stack

### Core Technologies
- **Language**: TypeScript 5.8.2
- **Runtime**: Node.js
- **Build System**: NX 21.2.0 (monorepo)
- **Package Manager**: npm with workspaces
- **Database**: MongoDB
- **Protocol**: MCP (Model Context Protocol)

### Development Tools
- **Bundler**: SWC (faster than TypeScript compiler)
- **Testing**: Vitest (when added)
- **IDE**: VS Code with Claude Code

## Project Structure
```
/home/laco/cvm/
├── packages/              # NX packages
│   ├── parser/           # @cvm/parser
│   ├── vm/              # @cvm/vm
│   ├── mcp-server/      # @cvm/mcp-server
│   └── mongodb/         # @cvm/mongodb
├── memory-bank/         # Project documentation
├── docker/              # Docker configuration
│   └── docker-compose.yml
├── nx.json             # NX configuration
├── tsconfig.base.json  # Base TypeScript config
└── package.json        # Root package.json
```

## Technical Constraints

### TypeScript Configuration
- Module Resolution: `nodenext` (CRITICAL)
- **MUST** use `.js` extension for all imports
- Example: `import { Parser } from './parser.js'` (even for .ts files)

### NX Commands (STRICT TDD WORKFLOW)

**MEGA RULE: Test → Code → Build → Lint → Test → Fix**

```bash
# Create library
npx nx g @nx/js:lib packages/{name} --unitTestRunner=vitest --bundler=vite --projectNameAndRootFormat=as-provided --importPath=@cvm/{name}

# TDD Cycle (ALWAYS start here)
npx nx test {project} --watch     # Write failing test first
npx nx test {project}             # Verify test passes

# Verification (MUST run after code changes)
npx nx run-many --target=build,lint,test --projects={project}

# Individual commands
npx nx build {project}
npx nx lint {project}
npx nx lint {project} --fix       # Auto-fix issues

# Check affected
npx nx affected:test
npx nx affected:lint
npx nx affected:build
```

**NO CODE WITHOUT TESTS. NO EXCEPTIONS.**

### MongoDB Setup
- Local development via Docker
- Collections: programs, executions, history, logs
- Connection string in environment variables

### MCP Protocol Requirements
- JSON-RPC 2.0 format
- Communication over stdio
- Stateless operation (state in MongoDB)
- Error codes follow JSON-RPC standards

## Dependencies

### Current Dependencies
- `@nx/js`: NX JavaScript plugin
- `@swc-node/register`: SWC Node.js register
- `@swc/core`: SWC compiler core
- `typescript`: TypeScript compiler
- `tslib`: TypeScript runtime library

### Planned Dependencies
- `mongodb`: MongoDB driver
- `@modelcontextprotocol/sdk`: MCP SDK (if available)
- `vitest`: Testing framework
- Additional as needed

## Tool Usage Patterns

### Git Workflow
- Main branch development
- Commit messages descriptive
- No emojis in commits
- Pull requests when requested

### Testing Strategy (TDD MANDATORY)
- **RED**: Write failing test first
- **GREEN**: Write minimal code to pass
- **REFACTOR**: Clean up with tests passing
- Test files next to source: `parser.ts` → `parser.test.ts`
- Unit tests for all functions/classes
- Integration tests for module boundaries
- E2E tests for complete flows
- NO code without tests - enforce in PR/commit

### Debugging Approach
- MongoDB for state inspection
- Execution history tracking
- Clear error messages
- Step-through debugging via state

## Environment Setup

### Required Software
1. Node.js (LTS version)
2. MongoDB (via Docker)
3. VS Code or compatible IDE
4. Git

### Environment Variables
```bash
MONGODB_URI=mongodb://localhost:27017/cvm
CVM_PORT=3000  # For MCP server
CVM_LOG_LEVEL=debug
```

### Docker Services
- MongoDB on port 27017
- Optional: Mongo Express for GUI
- Future: CVM MCP server container

## Build and Development

### Development Workflow
1. Make changes in packages/
2. Run `npx nx affected:build`
3. Run `npx nx affected:test`
4. Test with MCP client

### Production Build
```bash
npx nx build parser
npx nx build vm
npx nx build mcp-server
npx nx build mongodb
```

### Debugging
- Use VS Code debugger
- MongoDB Compass for database inspection
- Console logging with proper levels
- State inspection via MongoDB queries