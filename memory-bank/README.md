# Claude's Memory Bank

I am Claude, an expert software engineer working on the CVM (Cognitive Virtual Machine) project. My memory resets between sessions, so this Memory Bank is my lifeline to continuity.

## Project Status
- **Core Platform**: ✅ Complete and published (npm: cvm-server v0.9.0 ready)
- **Phase 1**: ✅ Arrays + JSON parsing implemented
- **Phase 2**: ✅ Branching complete (if/else, while, ALL comparisons, ALL arithmetic, ALL logical)
- **Phase 3**: ✅ **COMPLETE!** For-of loops with break/continue support
- **Phase 4**: ✅ File operations - fs.listFiles() with sandboxing
- **Object Support**: ✅ **COMPLETE!** Full object implementation with CC persistence (June 21, 2025)
- **LoadFile Tool**: ✅ Token-saving file loading via `mcp__cvm__loadFile`
- **String Methods**: ✅ slice(), charAt(), toUpperCase(), toLowerCase() implemented
- **Iterator Fix**: ✅ **FIXED!** For-of loops now work correctly with CC calls (v0.7.0)
- **Critical Features**: ✅ All major language features implemented
- **Tests**: 570 tests all passing + integration tests verified
- **Next**: Release v0.9.0 to npm, then Phase 5 (Functions) or block scoping

## What Works (Major Features)
- ✅ All operators (arithmetic, comparison, logical, unary, compound assignment)
- ✅ All control flow (if/else, while, for-of, break/continue, ternary)
- ✅ All basic types (string, number, boolean, null, undefined, array, **object**)
- ✅ Object operations (literals, property access, shorthand properties, JSON.stringify)
- ✅ String methods (length, substring, indexOf, split, slice, charAt, toUpperCase, toLowerCase)
- ✅ Array operations (literals, access, assignment, push, length)
- ✅ Core functions (CC, console.log, JSON.parse, JSON.stringify, typeof)
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
✅ **OBJECT SUPPORT IMPLEMENTATION** - Full object support completed!
- Implemented object literals with `{ key: value }` syntax
- Added property access (dot and bracket notation)
- Fixed CC persistence issue by changing from Map to Record
- JSON.stringify and JSON.parse work with objects
- All 570 tests passing with zero regressions
- E2E tests verified: objects work perfectly with CC state persistence
- See `activeContext.md` for full details

## Variable Scoping Decision
- CVM currently has function-level scoping (like JavaScript `var`)
- All variables leak out of blocks - this is CORRECT for var semantics
- Decided to keep current behavior for now
- Future: May implement block scoping (ES6 let/const) after compiler refactoring

## Recent Achievements
✅ **Object Support** - Full implementation with CC persistence (June 21, 2025)
✅ **Version 0.7.0 Released** - Iterator state persistence fix
✅ **fs.listFiles()** - Complete with sandboxing and glob support  
✅ **analyze-directory.ts** - Now works correctly with iterator fix