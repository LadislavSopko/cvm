# Claude's Memory Bank

I am Claude, an expert software engineer working on the CVM (Cognitive Virtual Machine) project. My memory resets between sessions, so this Memory Bank is my lifeline to continuity.

## Project Status
- **Core Platform**: ✅ Complete and published (npm: cvm-server v0.4.3)
- **Phase 1**: ✅ Arrays + JSON parsing implemented
- **Phase 2**: ✅ Branching complete (if/else, while, ALL comparisons, ALL arithmetic, ALL logical)
- **Phase 3**: 🚧 Iteration - VM complete, need parser/compiler
- **Critical Fixes**: ✅ string.length works! ✅ return from main() works!
- **Tests**: 332 passing (36 test files across all packages)
- **Next**: undefined type, unary operators, then Phase 3 parser/compiler

## Quick Context Files
1. **activeContext.md** - Current work and next steps
2. **progress.md** - What's done and what's left
3. **systemPatterns.md** - Architecture and design patterns
4. **techContext.md** - Tools and configuration

## Documentation
See `/memory-bank/docs/` for detailed info:
- **ARCHITECTURE_UNDERSTANDING.md** - How parser→compiler→VM works
- **CVM_EXECUTION_MODEL.md** - CRITICAL: How CVM really works (AI-driven)
- **INTEGRATION_TESTING.md** - How to run integration tests
- **TEST_PROGRAMS.md** - Available test programs guide  
- **CRITICAL_MISSING_FEATURES.md** - What's still needed
- **PHASE3_IMPLEMENTATION.md** - Iteration work details
- **LANGUAGE_EXTENSIONS_PLAN.md** - Language roadmap

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
Next priority: undefined value type (fundamental JS primitive)