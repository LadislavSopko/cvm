# CVM Development Roadmap

## ✅ Phase 1: Core Foundation (COMPLETED)
- Basic VM with stack operations
- MongoDB/File persistence
- TypeScript parser using AST
- MCP server implementation
- Arrays and JSON parsing
- 118 tests passing

## 🚧 Phase 2: Control Flow (CURRENT)
- Comparison operations (EQ, NEQ, LT, GT)
- Jump instructions (JUMP, JUMP_IF_FALSE)
- If/else statements
- While loops
- Context stack for nested structures
- See PHASE2_IMPLEMENTATION_PLAN.md for details

## 📋 Phase 3: Iteration (PLANNED)
- Foreach loops
- Iterator state management
- Break/continue statements
- Collection iteration

## 📋 Phase 4: File Operations (PLANNED)
- Secure file listing (FS_LIST_FILES)
- Path sandboxing
- Glob pattern support
- Read-only operations

## 🔮 Future Phases
- **Phase 5**: Functions and scope
- **Phase 6**: Advanced collections (maps)
- **Phase 7**: Error handling (try/catch)
- **Phase 8**: Module system

## Success Metrics
Each phase complete when:
- All tests pass
- Documentation updated
- Integration tests pass
- No regression in previous features

## Technical Principles
- Single-pass compiler with backpatching
- Stack-based VM
- Persistent state between CC calls
- Clean separation of concerns
- STRICT TDD approach