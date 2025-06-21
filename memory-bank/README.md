# Claude's Memory Bank

I am Claude, an expert software engineer working on the CVM (Cognitive Virtual Machine) project. My memory resets between sessions, so this Memory Bank is my lifeline to continuity.

## Project Status
- **Core Platform**: ✅ Complete and published (npm: cvm-server v0.7.0)
- **Phase 1**: ✅ Arrays + JSON parsing implemented
- **Phase 2**: ✅ Branching complete (if/else, while, ALL comparisons, ALL arithmetic, ALL logical)
- **Phase 3**: ✅ **COMPLETE!** For-of loops with break/continue support
- **Phase 4**: ✅ File operations - fs.listFiles() with sandboxing
- **LoadFile Tool**: ✅ Token-saving file loading via `mcp__cvm__loadFile`
- **String Methods**: ✅ slice(), charAt(), toUpperCase(), toLowerCase() implemented
- **Iterator Fix**: ✅ **FIXED!** For-of loops now work correctly with CC calls (v0.7.0)
- **Critical Features**: ✅ All major language features implemented
- **Tests**: 400+ tests all passing
- **Next**: Compiler refactoring to visitor pattern, then block scoping or Phase 5 (Functions)

## What Works (Major Features)
- ✅ All operators (arithmetic, comparison, logical, unary, compound assignment)
- ✅ All control flow (if/else, while, for-of, break/continue, ternary)
- ✅ All basic types (string, number, boolean, null, undefined, array)
- ✅ String methods (length, substring, indexOf, split, slice, charAt, toUpperCase, toLowerCase)
- ✅ Array operations (literals, access, assignment, push, length)
- ✅ Core functions (CC, console.log, JSON.parse, typeof)
- ✅ File operations (fs.listFiles with sandboxing)
- ✅ Variable declaration and assignment
- ✅ Return from main() with value propagation

## Active Context
See `activeContext.md` for current work and immediate next steps.

## Key Documentation
- **docs/API.md** - Complete language reference (kept current)
- **activeContext.md** - Current work status
- **systemPatterns.md** - Architecture patterns
- **techContext.md** - Tools and configuration

## Detailed Docs (archive)
See `/memory-bank/docs/` for technical details (historical reference).

## Key Reminders
- **STRICT TDD**: Always write tests first
- **ES Modules**: Use `.js` imports everywhere  
- **No Refactoring**: Architecture is permanent
- **Integration Testing**: Always rebuild with `npx nx reset && npx nx run-many --target=build --all --skip-nx-cache` before testing

## Current Task
✅ **VM HANDLER PATTERN MIGRATION** - Core VM refactoring completed!
- Migrated VM from monolithic switch to modular handler pattern
- Created clean handler structure: arithmetic, stack, I/O, control, variables, iterators
- Enhanced type safety: eliminated all `any` types, proper CVMValue typing
- All 524 tests passing with zero regressions
- E2E tests verified: arithmetic, iterators, CC, string operations all working
- See `activeContext.md` for full details

## Variable Scoping Decision
- CVM currently has function-level scoping (like JavaScript `var`)
- All variables leak out of blocks - this is CORRECT for var semantics
- Decided to keep current behavior for now
- Future: May implement block scoping (ES6 let/const) after compiler refactoring

## Recent Achievements
✅ **Version 0.7.0 Released** - Iterator state persistence fix
✅ **fs.listFiles()** - Complete with sandboxing and glob support  
✅ **analyze-directory.ts** - Now works correctly with iterator fix