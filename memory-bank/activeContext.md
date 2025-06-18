# Active Context - CVM Project

## Current Focus
Phase 2 (Branching) - Compiler infrastructure ready, implementing control flow statements.

## Recent Achievements
- ✅ Phase 1 Arrays + JSON parsing complete
- ✅ Storage abstraction implemented 
- ✅ npm publishing resolved (v0.2.7)
- ✅ Memory Bank cleaned and optimized
- ✅ Phase 2 implementation plan created
- ✅ cvmToNumber helper implemented with tests
- ✅ Comparison opcodes (EQ, NEQ, LT, GT) implemented
- ✅ Jump opcodes (JUMP, JUMP_IF_FALSE) implemented
- ✅ MongoDB test isolation fixed
- ✅ CompilerState class with context stack created
- ✅ Compiler refactored to use CompilerState

## Language Extension Status
1. **Phase 1**: Arrays + JSON parsing ✅
2. **Phase 2**: Branching (IN PROGRESS)
   - ✅ VM opcodes implemented
   - ✅ Type conversion helpers ready
   - ✅ CompilerState infrastructure ready
   - Next: Comparison operators & control flow statements
3. **Phase 3**: Iteration (PLANNED)
4. **Phase 4**: File operations (PLANNED)

## Next Implementation Steps
1. ✅ Create cvmToNumber helper in types package
2. ✅ Implement comparison opcodes (EQ, NEQ, LT, GT) in VM
3. ✅ Implement jump opcodes (JUMP, JUMP_IF_FALSE) in VM
4. ✅ Create CompilerState class with context stack
5. ✅ Refactor compiler to use CompilerState
6. Add comparison operators to compileExpression
7. Add if/else statement support with backpatching
8. Add while loop support with context stack

## Key Design Decisions
- **Context stack**: Enables nested control structures
- **JavaScript semantics**: Loose equality, numeric coercion
- **Backpatching**: Single-pass compilation with deferred jump resolution
- **TDD approach**: Write tests first for each component

## Important Patterns
- **Jump Resolution**: Track instruction indices, patch when target known
- **Type Coercion**: cvmToBoolean & cvmToNumber both ready
- **Compiler State**: Now using stateful class with emit() and patchJump()
- **JavaScript Semantics**: EQ/NEQ use type coercion, LT/GT convert to numbers
- **Context Stack**: Push/pop contexts for nested control structures

## Key Documentation
- memory-bank/docs/PHASE2_IMPLEMENTATION_PLAN.md - Detailed implementation guide
- memory-bank/docs/LANGUAGE_EXTENSIONS_PLAN.md - Overall language roadmap
- CLAUDE.md - Project guidelines and coding standards