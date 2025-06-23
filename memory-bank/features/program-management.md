# Program Management Features

## Overview
Completed June 23, 2025 - Full program lifecycle management tools

## New MCP Tools

### `list_programs()`
Lists all loaded programs with their metadata:
```json
[
  {
    "programId": "file-analyzer",
    "name": "file-analyzer",
    "created": "2025-01-23T10:00:00Z"
  }
]
```

### `delete_program(programId, confirmToken?)`
Deletes a program (requires confirmation):
- First call returns confirmation token
- Second call with token performs deletion
- Safe deletion with token validation

### `restart(programId, executionId?)`
Creates new execution and sets as current:
- Auto-generates executionId if not provided
- Always sets new execution as current
- Returns executionId for reference

## Storage Implementation
- Added to StorageAdapter interface
- Implemented in MongoDB adapter
- Implemented in file adapter
- Full test coverage

## VMManager Methods
- `listPrograms()` - wrapper for storage
- `deleteProgram()` - wrapper for storage
- `restartExecution()` - creates new execution + sets current

## Usage Examples

```typescript
// List all programs
const programs = await cvm.list_programs();

// Restart a program (auto-sets as current)
await cvm.restart("counter-app");

// Now getTask works without executionId
const task = await cvm.getTask();

// Delete old program
const result = await cvm.delete_program("old-prog");
// Returns: { token: "delete-old-prog-123456" }

// Confirm deletion
await cvm.delete_program("old-prog", "delete-old-prog-123456");
```

## Benefits
1. Complete program lifecycle management
2. Easy restart for debugging/testing
3. Clean up unused programs
4. Consistent with execution management patterns
5. Auto-current on restart for seamless workflow