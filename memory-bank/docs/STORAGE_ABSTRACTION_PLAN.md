# Storage Abstraction Plan

## Current State Analysis

### Existing MongoDB Operations
Based on studying the current implementation, the storage layer performs these operations:

1. **Connection Management**
   - `connect()`: Establish connection to storage
   - `disconnect()`: Close connection
   - `isConnected()`: Check connection status

2. **Program Operations**
   - `saveProgram(program: Program)`: Store compiled program
   - `getProgram(id: string)`: Retrieve program by ID

3. **Execution Operations**
   - `saveExecution(execution: Execution)`: Store/update execution state
   - `getExecution(id: string)`: Retrieve execution state

4. **History Operations**
   - `saveHistory(history: History)`: Append history entry
   - `getHistory(executionId: string)`: Get all history for an execution

### Data Structures
From `@cvm/types`:
- **Program**: id, name, source, bytecode, created, updated
- **Execution**: id, programId, state, pc, stack, variables, output, error, created, updated
- **History**: executionId, step, pc, instruction, stack, variables, timestamp

### Current Usage Pattern
VMManager creates its own MongoDB connection from environment (`MONGODB_URI`).

## Proposed Storage Abstraction

### Interface Design
```typescript
interface StorageAdapter {
  // Lifecycle
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Programs
  saveProgram(program: Program): Promise<void>;
  getProgram(id: string): Promise<Program | null>;
  
  // Executions
  saveExecution(execution: Execution): Promise<void>;
  getExecution(id: string): Promise<Execution | null>;
  
  // History
  saveHistory(history: History): Promise<void>;
  getHistory(executionId: string): Promise<History[]>;
}
```

### Implementation Plan

1. **Create Storage Package** (`@cvm/storage`)
   - Define StorageAdapter interface
   - Move MongoDB adapter here
   - Implement FileStorageAdapter

2. **FileStorageAdapter Design**
   - Storage location: `~/.cvm/` (or configurable via `CVM_DATA_DIR`)
   - Structure:
     ```
     ~/.cvm/
     ├── programs/
     │   └── {id}.json
     ├── executions/
     │   └── {id}.json
     └── history/
         └── {executionId}/
             └── {timestamp}-{step}.json
     ```
   - Use atomicWrite for data integrity
   - JSON format for human readability

3. **Configuration**
   - Environment variable: `CVM_STORAGE_TYPE` (file | mongodb)
   - Default to 'file' for easier onboarding
   - MongoDB config remains in `MONGODB_URI`
   - File storage config in `CVM_DATA_DIR` (default: ~/.cvm)

4. **Migration Path**
   - VMManager accepts StorageAdapter in constructor
   - Factory function creates appropriate adapter based on config
   - Existing MongoDB functionality unchanged

## TDD Implementation Steps

1. **Create @cvm/storage package**
   - Set up new NX library
   - Define StorageAdapter interface
   - Write interface compliance tests

2. **Move MongoDBAdapter**
   - Move from @cvm/mongodb to @cvm/storage
   - Ensure it implements StorageAdapter interface
   - Keep all existing tests

3. **Implement FileStorageAdapter (TDD)**
   - Test: Should create directory structure on connect
   - Test: Should save/load programs
   - Test: Should save/load executions
   - Test: Should append/retrieve history
   - Test: Should handle concurrent writes safely
   - Test: Should handle missing files gracefully

4. **Create StorageFactory**
   - Test: Should create FileStorageAdapter when type='file'
   - Test: Should create MongoDBAdapter when type='mongodb'
   - Test: Should default to file storage
   - Test: Should validate configuration

5. **Update VMManager**
   - Test: Should work with any StorageAdapter
   - Test: Should maintain backward compatibility
   - Refactor to use injected adapter

## Benefits

1. **Zero Setup**: New users can try CVM without MongoDB
2. **Portable**: `.cvm` directory can be copied/shared
3. **Debuggable**: JSON files are human-readable
4. **Flexible**: Easy to add new storage backends
5. **Clean Architecture**: Better separation of concerns

## Notes from Current Code

- MongoDB adapter has minimal interface - just 6 core methods
- Types extend MongoDB Document but this can be abstracted
- VMManager creates its own adapter - need to change to injection
- History is append-only, perfect for file storage
- No complex queries needed - all lookups by ID