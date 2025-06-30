# Active Context - CVM Project

## Current Status
✅ **State Management Complete** - Full control over programs and executions!

## Just Completed ✅ (June 23, 2025)

### 🔍 Execution Management Tools
- `list_executions()` - Lists all executions with current marked
- `get_execution(id?)` - Detailed info (uses current if no ID)
- `set_current(id)` - Sets default execution
- `delete_execution(id)` - Requires confirmation token

### 📦 Program Management Tools (NEW!)
- `list_programs()` - Lists all loaded programs
- `delete_program(id)` - Deletes program with confirmation
- `restart(programId, executionId?)` - Creates new execution & sets as current

**Key Features**:
- Auto-current: start/restart automatically sets execution as current
- All tools work without executionId when current is set
- Full test coverage (630+ tests passing)
- Published as v0.11.0

## What to Build Next (Updated Priority Order)

### 2. 🔄 Array Methods: map/filter/reduce (HIGH - 2-3 days)
**Why**: Essential for file list processing
```typescript
files.filter(f => f.endsWith('.ts')).map(f => CC("Analyze: " + f));
```

### 3. 🛡️ Error Handling: try/catch (MEDIUM - 3-4 days)
**Why**: Graceful failure handling
```typescript
try {
  const result = CC("Process: " + file);
} catch (e) {
  console.log("Skipped: " + file);
}
```

### Note: Task Metadata Postponed
After testing, keeping `getTask` simple (returns just prompt string) is the right design. Execution info available via `cvm_get_execution()`.

See memory-bank/priorities.md for complete analysis.

## Architecture Summary

### What CVM Is
- **Passive Task Engine**: Never pushes, only responds to Claude's queries
- **State Holder**: Maintains variables/position between CC() calls
- **Task Creator**: CC() creates TODOs for Claude

### What CVM Is NOT
- NOT a general programming language
- NOT for complex algorithms
- NOT for building applications

### VM Architecture (Complete ✅)
- **Handler Pattern**: All 51 opcodes use modular handlers
- **State Management**: Variables, stack, PC, iterators
- **Persistence**: Full state serialization for CC/FS operations
- **Type System**: Matches JavaScript semantics

## Technical Context
- **Published**: cvm-server v0.9.2 on npm
- **Test Coverage**: 594 tests (319 VM + 275 other)
- **Language Features**: See docs/API.md for complete reference
- **Sandbox Security**: CVM_SANDBOX_PATHS environment variable

## Key Files
- `/packages/vm/src/lib/handlers/` - All opcode implementations
- `/packages/parser/src/lib/compiler.ts` - AST → bytecode compiler
- `/packages/mcp-server/` - MCP interface for Claude
- `/test/examples/` - Usage examples

## Mission Reminder
Every feature must answer: **"Does this help Claude process many tasks systematically?"**

If it doesn't help with task orchestration → we don't build it.