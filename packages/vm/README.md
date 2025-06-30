# @cvm/vm

The core execution engine for CVM. This package contains the virtual machine that executes bytecode, manages state, and orchestrates the pause/resume cycle for cognitive checkpoints.

## Overview

This package provides:
- **VM**: The bytecode interpreter that executes instructions
- **VM Manager**: High-level orchestration and state management
- **Heap**: Reference type management for arrays and objects
- **Handlers**: Opcode implementations using the handler pattern
- **File System**: Sandboxed file operations

## Architecture

```
VM Manager (orchestration)
     ├── VM (execution engine)
     │    ├── Handlers (opcode implementations)
     │    └── Heap (reference types)
     ├── Storage (persistence)
     └── File System (sandboxed I/O)
```

## Core Components

### VM (vm.ts)

The execution engine that:
- Maintains execution state (PC, stack, variables)
- Executes bytecode instructions
- Pauses at CC() calls
- Manages the heap for reference types

```typescript
interface VMState {
  pc: number;                    // Program counter
  stack: CVMValue[];            // Execution stack
  variables: Map<string, CVMValue>;  // Variable storage
  status: VMStatus;             // running | waiting_cc | complete | error
  output: string[];             // Console output
  ccPrompt?: string;            // Current CC() prompt
  heap: VMHeap;                 // Reference type storage
  iterators: IteratorContext[]; // For-of loop state
}
```

### VM Manager (vm-manager.ts)

High-level API that:
- Compiles source code to bytecode
- Manages program and execution lifecycle
- Handles state persistence and restoration
- Provides clean interface for MCP server

Key methods:
```typescript
// Program management
loadProgram(programId: string, source: string): Promise<void>
loadProgramFromFile(programId: string, filePath: string): Promise<void>

// Execution control
startExecution(programId: string, executionId: string): Promise<ExecutionResult>
getTask(executionId: string): Promise<{ prompt: string } | null>
submitResult(executionId: string, result: string): Promise<ExecutionResult>

// Status and management
getStatus(executionId: string): Promise<ExecutionStatus | null>
listExecutions(): Promise<ExecutionStatus[]>
deleteExecution(executionId: string): Promise<void>
```

### Heap (vm-heap.ts)

Manages reference types (arrays and objects):
- Allocates heap IDs for new arrays/objects
- Stores actual data in heap storage
- Enables proper reference semantics
- Handles serialization/deserialization

### Handlers

Opcode implementations organized by category:
- **Arithmetic**: ADD, SUB, MUL, DIV, MOD
- **Arrays**: ARRAY_NEW, ARRAY_PUSH, ARRAY_GET, ARRAY_SET
- **Objects**: OBJECT_NEW, OBJECT_GET, OBJECT_SET
- **Strings**: STRING_LEN, STRING_SPLIT, STRING_SLICE
- **Control**: JUMP, JUMP_IF, CALL, RETURN
- **Stack**: PUSH, POP, DUP, SWAP
- **Variables**: LOAD, STORE

Each handler implements:
```typescript
interface OpcodeHandler {
  stackIn: number;   // Required stack items
  stackOut: number;  // Items pushed to stack
  execute(state: VMState, instruction: Instruction): void;
}
```

## Execution Flow

1. **Start**: VM Manager loads program, creates VM instance
2. **Execute**: VM runs bytecode instructions sequentially
3. **CC() Hit**: VM pauses, saves state, returns prompt
4. **Wait**: External system (Claude) processes prompt
5. **Resume**: Result submitted, VM continues from saved state
6. **Complete**: Main function returns or error occurs

## Key Features

### State Preservation
- Complete VM state serialized between CC() calls
- Execution can resume after crashes
- Multiple concurrent executions supported

### Reference Types
- Arrays and objects stored in heap
- Proper JavaScript reference semantics
- Automatic garbage collection on completion

### Error Handling
- No exceptions thrown during execution
- Errors stored in state for inspection
- Graceful degradation

### Sandboxed I/O
- File operations limited to working directory
- No network access
- No system command execution

## Usage Example

```typescript
import { VMManager } from '@cvm/vm';
import { createStorageAdapter } from '@cvm/storage';

// Initialize
const storage = await createStorageAdapter();
const vmManager = new VMManager(storage);
await vmManager.initialize();

// Load program
await vmManager.loadProgram('counter', `
  function main() {
    var count = 0;
    while (count < 3) {
      var next = CC("Count is " + count + ". What's next?");
      count = +next;
    }
    return count;
  }
`);

// Start execution
const start = await vmManager.startExecution('counter', 'exec-1');
// Returns: { type: 'waiting', message: 'Count is 0. What's next?' }

// Submit result
const result1 = await vmManager.submitResult('exec-1', '1');
// Returns: { type: 'waiting', message: 'Count is 1. What's next?' }

// Continue...
const result2 = await vmManager.submitResult('exec-1', '2');
// Returns: { type: 'waiting', message: 'Count is 2. What's next?' }

const final = await vmManager.submitResult('exec-1', '3');
// Returns: { type: 'completed', result: 3 }
```

## Testing

The VM package has comprehensive test coverage (83.42%):

```bash
npx nx test vm
```

Test categories:
- Unit tests for each opcode handler
- Integration tests for complete programs
- Edge cases and error conditions
- Reference semantics validation
- State serialization/deserialization

## Dependencies

- **@cvm/parser**: For compiling source to bytecode
- **@cvm/types**: Core type definitions
- **@cvm/storage**: Persistence layer