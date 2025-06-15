# Active Context - CVM Project

## Current Focus
Publishing CVM as a professional open source project with `npx @cvm/cvm-server` support. Using Apache 2.0 license with environment-based configuration following MCP server conventions.

## Recent Changes
- Created fresh NX workspace at /home/laco/cvm
- Initialized Memory Bank structure
- Created all core Memory Bank files
- Cleaned up inconsistencies:
  - Standardized on Vitest for testing
  - Changed MCP method from continueExecution to getNext
  - Removed old project references from Memory Bank README
- Implemented parser library:
  - Uses TypeScript compiler API for AST parsing
  - CVM as TypeScript subset (main() required)
  - Validates forbidden APIs (setTimeout, fetch, etc.)
  - Full TDD approach with all tests passing
- Implemented compiler:
  - Transforms TypeScript AST to CVM bytecode
  - Supports: variables, CC(), console.log(), string concatenation
- Implemented VM library:
  - Stack-based bytecode executor
  - Handles PUSH, POP, LOAD, STORE, CONCAT, PRINT, CC, HALT
  - Pauses execution on CC instruction
  - Resume capability with CC results
- Created integration tests proving end-to-end functionality
- Set up MongoDB:
  - Connected to existing MongoDB instance (root:example@localhost:27017)
  - Created CVM database with collections: programs, executions, history
- Implemented @cvm/mongodb library:
  - MongoDBAdapter class for database operations
  - Full TDD implementation with all tests passing
  - Supports saving/loading programs, executions, and history
  - Proper TypeScript types extending MongoDB Document
- **Created @cvm/types package** to solve circular dependency issues:
  - Shared type definitions used by all packages
  - Prevents circular dependencies between VM and MongoDB
  - Clean architectural separation
- **Implemented VMManager** to encapsulate execution and persistence logic:
  - Owns MongoDB adapter instance
  - Manages program and execution lifecycle
  - Handles state persistence automatically
  - VM itself remains pure execution engine
- **Fixed architecture** so VM owns MongoDB persistence:
  - MCP server is now just a thin protocol layer
  - VMManager handles all business logic
  - Clean separation of concerns achieved
- **All core components integrated** with passing tests:
  - Parser-VM-MongoDB integration verified
  - End-to-end execution with persistence working
  - Architecture properly layered without circular dependencies
- **MCP Server fully implemented**:
  - All protocol methods working with VMManager
  - Tests updated to mock VMManager instead of MongoDB
  - Clean protocol layer with no business logic
  - 13 tests passing, full functionality verified
- **Fixed encapsulation violations**:
  - MCP server no longer takes MongoDB as constructor parameter
  - VMManager creates its own MongoDB connection from environment
  - Added .env file with MONGODB_URI=mongodb://root:example@localhost:27017/cvm?authSource=admin
  - All packages now properly encapsulated
  - 51 tests passing across all packages
- **Created cvm-server application**:
  - NX application in apps/cvm-server
  - Handles environment configuration (MongoDB URI, log levels)
  - Logs to stderr to keep stdout clean for MCP protocol
  - Graceful shutdown handling
  - Ready for MCP client connections
- **Fixed multiple CC execution bug**:
  - Issue: After first CC, execution got stuck "Waiting for input"
  - Root cause: getNext was executing instead of just reading state
  - Solution: Made getNext read-only, reportCCResult continues execution
  - Proper flow: startExecution → getNext (read) → reportCCResult (execute) → getNext (read)
  - Added comprehensive tests for multiple CC scenarios
- **Completed Major Refactoring**:
  - **Removed History tracking entirely** - not needed for core VM functionality
  - **Fixed stateful VMManager** - added ccPrompt to Execution type for persistence
  - **Removed MongoDB dependencies from types** - types are now pure data objects
  - **Simplified architecture** - no history means no atomicity concerns, simpler storage
  - All tests passing (46 total), all packages build successfully
- **Implemented Storage Abstraction**:
  - Created @cvm/storage package with StorageAdapter interface
  - Moved MongoDBAdapter to storage package
  - Implemented FileStorageAdapter for zero-setup experience
  - Created StorageFactory for easy configuration
  - Updated VMManager to use storage abstraction (dependency injection)
  - All 70 tests passing, all packages build successfully
- **Publishing Plan Finalized**:
  - Apache 2.0 license chosen for community-friendly IP protection
  - Environment-based configuration (MCP standard)
  - Default to file storage in `.cvm` directory
  - Clear warnings about .gitignore requirement
  - Simple bin wrapper for npx execution
- **Publishing Implementation Started**:
  - Set up npm publishing with Apache 2.0 license
  - Created executable bin/cvm-server.cjs wrapper
  - Configured automatic versioning with nx release
  - Added vite-plugin-static-copy for automatic asset handling
  - Fixed ES module/CommonJS conflict by adding "type": "commonjs" to package.json
  - Added typescript to dependencies (required for runtime parser)

## Publishing Issue FULLY RESOLVED
**PROBLEM**: NX release publish was publishing from SOURCE directory instead of DIST directory, causing published packages to be missing main.js.

**ROOT CAUSE DISCOVERED**: 
- `@nx/js:release-publish` executor has a bug with packageRoot and file resolution
- When npm runs from workspace root, it uses .gitignore (which excludes dist) since there's no .npmignore
- This caused main.js to be excluded from the tarball

**SOLUTION IMPLEMENTED**:
1. **Removed publish override from nx.json** - Let nx release use project's own publish target
2. **Project publish target** in package.json correctly uses: `cd apps/cvm-server/dist && npm publish`
3. This ensures npm runs from within dist directory, avoiding .gitignore issues

**PUBLISHING WORKFLOW**:
- **Version bump**: `npx nx release version patch` (or minor/major)
- **Publish**: `npx nx run cvm-server:publish`
- **Or all-in-one**: `npx nx release`

**STATUS**: 
- Versions 0.2.5 and 0.2.6 published with missing main.js (broken)
- Version 0.2.7 published correctly with all files including main.js
- Recommend deprecating 0.2.5 and 0.2.6 with: `npm deprecate cvm-server@0.2.5 "Missing main.js - use 0.2.7 or later"`

## Next Steps
1. Test npx cvm-server@latest execution from npm registry
2. Deprecate broken versions: `npm deprecate cvm-server@0.2.5 "Missing main.js - use 0.2.7 or later"`
3. Update documentation with publishing process
4. Create examples documentation
5. Announce release

## Active Decisions
- Start with minimal feature set - just enough to validate architecture
- Use TypeScript with ES modules (`.js` imports required)
- MongoDB for all state persistence
- MCP protocol for AI communication
- No refactoring - get architecture right first time
- STRICT TDD: Write test → Write code → Build → Lint → Test → Fix
- All NX commands for build/lint/test - no npm run scripts

## Important Patterns
- **Execution Flow**: Claude polls → CVM responds with state/prompt → Claude processes → Claude sends response → Repeat
- **State Machine**: CVM is deterministic controller, Claude is cognitive processor
- **Clean Separation**: VM handles execution, AI handles reasoning
- **Development**: STRICT TDD - Test → Code → Build → Lint → Test → Fix (see DEVELOPMENT_RULES.md)

## Project Insights
- CVM inverts typical AI integration - instead of AI calling functions, programs call AI
- Deterministic execution with cognitive interrupts enables debugging AI programs
- State persistence in MongoDB allows long-running cognitive processes
- Architecture supports AI agents of varying capabilities

## Key Documentation
- memory-bank/docs/EXAMPLES.md - Complete program examples for testing
- memory-bank/docs/CLAUDE_PROMPTS.md - Implementation guidance for each phase
- memory-bank/docs/SIMPLIFICATION_NOTES.md - Philosophy of starting simple
- memory-bank/docs/DEVELOPMENT_ROADMAP.md - Detailed implementation phases