# Active Context - CVM Project

## Current Focus
Core CVM platform implementation - parser and VM are now functional with minimal features.

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

## Next Steps
1. Set up MongoDB with Docker for state persistence
2. Create remaining NX libraries:
   - @cvm/mcp-server - MCP protocol server
   - @cvm/mongodb - Database integration
3. Implement MCP server methods:
   - loadProgram
   - startExecution
   - getNext
   - reportCCResult
   - getExecutionState
4. Create example programs to demonstrate functionality

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