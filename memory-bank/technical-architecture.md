# Technical Architecture

## System Overview

CVM consists of three main layers:

```
┌─────────────────────────────────────┐
│         MCP Server Layer            │  ← Claude interacts here
├─────────────────────────────────────┤
│         VM Manager Layer            │  ← Orchestration & state
├─────────────────────────────────────┤
│           VM Core Layer             │  ← Execution engine
└─────────────────────────────────────┘
```

## Core Components

### 1. VM Core (packages/cvm/src/vm.ts)
The execution engine that:
- Processes bytecode instructions
- Maintains execution state (PC, stack, variables, heap)
- Pauses at CC() calls
- Resumes with cognitive results

### 2. VM Manager (packages/cvm/src/vm-manager.ts)
High-level orchestration:
- Compiles source to bytecode
- Manages program storage
- Handles execution lifecycle
- Persists state between CC() calls
- Integrates with storage backends

### 3. MCP Server (apps/cvm-server)
Thin interface layer:
- Exposes CVM as MCP tools
- Maintains "current execution" context
- Handles error formatting
- Validates tool parameters

## Execution Flow

```
1. Load Program:
   Source Code → Parser → AST → Compiler → Bytecode → Storage

2. Execute Program:
   Start → Create VM → Execute Bytecode → Hit CC() → Pause & Save State
   
3. Handle CC():
   Claude polls getTask → Gets prompt → Processes → Submits result
   
4. Resume:
   Load State → Push result to stack → Continue execution → Next CC() or Complete
```

## State Management

### What Gets Persisted
- Program counter (PC)
- Stack contents
- Variables map
- Heap (arrays/objects)
- Output buffer
- Execution status

### Storage Adapters
- **File Storage**: JSON files in local directory
- **MongoDB**: Scalable document storage
- Interface allows custom adapters

## The Inversion Pattern

Traditional scripts are **active** - they call APIs and wait for responses.
CVM is **passive** - it waits for Claude to ask "what's next?"

This inversion enables:
- Perfect state preservation
- Transparent pause/resume
- External monitoring
- Crash recovery

## Key Design Decisions

1. **Custom Interpreter**: Not running native JS, but interpreting bytecode
   - Enables pause anywhere
   - Full control over execution
   - Deterministic behavior

2. **Heap for References**: Arrays/objects stored separately
   - Maintains JavaScript reference semantics
   - Enables proper serialization
   - Prevents reference loss

3. **Stateless MCP Tools**: Each tool call independent
   - No session state in server
   - All state in storage
   - Enables horizontal scaling

4. **CC() as Yield**: Not a function call but execution pause
   - Like async/await for cognitive tasks
   - State saved before pause
   - Result injected on resume