# Active Context - CVM Project

## Current Focus
Phase 3 (Iteration) - IN PROGRESS
- VM implementation COMPLETE (ITER_START, ITER_NEXT, ITER_END)
- Next: Parser and compiler support for foreach loops

## Recent Achievements
- ✅ Phase 1 Arrays + JSON parsing complete
- ✅ Storage abstraction implemented 
- ✅ npm publishing resolved (v0.2.7)
- ✅ Memory Bank cleaned and optimized
- ✅ Phase 2 COMPLETE:
  - ✅ cvmToNumber helper implemented with tests
  - ✅ Comparison opcodes (EQ, NEQ, LT, GT) implemented
  - ✅ Jump opcodes (JUMP, JUMP_IF_FALSE) implemented
  - ✅ CompilerState class with context stack created
  - ✅ Compiler refactored to use CompilerState
  - ✅ Comparison operators (==, !=, <, >) in compiler
  - ✅ Arithmetic operators (ADD, SUB, MUL, DIV) with smart detection
  - ✅ If/else statements with proper backpatching
  - ✅ While loops with context management
  - ✅ Assignment expressions (i = i + 1)
  - ✅ Smart ADD/CONCAT detection based on operand types
  - ✅ ALL comparison operators (==, !=, <, >, <=, >=, ===, !==)
  - ✅ ALL arithmetic operators (ADD, SUB, MUL, DIV, MOD)
  - ✅ Integration tests validating all features E2E
  - ✅ 235+ tests passing across all packages
- ✅ Critical Bug Fixes:
  - ✅ Fixed ADD/CONCAT detection - arithmetic now works correctly (10 + 20 = 30)
  - ✅ Implemented ARRAY_SET opcode - CC values can be stored in arrays
  - ✅ Improved hasStringOperand() to recursively check for string literals
  - ✅ Added proper stack ordering for array assignments
  - ✅ 174 tests now passing (added E2E arithmetic tests)
- ✅ Phase 3 VM Implementation:
  - ✅ ITER_START, ITER_NEXT, ITER_END opcodes implemented
  - ✅ BREAK, CONTINUE opcodes defined
  - ✅ Iterator stack management with IteratorContext
  - ✅ Support for nested iterators (max depth: 10)
  - ✅ Array snapshot behavior for safe iteration
  - ✅ Two-value ITER_NEXT push (element, hasMore)
  - ✅ Comprehensive test suite (38 new tests)
- ✅ Additional Operators Implemented:
  - ✅ Modulo operator (%) - MOD opcode
  - ✅ Less than or equal (<=) - LTE opcode
  - ✅ Greater than or equal (>=) - GTE opcode
  - ✅ Strict equality (===) - EQ_STRICT opcode
  - ✅ Strict inequality (!==) - NEQ_STRICT opcode
  - ✅ Full compiler support for all new operators
  - ✅ 235+ tests now passing

## Language Extension Status
1. **Phase 1**: Arrays + JSON parsing ✅
2. **Phase 2**: Branching ✅ COMPLETE!
   - ✅ All VM opcodes implemented
   - ✅ Type conversion helpers ready
   - ✅ CompilerState infrastructure ready
   - ✅ All comparison & arithmetic operators
   - ✅ If/else statements
   - ✅ While loops
   - ✅ Full E2E validation
3. **Phase 3**: Iteration (IN PROGRESS)
   - ✅ VM opcodes implemented
   - ✅ Iterator state management ready
   - Need: Parser foreach syntax
   - Need: Compiler implementation
4. **Phase 4**: File operations (PLANNED)

## Next: Phase 3 Completion
1. ✅ Implement ITER_START, ITER_NEXT, ITER_END opcodes in VM
2. ✅ Create iterator state management
3. Add foreach syntax to parser
4. Implement compiler support for foreach loops
5. Handle break/continue compilation
6. Integration tests with real foreach syntax

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
- **Iterator Stack**: Separate stack for managing nested iterators
- **Two-Value Push**: ITER_NEXT pushes element then hasMore flag
- **Array Snapshots**: Iterator creates copy to prevent corruption

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