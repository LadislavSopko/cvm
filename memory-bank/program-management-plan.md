# Program Management Plan

## Overview
Following the successful execution management implementation, we need program management tools so Claude can:
- See all loaded programs
- Delete programs that are no longer needed
- Restart programs (create new execution with auto-set current)
- Manage the program lifecycle

## Design Principles
1. **Follow execution management patterns** - similar API design for consistency
2. **Confirmation for destructive actions** - delete requires token
3. **Auto-management** - restart automatically sets new execution as current
4. **Keep it simple** - programs are just { id, name, source, bytecode, created }

## New MCP Tools

### 1. `cvm_list_programs()`
Returns array of all programs:
```json
[
  {
    "programId": "file-analyzer",
    "name": "file-analyzer",
    "created": "2025-01-23T10:00:00Z",
    "hasActiveExecutions": true,
    "executionCount": 3
  },
  {
    "programId": "test-suite",
    "name": "test-suite", 
    "created": "2025-01-22T14:00:00Z",
    "hasActiveExecutions": false,
    "executionCount": 1
  }
]
```

### 2. `cvm_delete_program(programId, confirmToken?)`
Deletes program and optionally its executions.
- First call returns confirmation with warning if executions exist
- Second call with token performs deletion
- Option to keep executions (for audit/history)

```json
// First call response:
{
  "confirmationRequired": true,
  "message": "Program 'file-analyzer' has 3 executions. Delete program only or program and executions?",
  "token": "delete-file-analyzer-1234567890",
  "options": {
    "deleteExecutions": false  // default
  }
}
```

### 3. `cvm_restart(programId, executionId?)`
Creates new execution for existing program and sets as current.
- If executionId not provided, generates one
- Automatically sets as current execution
- Returns same as `cvm_start()`

```typescript
// Usage:
cvm_restart("file-analyzer")  // Auto-generates ID
cvm_restart("file-analyzer", "run-2")  // Custom ID
```

## Storage Changes

### Add to StorageAdapter interface:
```typescript
// Programs
listPrograms(): Promise<Program[]>;
deleteProgram(id: string): Promise<void>;
```

### Add execution counting helper:
```typescript
// Helper for program listing
countProgramExecutions(programId: string): Promise<number>;
hasProgramActiveExecutions(programId: string): Promise<boolean>;
```

## Implementation Steps (TDD)

### Phase 1: Storage Layer Tests
1. Write tests for `listPrograms()` in storage adapter test
2. Write tests for `deleteProgram()` in storage adapter test
3. Implement in MongoDB adapter
4. Implement in file adapter

### Phase 2: VMManager Tests
1. Write tests for VMManager wrapper methods
2. Implement `listPrograms()` wrapper
3. Implement `deleteProgram()` wrapper
4. Add `restartExecution()` method

### Phase 3: MCP Tools Tests
1. Write tests for `list_programs` tool
2. Write tests for `delete_program` tool
3. Write tests for `restart` tool
4. Implement all three tools

### Phase 4: Integration Tests
1. Test full flow: load → list → restart → delete
2. Test edge cases (delete with active executions)
3. Test confirmation token flow

## Test Examples

### Storage Adapter Tests
```typescript
describe('Program Management', () => {
  it('should list all programs', async () => {
    await adapter.saveProgram({ id: 'prog1', ... });
    await adapter.saveProgram({ id: 'prog2', ... });
    
    const programs = await adapter.listPrograms();
    expect(programs).toHaveLength(2);
    expect(programs[0].id).toBe('prog1');
  });

  it('should delete program', async () => {
    await adapter.saveProgram({ id: 'prog1', ... });
    await adapter.deleteProgram('prog1');
    
    const program = await adapter.getProgram('prog1');
    expect(program).toBeNull();
  });
});
```

### MCP Tool Tests
```typescript
describe('restart tool', () => {
  it('should create new execution and set as current', async () => {
    await loadProgram('counter', 'let x = 0; function main() { x++; }');
    
    const result = await mcp.restart({ programId: 'counter' });
    
    expect(result).toContain('Execution started');
    expect(result).toContain('(set as current)');
    
    const current = await vmManager.getCurrentExecutionId();
    expect(current).toBeDefined();
  });
});
```

## Benefits
1. Complete program lifecycle management
2. Easy cleanup of old programs
3. Quick restart for debugging/testing
4. Consistent with execution management patterns
5. Maintains CVM's mission of task orchestration