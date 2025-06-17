# Active Context - CVM Project

## Current Focus
Ready to begin Phase 2 of CVM language extensions - Branching. Phase 1 (Arrays + JSON parsing) is complete and tested.

## Recent Changes
- **Console.log Output Refactoring COMPLETED**: Separated output from execution state
  - Removed `output` field from Execution type - no longer part of state
  - Added `appendOutput` and `getOutput` methods to StorageAdapter interface
  - FileStorageAdapter writes output to separate `.output` files
  - MongoDBAdapter stores output in separate `outputs` collection
  - VMManager extracts output after execution and persists separately
  - Added `getExecutionOutput` method to VMManager for retrieving output
  - Maintains proper encapsulation - VM remains pure, VMManager orchestrates
  - All 118 tests passing across all packages
- **Phase 1 Implementation COMPLETED**: Full array support with JSON parsing
  - Added CVMValue type: string | number | boolean | CVMArray | null
  - Implemented type guards and conversion helpers
  - Added array opcodes: ARRAY_NEW, ARRAY_PUSH, ARRAY_GET, ARRAY_LEN
  - Added JSON_PARSE for parsing AI responses
  - Added TYPEOF for runtime type checking
  - Added basic arithmetic: ADD, SUB
  - VM now uses type-safe CVMValue[] stack
  - Compiler supports full array syntax: literals, indexing, methods
  - Fixed LOAD operation bug with null values
  - Fixed cvm-server ES module configuration

## Language Extension Status
1. **Phase 1**: Arrays + JSON parsing (COMPLETED ✅)
   - ✅ Type system implemented
   - ✅ VM opcodes implemented
   - ✅ Parser/compiler support completed
   - ✅ Integration tests completed
   - ✅ Example program created (array-demo.ts)
2. **Phase 2**: Branching (READY TO START)
   - Comparison opcodes defined: EQ, NEQ, LT, GT
   - Jump opcodes defined: JUMP, JUMP_IF, JUMP_IF_FALSE, JUMP_IF_TRUE
   - Logical opcodes defined: AND, OR, NOT
3. **Phase 3**: Iteration (PLANNED)
4. **Phase 4**: File operations (PLANNED)

## Next Steps
1. Implement comparison opcodes in VM (EQ, NEQ, LT, GT)
2. Implement jump opcodes (JUMP, JUMP_IF_FALSE)
3. Update compiler to handle if/else statements
4. Create tests for branching logic
5. Implement logical operators (AND, OR, NOT)

## Current Implementation Focus
- Create reliable test client for CVM programs with CC instructions
- Design test programs that work with simple pre-programmed responses
- Document testing strategy for cognitive interrupts
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