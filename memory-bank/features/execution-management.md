# Execution Management Feature

*Completed: June 23, 2025*

## Overview
CVM now includes comprehensive execution management tools that allow Claude to work without constantly tracking execution IDs.

## New MCP Tools

### `cvm_list_executions()`
Lists all executions with their status and marks which one is current.

**Response format**:
```json
[
  {
    "executionId": "exec-1",
    "programId": "analyzer",
    "state": "AWAITING_COGNITIVE_RESULT",
    "created": "2025-01-23T10:00:00Z",
    "isCurrent": true,
    "summary": {
      "currentPrompt": "Analyze file: src/main.ts",
      "tasksCompleted": 0
    }
  }
]
```

### `cvm_get_execution(executionId?)`
Gets detailed execution information. If no ID provided, uses current execution.

**Response includes**:
- Execution state and variables
- Current task with attempt count
- Timestamps for tracking duration

### `cvm_set_current(executionId)`
Sets the current/default execution that other tools will use.

### `cvm_delete_execution(executionId, confirmToken?)`
Deletes an execution. Requires confirmation token for safety.

## Enhanced Existing Tools

### `cvm_start(programId, executionId, setCurrent?)`
- Now automatically sets new execution as current (default behavior)
- Can disable with `setCurrent: false`

### `cvm_getTask(executionId?)`, `cvm_submitTask(executionId?, result)`, `cvm_status(executionId?)`
- All now work without executionId - they use the current execution
- Returns helpful message if no current execution is set

## Example Workflow

```typescript
// Start program - automatically becomes current
cvm_start("analyzer", "exec-123")

// Get task - no ID needed!
cvm_getTask()  // Returns: "Analyze file: foo.ts"

// Check execution details
cvm_get_execution()  // Shows attempts, variables, etc.

// Submit result
cvm_submitTask(result: "Analysis complete")

// List all executions
cvm_list_executions()

// Switch to different execution
cvm_set_current("other-exec")

// Clean up old execution
cvm_delete_execution("old-exec")
```

## Implementation Details

### Storage Layer
- Added metadata collection/file for tracking current execution
- New methods: listExecutions, getCurrentExecutionId, setCurrentExecutionId, deleteExecution
- Both MongoDB and File adapters fully implemented

### Testing
- 26 new tests covering all scenarios
- Tests verify current execution behavior
- Confirmation token validation for deletions

## Benefits
1. **Simplified Claude workflow** - no need to track execution IDs
2. **Better visibility** - see all executions at a glance
3. **Easy switching** - change between multiple running programs
4. **Clean lifecycle** - delete old executions when done
5. **Backwards compatible** - can still use explicit execution IDs