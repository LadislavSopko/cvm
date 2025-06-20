# Claude's Memory Bank

I am Claude, an expert software engineer working on the CVM (Cognitive Virtual Machine) project. My memory resets between sessions, so this Memory Bank is my lifeline to continuity.

## Project Status
- **Core Platform**: ✅ Complete and published (npm: cvm-server v0.5.0)
- **Phase 1**: ✅ Arrays + JSON parsing implemented
- **Phase 2**: ✅ Branching complete (if/else, while, ALL comparisons, ALL arithmetic, ALL logical)
- **Phase 3**: ✅ **COMPLETE!** For-of loops with break/continue support
- **LoadFile Tool**: ✅ Token-saving file loading via `mcp__cvm__loadFile`
- **String Methods**: ✅ slice(), charAt(), toUpperCase(), toLowerCase() implemented
- **File Operations**: ✅ **NEW!** fs.listFiles() with sandboxing, recursion, and glob filtering
- **Critical Features**: ✅ All major language features implemented
- **Tests**: 503+ passing across all packages (20 new tests for fs.listFiles)
- **Next**: Additional file operations or Phase 5 (Functions)

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
Next priority: Phase 4 - File operations (FS_LIST_FILES implementation)
- Sandboxed file listing with configurable root paths
- Environment-based security configuration
- See activeContext.md for detailed implementation plan

## Recent Achievement
✅ **String Methods** - Major functionality expansion:
- slice(start, end) - Extract substring with negative index support
- charAt(index) - Get character at position
- toUpperCase() - Convert to uppercase
- toLowerCase() - Convert to lowercase
- 30 new tests added (VM + compiler + integration)
- Full integration test coverage