# Active Context - CVM Project

## Current Status
🔧 **COMPILER REFACTORING** - Transforming monolithic compiler to visitor pattern

## Current Task Details
- **Goal**: Refactor 700+ line compiler.ts into modular visitor pattern
- **Approach**: Zero functional changes - pure structural refactoring
- **Plan**: `/home/laco/cvm/packages/vm/COMPILER_REFACTORING_PLAN.md`
- **Status**: Ready to begin Phase 1 (Setup Infrastructure)

### Why This Refactoring?
- Current compiler has giant if/else chains that are hard to maintain
- Visitor pattern will make it modular and testable
- Prerequisites for future features (block scoping, functions)
- All tests passing - safe to refactor

### Implementation Phases
1. **Phase 0**: Setup infrastructure and types
2. **Phase 1**: Extract expression visitors (literals first, then complex)
3. **Phase 2**: Extract statement visitors 
4. **Phase 3**: Remove old code, finalize dispatch
5. **Phase 4**: Type-safe dispatch and cleanup

## Recent Decisions
- **Variable Scoping**: Keep current var-like behavior (function scoping)
- **Block Scoping**: Deferred until after compiler refactoring
- **Focus**: Structure and maintainability over new features

## Language Status
CVM supports these TypeScript/JavaScript features:
- **Statements**: if/else, while, for-of, blocks, variables, return, break/continue
- **Expressions**: literals, arrays, binary ops, unary ops, calls, property access
- **Types**: string, number, boolean, null, undefined, array
- **Built-ins**: CC(), console.log(), fs.listFiles(), JSON.parse(), typeof

## Next Steps After Refactoring
1. Consider implementing block scoping (let/const semantics)
2. Additional file operations (readFile, writeFile, etc.)
3. Phase 5: Functions (biggest remaining feature)

## Technical Context
- All 400+ tests passing
- Version 0.7.0 released with iterator fix
- No breaking changes planned during refactoring