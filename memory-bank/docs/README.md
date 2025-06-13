# CVM Simplified - Cognitive Virtual Machine

## Core Concept

CVM is a bytecode virtual machine that executes programs combining traditional control flow with AI cognitive operations. It uses MongoDB for state persistence and MCP protocol to communicate with Claude.

## Key Design Principles

1. **Single Cognitive Command**: `CC(prompt)` - returns string response
2. **Bytecode Execution**: Simple bytecode VM with pause/resume capability
3. **MongoDB State**: All state persisted to MongoDB between operations
4. **Production Foundation**: Built correctly from start, only add language features
5. **No Refactoring**: Architecture is permanent, only language evolves

## Architecture Overview

```
CVM Program (.ts) → Parser → Bytecode → VM Executor → MongoDB
                                             ↓
                                        [MCP Protocol]
                                             ↓
                                         Claude AI
```

## Minimal Language (Start)

```javascript
let email = "urgent message";
let response = CC("Is this urgent? " + email);
print(response);
```

## Future Language Features
- Control flow: `if`, `else`, `while`, `foreach`
- Functions with parameters
- Collections: arrays and maps
- File I/O operations

## Components

1. **Parser**: Converts source to bytecode
2. **VM**: Executes bytecode with pause/resume
3. **MongoDB**: Stores programs, state, execution history
4. **MCP Server**: Handles communication with Claude

## MongoDB Collections

- `programs`: Stored CVM programs
- `executions`: Active execution states
- `history`: Completed executions
- `logs`: Execution logs

## Quick Start

1. Build the VM with minimal instruction set
2. Implement MongoDB state persistence
3. Add MCP server for Claude communication
4. Test with simple programs
5. Incrementally add language features

See DEVELOPMENT_ROADMAP.md for implementation steps.