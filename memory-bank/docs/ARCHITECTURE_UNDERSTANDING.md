# CVM Architecture Understanding

## What is CVM?

CVM (Cognitive Virtual Machine) is an **algorithmic TODO manager for Claude**. It inverts the traditional AI integration pattern - instead of your code calling AI, CVM creates a stateful TODO list that Claude works through systematically.

**Key insight**: CVM is a passive state machine. It never pushes tasks to Claude. Instead, Claude pulls tasks when ready, maintaining perfect control while CVM quietly manages state between requests.

## Project Organization

CVM is organized as an Nx monorepo with clear package boundaries:

```
cvm/
├── packages/          # Core libraries
│   ├── parser/       # TypeScript → Bytecode compiler
│   ├── types/        # Shared type definitions
│   ├── storage/      # Persistence abstraction
│   ├── vm/           # Execution engine
│   ├── mcp-server/   # MCP protocol interface
│   ├── mongodb/      # MongoDB utilities
│   └── integration/  # Integration tests
│
├── apps/             # Executable applications
│   └── cvm-server/   # npm package users install
│
└── memory-bank/      # Project documentation
    └── docs/         # Technical documentation
```

## Architecture Layers

```
┌─────────────────────────────────────────┐
│      Claude Desktop (MCP Client)        │
├─────────────────────────────────────────┤
│    cvm-server app (stdio transport)     │  ← apps/cvm-server/README.md
├─────────────────────────────────────────┤
│   MCP Server (protocol interface)       │  ← packages/mcp-server/README.md
├─────────────────────────────────────────┤
│     VM Manager (orchestration)          │  ← packages/vm/README.md
├─────────────────────────────────────────┤
│  Parser → Compiler → VM → Storage       │  ← Individual package READMEs
└─────────────────────────────────────────┘
```

## Core Packages

### 1. Parser Package
**Location**: `packages/parser/` ([README](../../../packages/parser/README.md))
- Transforms TypeScript-like source into bytecode
- Uses TypeScript compiler API for parsing
- Implements visitor pattern for compilation
- No runtime dependencies

### 2. Types Package  
**Location**: `packages/types/` ([README](../../../packages/types/README.md))
- Defines CVM's value system (primitives, arrays, objects)
- Core interfaces: Program, Execution
- Type guards for runtime safety
- Foundation for all other packages

### 3. Storage Package
**Location**: `packages/storage/` ([README](../../../packages/storage/README.md))
- Abstraction layer for persistence
- File and MongoDB backends
- Manages programs, executions, and output
- Storage adapter interface pattern

### 4. VM Package
**Location**: `packages/vm/` ([README](../../../packages/vm/README.md))
- Core execution engine
- Stack-based bytecode interpreter
- Heap management for reference types
- Handler pattern for opcodes
- Pause/resume at CC() calls

### 5. MCP Server Package
**Location**: `packages/mcp-server/` ([README](../../../packages/mcp-server/README.md))
- MCP protocol implementation
- Exposes CVM as MCP tools
- Thin interface layer
- Current execution context

### 6. MongoDB Package
**Location**: `packages/mongodb/` ([README](../../../packages/mongodb/README.md))
- Low-level MongoDB utilities
- Used by storage package
- Simple wrapper around driver

## The Application

### CVM Server
**Location**: `apps/cvm-server/` ([README](../../../apps/cvm-server/README.md))
- The npm package users install
- Configuration management
- Logging and monitoring
- Graceful shutdown handling

## How It All Works Together

1. **User installs** `cvm-server` via npm
2. **Claude Desktop** launches it as MCP server
3. **cvm-server** creates CVMMcpServer instance
4. **CVMMcpServer** exposes MCP tools to Claude
5. **Claude** loads programs and starts executions
6. **VMManager** compiles code and manages state
7. **VM** executes bytecode until CC() pause
8. **Storage** persists state between calls
9. **Claude** pulls tasks and submits results
10. **Cycle repeats** until execution completes

## Key Design Principles

### 1. Inversion of Control
- CVM is passive - it waits for Claude to ask
- Claude drives execution by pulling tasks
- State lives in CVM, not Claude's context

### 2. Clean Architecture
- Each package has single responsibility
- Dependencies flow inward
- Interfaces define boundaries
- No circular dependencies

### 3. State Preservation
- All state serializable to JSON
- Execution can resume after crashes
- Multiple concurrent executions supported

### 4. Error Handling
- Operations return success/failure
- No exceptions thrown
- Errors stored in state
- Graceful degradation

## Development Workflow

1. **Read Memory Bank** first for context
2. **Check package README** for detailed info
3. **Run tests** with `npx nx test <package>`
4. **Build** with `npx nx build <package>`
5. **Test locally** with Claude Desktop

## Quick Navigation

- **What does X package do?** → Check `packages/X/README.md`
- **How do opcodes work?** → See `packages/vm/README.md`
- **What's the bytecode format?** → See `packages/parser/README.md`
- **How is state stored?** → See `packages/storage/README.md`
- **What MCP tools exist?** → See `packages/mcp-server/README.md`
- **How to configure?** → See `apps/cvm-server/README.md`

## Testing Strategy

- **Unit tests**: Each package tested independently
- **Integration tests**: `packages/integration/` for cross-package
- **Coverage target**: 85%+ for core packages
- **Test runner**: Vitest with Nx integration

This architecture enables CVM to be a reliable, passive orchestrator that helps Claude work through complex tasks systematically without losing context.