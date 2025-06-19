# Claude's Memory Bank

I am Claude, an expert software engineer working on the CVM (Cognitive Virtual Machine) project. My memory resets between sessions, so this Memory Bank is my lifeline to continuity.

## Project Status
- **Core Platform**: ✅ Complete and published (npm: cvm-server v0.2.7)
- **Phase 1**: ✅ Arrays + JSON parsing implemented
- **Phase 2**: ✅ Branching complete (if/else, while, comparisons, arithmetic)
- **Phase 3**: 🚧 Iteration - VM complete, need parser/compiler
- **Bug Fixes**: ✅ Fixed ADD/CONCAT detection, implemented ARRAY_SET
- **Tests**: 212 passing (38 new iterator tests)
- **Next**: Phase 3 parser and compiler implementation

## Quick Context Files
1. **activeContext.md** - Current work and next steps
2. **progress.md** - What's done and what's left
3. **systemPatterns.md** - Architecture and design patterns
4. **techContext.md** - Tools and configuration

## Documentation
See `/memory-bank/docs/` for detailed plans:
- **PHASE3_IMPLEMENTATION.md** - Current iteration work details
- **LANGUAGE_EXTENSIONS_PLAN.md** - Language roadmap
- **EXAMPLES.md** - Working code examples
- **BUG_FIXES.md** - Critical bugs found and fixed

## API Documentation
See `/docs/API.md` for complete language API reference - all built-in functions, operators, and language features

## Key Reminders
- **STRICT TDD**: Always write tests first
- **ES Modules**: Use `.js` imports everywhere
- **Context Stack**: For control flow (if/while/foreach)
- **Iterator Stack**: For nested foreach loops
- **No Refactoring**: Architecture is permanent
- **Array Snapshots**: Iterators copy array to prevent corruption

## Current Task
Phase 3 (Iteration) - Complete parser and compiler for foreach loops