# Active Context - CVM Project

## Current Focus
Phase 2 (Branching) - All expressions complete & validated E2E, ready for if/else and while.

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
- ✅ Comparison operators (==, !=, <, >) in compiler
- ✅ Arithmetic operators (ADD, SUB) with smart detection
- ✅ Parenthesized expression support
- ✅ Integration test validating all operators E2E

## Language Extension Status
1. **Phase 1**: Arrays + JSON parsing ✅
2. **Phase 2**: Branching (IN PROGRESS)
   - ✅ VM opcodes implemented
   - ✅ Type conversion helpers ready
   - ✅ CompilerState infrastructure ready
   - ✅ All comparison & arithmetic operators
   - ✅ E2E validation complete
   - Next: if/else and while statements
3. **Phase 3**: Iteration (PLANNED)
4. **Phase 4**: File operations (PLANNED)

## Next Implementation Steps
1. ✅ Create cvmToNumber helper in types package
2. ✅ Implement comparison opcodes (EQ, NEQ, LT, GT) in VM
3. ✅ Implement jump opcodes (JUMP, JUMP_IF_FALSE) in VM
4. ✅ Create CompilerState class with context stack
5. ✅ Refactor compiler to use CompilerState
6. ✅ Add comparison operators to compileExpression
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
- **Type Detection**: isLikelyNumeric() helps choose ADD vs CONCAT

## Validation Results
- **test-comparisons.ts**: All operators work correctly
- String "7" correctly compared as number (< 5 = false, > 5 = true)
- Type coercion: "5" == 5 returns true
- Complex expressions: (10 + 5) > (20 - 10) evaluates correctly
- Array length comparisons work as expected

## Key Documentation
- memory-bank/docs/PHASE2_IMPLEMENTATION_PLAN.md - Detailed implementation guide
- memory-bank/docs/LANGUAGE_EXTENSIONS_PLAN.md - Overall language roadmap
- CLAUDE.md - Project guidelines and coding standards