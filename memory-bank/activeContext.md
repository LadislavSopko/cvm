# Active Context - CVM Project

## Current Focus
Implementing Phase 1 of CVM language extensions - Arrays and JSON parsing. Core type system complete, parser/compiler updates needed next.

## Recent Changes
- **Phase 1 Implementation Started**: CVMValue type system and array operations
  - Added CVMValue type: string | number | boolean | CVMArray | null
  - Implemented type guards and conversion helpers
  - Added array opcodes: ARRAY_NEW, ARRAY_PUSH, ARRAY_GET, ARRAY_LEN
  - Added JSON_PARSE for parsing AI responses
  - Added TYPEOF for runtime type checking
  - Added basic arithmetic: ADD, SUB
  - VM now uses type-safe CVMValue[] stack
  - 91 tests passing, all builds successful

## Language Extension Status
1. **Phase 1**: Arrays + JSON parsing (IN PROGRESS)
   - ✅ Type system implemented
   - ✅ VM opcodes implemented
   - ⏳ Parser/compiler support needed
   - ⏳ Integration tests needed
2. **Phase 2**: Branching (PLANNED)
3. **Phase 3**: Iteration (PLANNED)
4. **Phase 4**: File operations (PLANNED)

## Next Steps
1. Update parser to recognize array syntax
2. Update compiler to generate array opcodes
3. Create example programs using arrays
4. Complete Phase 1 integration tests
5. Move to Phase 2: Branching

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