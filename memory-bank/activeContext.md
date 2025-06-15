# Active Context - CVM Project

## Current Focus
CVM Server is successfully published and working! Version 0.2.7 is live on npm and can be installed with `npx cvm-server`. The project is now ready for usage documentation and examples.

## Recent Changes
- **Successfully resolved publishing issue**: Version 0.2.7 published with all required files
- **Publishing workflow established**: Using nx release with custom publish target
- **Working installation**: `npx cvm-server` confirmed working in examples directory
- **API Refactoring Complete**: Renamed all MCP methods and status values for v0.3.0

## Publishing Status
- **Version 0.3.0**: Published and working with new API ✅
- **Version 0.2.7**: Last version with old API
- **Versions 0.2.5, 0.2.6**: Deprecated (were missing main.js)
- **Installation**: `npx cvm-server@latest` or `npm install -g cvm-server`

## v0.3.0 API Changes
- **Method Renames**:
  - `loadProgram` → `load`
  - `startExecution` → `start`
  - `getNext` → `getTask`
  - `reportCCResult` → `submitTask`
  - `getExecutionState` → `status`
- **Status Value Updates**:
  - `ready` → `READY`
  - `running` → `RUNNING`
  - `waiting_cc` → `AWAITING_COGNITIVE_RESULT`
  - `completed` → `COMPLETED`
  - `error` → `ERROR`

## Next Steps
1. Implement return value support for main()
2. Rename MCP methods to simpler names (load, start, getTask, submitTask, status)
3. Add safety counter to prevent infinite getTask loops
4. Create user-facing documentation (README updates, examples)
5. Announce the release

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