# CVM Documentation Overview

## Quick Links
- [Architecture](ARCHITECTURE.md) - System design and components
- [Language Extensions](LANGUAGE_EXTENSIONS_PLAN.md) - Language feature roadmap
- [Phase 2 Implementation](PHASE2_IMPLEMENTATION_PLAN.md) - Current work: Branching
- [Development Roadmap](DEVELOPMENT_ROADMAP.md) - Overall project phases
- [Examples](EXAMPLES.md) - Example CVM programs

## Project Status
- **Core Platform**: ✅ Complete (118 tests passing)
- **Phase 1**: ✅ Arrays + JSON parsing
- **Phase 2**: 🚧 Branching (if/else, while) - Ready to implement
- **Published**: ✅ npm package `cvm-server` v0.2.7

## Key Concepts
CVM is a deterministic bytecode VM that integrates AI cognitive operations:
- Programs pause at `CC()` instructions for AI processing
- State persists between cognitive calls
- Claude drives execution by polling for tasks
- Storage abstraction supports MongoDB or file system

## Development Guidelines
- **STRICT TDD**: Write tests first, always
- **TypeScript ES Modules**: Use .js imports
- **NX Commands**: All builds via `npx nx`
- **Context Stack**: For control flow (Phase 2)