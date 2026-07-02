# @cvm/storage

Storage abstraction layer for CVM, providing persistent storage for programs and execution state. File storage is the only supported backend.

## Overview

This package provides:
- **StorageAdapter Interface**: Common API for storage backends
- **File Storage**: Local filesystem storage using JSON files
- **Storage Factory**: Zero-setup file storage instantiation

## Architecture

```
StorageAdapter (interface)
       └── FileStorageAdapter
```

## Storage Adapter Interface

All storage backends implement this common interface:

```typescript
interface StorageAdapter {
  // Lifecycle
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Programs
  saveProgram(program: Program): Promise<void>;
  getProgram(id: string): Promise<Program | null>;
  listPrograms(): Promise<Program[]>;
  deleteProgram(id: string): Promise<void>;
  
  // Executions
  saveExecution(execution: Execution): Promise<void>;
  getExecution(id: string): Promise<Execution | null>;
  listExecutions(): Promise<Execution[]>;
  deleteExecution(executionId: string): Promise<void>;
  
  // Output (separate from execution state)
  appendOutput(executionId: string, lines: string[]): Promise<void>;
  getOutput(executionId: string): Promise<string[]>;
  
  // Current execution context
  getCurrentExecutionId(): Promise<string | null>;
  setCurrentExecutionId(executionId: string | null): Promise<void>;
}
```

## Storage Backends

### File Storage

Only backend, using local filesystem:
- Programs stored in `data/programs/`
- Executions stored in `data/executions/`
- Output stored in `data/outputs/`
- Metadata in `data/metadata.json`

```typescript
import { FileStorageAdapter } from '@cvm/storage';

const storage = new FileStorageAdapter('./cvm-data');
await storage.connect();
```

## Storage Factory

Zero-setup file storage instantiation:

```typescript
import { StorageFactory } from '@cvm/storage';

// Defaults to file storage in .cvm/ (or CVM_DATA_DIR / CVM_STORAGE_TYPE env vars)
const storage = StorageFactory.create();

// Or specify explicitly
const storage = StorageFactory.create({ dataDir: './my-data' });
```

## Key Features

### Separation of Concerns
- **Execution State**: Core VM state (stack, variables, PC)
- **Output**: Console logs stored separately for efficiency
- **Metadata**: Current execution context

### Atomic Operations
- All saves are atomic (complete replacement)
- No partial updates or history tracking
- Simple and reliable

### Error Handling
- Connection errors throw immediately
- Operations fail gracefully with null returns
- No silent failures

## Usage Example

```typescript
import { StorageFactory } from '@cvm/storage';
import { Program, Execution } from '@cvm/types';

// Initialize storage
const storage = StorageFactory.create();
await storage.connect();

// Save a program
const program: Program = {
  id: 'hello-world',
  name: 'Hello World',
  source: 'function main() { return CC("Say hello"); }',
  bytecode: [...],
  created: new Date()
};
await storage.saveProgram(program);

// Create and save execution
const execution: Execution = {
  id: 'exec-123',
  programId: 'hello-world',
  state: 'RUNNING',
  pc: 0,
  stack: [],
  variables: {},
  created: new Date()
};
await storage.saveExecution(execution);

// Append output
await storage.appendOutput('exec-123', ['Starting execution...']);

// Set as current execution
await storage.setCurrentExecutionId('exec-123');
```

## Testing

Run tests:
```bash
npx nx test storage
```

## Dependencies

- **@cvm/types**: Core type definitions
