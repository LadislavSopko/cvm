# @cvm/storage

Storage abstraction layer for CVM, providing persistent storage for programs and execution state. Supports multiple backends through a common interface.

## Overview

This package provides:
- **StorageAdapter Interface**: Common API for all storage backends
- **File Storage**: Local filesystem storage using JSON files
- **MongoDB Storage**: Scalable document-based storage
- **Storage Factory**: Automatic backend selection based on configuration

## Architecture

```
StorageAdapter (interface)
       ├── FileStorageAdapter
       └── MongoDBStorageAdapter
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

Default backend using local filesystem:
- Programs stored in `data/programs/`
- Executions stored in `data/executions/`
- Output stored in `data/outputs/`
- Metadata in `data/metadata.json`

```typescript
import { FileStorageAdapter } from '@cvm/storage';

const storage = new FileStorageAdapter('./cvm-data');
await storage.connect();
```

### MongoDB Storage

Scalable backend for production use:
- Programs in `programs` collection
- Executions in `executions` collection
- Output appended to execution documents
- Metadata in `metadata` collection

```typescript
import { MongoDBStorageAdapter } from '@cvm/storage';

const storage = new MongoDBStorageAdapter('mongodb://localhost:27017/cvm');
await storage.connect();
```

## Storage Factory

Automatically selects backend based on environment:

```typescript
import { createStorageAdapter } from '@cvm/storage';

// Uses MONGODB_URL env var if set, otherwise file storage
const storage = await createStorageAdapter();

// Or specify explicitly
const mongoStorage = await createStorageAdapter({ 
  mongoUrl: 'mongodb://localhost:27017/cvm' 
});

const fileStorage = await createStorageAdapter({ 
  dataDir: './my-data' 
});
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
import { createStorageAdapter } from '@cvm/storage';
import { Program, Execution } from '@cvm/types';

// Initialize storage
const storage = await createStorageAdapter();

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
- **mongodb**: MongoDB driver (optional, for MongoDB backend)