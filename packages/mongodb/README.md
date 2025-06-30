# @cvm/mongodb

MongoDB adapter utilities for CVM. This package provides a simple MongoDB client wrapper used by the storage layer.

## Overview

This package provides:
- **MongoDBAdapter**: Basic MongoDB operations for programs and executions
- **Type Re-exports**: Convenience exports of Program and Execution types

## Purpose

This is a low-level utility package that:
- Wraps MongoDB driver functionality
- Provides typed collection access
- Handles connection management
- Ensures collections exist on connect

**Note**: This package is primarily used internally by `@cvm/storage`. Most users should use the storage package's `MongoDBStorageAdapter` instead of this package directly.

## Architecture

```
@cvm/storage (MongoDBStorageAdapter)
         ↓
@cvm/mongodb (MongoDBAdapter)
         ↓
mongodb driver
```

## API

### MongoDBAdapter

```typescript
class MongoDBAdapter {
  constructor(connectionString: string)
  
  // Connection management
  async connect(): Promise<void>
  async disconnect(): Promise<void>
  isConnected(): boolean
  
  // Collection info
  async getCollections(): Promise<string[]>
  
  // Program operations
  async saveProgram(program: Program): Promise<void>
  async getProgram(id: string): Promise<Program | null>
  
  // Execution operations  
  async saveExecution(execution: Execution): Promise<void>
  async getExecution(id: string): Promise<Execution | null>
}
```

## Usage

```typescript
import { MongoDBAdapter } from '@cvm/mongodb';

// Create adapter
const adapter = new MongoDBAdapter('mongodb://localhost:27017/cvm');

// Connect
await adapter.connect();

// Save a program
await adapter.saveProgram({
  id: 'hello-world',
  name: 'Hello World',
  source: '...',
  bytecode: [...],
  created: new Date()
});

// Get a program
const program = await adapter.getProgram('hello-world');

// Disconnect
await adapter.disconnect();
```

## Key Features

### Automatic Collection Creation
- Creates `programs` and `executions` collections if they don't exist
- Happens automatically on connect

### Database Name Extraction
- Extracts database name from connection string
- Falls back to 'cvm' if not specified

### Upsert Operations
- `saveProgram` and `saveExecution` use upsert
- Creates new or updates existing documents

### Type Safety
- Fully typed with TypeScript
- Uses types from `@cvm/types` package

## Relationship to Storage Package

The `@cvm/storage` package's `MongoDBStorageAdapter` uses this package internally but adds:
- Full `StorageAdapter` interface implementation
- Output management
- Metadata/current execution tracking
- Program listing and deletion
- Execution listing and deletion

Most users should use `@cvm/storage` instead of this package directly.

## Testing

Run tests:
```bash
npx nx test mongodb
```

## Dependencies

- **@cvm/types**: Core type definitions
- **mongodb**: MongoDB Node.js driver