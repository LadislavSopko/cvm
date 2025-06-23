# Claude's Memory Bank - CVM Project

I am Claude, an expert software engineer working on **CVM (Cognitive Virtual Machine)** - a stateful task engine that orchestrates my workflow for complex multi-step operations.

## 🎯 CVM's Mission

**CVM is an algorithmic TODO manager for Claude.** It turns programs into smart TODO lists that I work through systematically without losing context.

### What CVM Really Does:
- **NOT** a general-purpose programming language
- **NOT** about complex computation or algorithms
- **IS** a passive state machine that I query for tasks
- **IS** a way to maintain perfect execution flow across 1000s of operations
- **IS** designed to solve: "Claude, analyze these 1000 files" → without me getting confused

### Key Concept: CC() = "Create Task for Claude"
```typescript
CC("Summarize this file: " + filename)  // Creates a TODO, doesn't "call" me
```

### Architecture:
```
Claude → asks "what's next?" → CVM gives task → Claude completes → repeat
```

## Project Status

### ✅ Core Features Complete (v0.9.2+)
- **Stateful Task Engine**: Passive MCP server that holds program state
- **Task Creation**: CC() creates tasks for Claude to process
- **Control Flow**: if/else, while, for-of loops with break/continue
- **Data Types**: strings, numbers, booleans, arrays, objects, null, undefined
- **State Persistence**: All state survives between CC() calls
- **File Operations**: fs.listFiles() for directory exploration
- **JSON Support**: Full JSON.parse/stringify for structured data
- **String Methods**: All essential string operations
- **Object Support**: Literals, property access, nested objects
- **Handler Architecture**: Clean modular VM (all 51 opcodes)
- **Execution Management**: List/get/set current/delete executions
- **Program Management**: List/delete programs, restart with auto-current (NEW!)

### 📊 Quality Metrics
- **Tests**: 630+ tests all passing
- **Published**: npm package `cvm-server` v0.11.0
- **Architecture**: 100% handler-based VM (no legacy code)
- **Latest**: Full state management tools (June 23, 2025)

## Next Priorities (Based on Mission)

### 1. 🔄 Array Methods (HIGHEST - 2-3 days)
- `array.map()`, `array.filter()`, `array.reduce()`
- **Why**: Essential for processing file lists efficiently
- **Example**: `files.filter(f => f.endsWith('.ts')).map(f => CC("Analyze: " + f))`

### 2. 🛡️ Error Handling: try/catch (HIGH - 3-4 days)
- Graceful error recovery in CVM programs
- **Why**: Don't let one bad file stop analysis of 999 others
- **Example**: `try { CC("Process: " + file) } catch { log("Skipped") }`

### 3. 💾 fs.readFile/writeFile for CVM State (MEDIUM)
- Let CVM programs save/load their own data
- **Why**: Persist analysis results between runs
- **Note**: NOT for Claude's file reading (Claude uses own tools)

## What Works Now

### Example: Multi-File Analysis
```typescript
function main() {
  const files = fs.listFiles("./src", { filter: "*.ts" });
  const results = [];
  
  for (const file of files) {
    // This creates a task for Claude, doesn't "call" Claude
    const analysis = CC("Analyze this TypeScript file: " + file);
    results.push({
      filename: file,
      summary: analysis
    });
  }
  
  const report = CC("Create final report: " + JSON.stringify(results));
  return report;
}
```

## Key Documentation
- **README.md** - Explains CVM's purpose and architecture
- **docs/API.md** - Complete language reference
- **activeContext.md** - Current work status
- **test/examples/cvm-ideas-from-blind-test.md** - Future enhancement ideas

## Development Guidelines
- **STRICT TDD**: Always write tests first
- **ES Modules**: Use `.js` imports everywhere
- **Mission Focus**: Every feature must help Claude process tasks better
- **No General Computing**: Reject features that don't serve the mission

## Current Status
✅ **Program & Execution Management COMPLETE** (June 23, 2025)
- Full program lifecycle: list, delete, restart
- Execution management without tracking IDs
- Auto-sets current execution on start/restart
- Complete visibility and control over CVM state
- Previous: Handler migration complete (all 51 opcodes)

## Recent History
- **June 23**: Program & Execution Management complete
- **v0.11.0**: Full state management tools (list/delete/restart programs)
- **v0.10.0**: Execution management (list/get/set/delete executions)
- **v0.9.2** (June 21): toString() + implicit main()
- **v0.9.0**: Full object support with CC persistence
- **v0.7.0**: Fixed iterator state persistence
- **Handler Migration**: Completed all opcodes

## Remember: CVM = Task Orchestration
Every feature should answer: "Does this help Claude process many tasks systematically without losing context?"