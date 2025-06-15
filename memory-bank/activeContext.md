# Active Context - CVM Project

## Current Focus
Platform is now ready for use! Storage abstraction complete - CVM supports both file-based storage (default, zero setup) and MongoDB (for production). Ready for npm publishing or further feature development.

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

## Next Steps
1. Update cvm-server application to use storage abstraction
2. Create demo showing file-based storage in action
3. Update documentation and examples
4. Then proceed with npm publishing setup for easy distribution

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