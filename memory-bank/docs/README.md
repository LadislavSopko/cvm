# CVM Documentation

## Current & Accurate Documentation

These docs are verified to be current and aligned with the actual implementation:

### ✅ Essential Technical References
- **[ARCHITECTURE_UNDERSTANDING.md](ARCHITECTURE_UNDERSTANDING.md)** - How Parser → Compiler → VM works (CRITICAL - use this!)
- **[CVM_EXECUTION_MODEL.md](CVM_EXECUTION_MODEL.md)** - How CVM really works as AI-driven state machine (CRITICAL)
- **[INTEGRATION_TESTING.md](INTEGRATION_TESTING.md)** - How to rebuild and run integration tests (ESSENTIAL)
- **[MCP_PROTOCOL.md](MCP_PROTOCOL.md)** - Model Context Protocol implementation details

## Documentation Policy

Only the docs above exist - all outdated/incorrect documentation has been permanently removed to prevent misleading development. The Memory Bank now contains only current, accurate information.

## Current Project Status

For accurate, up-to-date information about what's implemented and what's next:

- **`../README.md`** - Project overview and current status
- **`../activeContext.md`** - Current work and immediate next steps  
- **`../progress.md`** - What's completed vs what's remaining
- **`/docs/API.md`** - Complete and current language reference

## Safe Development Practice

**ONLY use the 4 verified docs above** for technical implementation details. For everything else, refer to the main Memory Bank files or check the actual code implementation to avoid being misled by outdated information.

For test programs, simply check `test/programs/` directory - the programs are self-documenting.