# Active Context - CVM Project

## Current Focus
Extending CVM language capabilities for file analysis workflows. Adding arrays, branching, iteration, and secure file operations to enable AI-driven analysis of large codebases.

## Recent Changes
- **MCP Server Version Fix**: Now uses actual package version instead of hardcoded 1.0.0
- **Language Extension Plan Created**: Detailed 4-phase plan for arrays, branching, iteration, and file operations
- **Publishing Stable**: Version 0.3.3 working correctly

## Language Extension Phases
1. **Phase 1**: Arrays + JSON parsing (foundation for structured data)
2. **Phase 2**: Branching (if/else for conditional logic)
3. **Phase 3**: Iteration (foreach for processing file lists)
4. **Phase 4**: File operations (secure getFiles() function)

## Next Steps
1. Cross-check language extension plan with Zen
2. Implement Phase 1: Arrays + JSON parsing with TDD
3. Update parser to handle array syntax
4. Extend VM to support new value types
5. Create integration tests with file analysis examples

## Current Implementation Focus
- Add return statement to parser (only in main())
- Add RETURN opcode to VM
- Rename all MCP methods and status values
- Add getTaskCount safety mechanism (fail after X attempts without progress)

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