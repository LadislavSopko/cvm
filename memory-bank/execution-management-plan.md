# Execution Management Plan

## ✅ COMPLETED - June 23, 2025

All features from this plan have been successfully implemented with full test coverage.

## Overview
CVM needs execution management tools so Claude can:
- See all running/completed executions
- Work without tracking executionIds
- Know retry counts and execution history
- Clean up old executions

## Design Principles
1. **Keep `getTask` simple** - it returns just the prompt string
2. **Execution details separate** - available via `cvm_get_execution()`
3. **Current execution concept** - one execution is "current/default"
4. **Auto-management** - new executions automatically become current

## New MCP Tools

### 1. `cvm_list_executions()`
Returns array of all executions:
```json
[
  {
    "executionId": "analyze-files-1",
    "programId": "file-analyzer",
    "state": "AWAITING_COGNITIVE_RESULT",
    "created": "2025-01-23T10:00:00Z",
    "isCurrent": true,
    "summary": {
      "currentPrompt": "Analyze file: src/main.ts",
      "tasksCompleted": 15
    }
  },
  {
    "executionId": "test-run-2",
    "programId": "test-suite",
    "state": "COMPLETED",
    "created": "2025-01-22T14:00:00Z",
    "isCurrent": false,
    "summary": {
      "tasksCompleted": 50
    }
  }
]
```

### 2. `cvm_get_execution(executionId?)`
Get detailed execution info. If no ID provided, returns current execution.
```json
{
  "executionId": "analyze-files-1",
  "programId": "file-analyzer",
  "state": "AWAITING_COGNITIVE_RESULT",
  "created": "2025-01-23T10:00:00Z",
  "isCurrent": true,
  "currentTask": {
    "prompt": "Analyze file: src/main.ts",
    "attempts": 2,  // This is the retry count!
    "firstAttemptAt": "2025-01-23T10:05:00Z",
    "lastAttemptAt": "2025-01-23T10:07:00Z"
  },
  "variables": {
    "currentFile": "src/main.ts",
    "filesProcessed": 15
  },
  "stats": {
    "tasksCompleted": 15,
    "totalConsoleOutput": 45
  }
}
```

### 3. `cvm_set_current(executionId)`
Sets the current/default execution.
- Returns success/error
- Used by `getTask()` when no executionId provided

### 4. `cvm_delete_execution(executionId, confirmToken?)`
Deletes execution and all associated data.
- Cannot delete current execution
- First call returns confirmation token
- Second call with token performs deletion

## Enhanced Existing Tools

### `cvm_start(programId, executionId, options?)`
Enhancement: Automatically sets new execution as current
```typescript
options?: {
  setCurrent?: boolean  // Default: true
}
```

### `cvm_getTask(executionId?)`
Enhancement: Can omit executionId to use current
- If executionId provided: uses that execution
- If omitted: uses current execution
- Returns null if no current execution set

## Implementation Plan

### Phase 1: Core Tools (Day 1)
1. Add "current execution" tracking to storage
2. Implement `cvm_list_executions()`
3. Implement `cvm_get_execution()`
4. Implement `cvm_set_current()`

### Phase 2: Enhancements (Day 2)
1. Update `cvm_start()` to auto-set current
2. Update `cvm_getTask()` to use current
3. Add attempt tracking to executions

### Phase 3: Cleanup & Testing (Day 3)
1. Implement `cvm_delete_execution()`
2. Add comprehensive tests
3. Update documentation

## Storage Changes

### New Collection: `execution_metadata`
```typescript
{
  currentExecutionId: string | null,
  lastUpdated: Date
}
```

### Enhanced `executions` collection:
Add fields:
- `attempts`: Map of prompt → attempt count
- `firstTaskAt`: Date of first CC() call
- `lastTaskAt`: Date of most recent CC() call

## Example Usage

```typescript
// Claude's workflow without tracking IDs:

// Start new program (becomes current automatically)
cvm_start("analyzer", "exec-123")

// Get task - no ID needed!
cvm_getTask()  // "Analyze file: foo.ts"

// Want more info? Check execution details
cvm_get_execution()  // Shows attempts: 2

// Submit result
cvm_submitTask("exec-123", "Analysis complete")

// Check all executions
cvm_list_executions()

// Switch to different execution
cvm_set_current("other-exec")

// Clean up old ones
cvm_delete_execution("old-exec")
```

## Benefits
1. Claude doesn't need to track executionIds constantly
2. Full visibility into retry attempts
3. Easy switching between multiple programs
4. Clean execution lifecycle management
5. Maintains simplicity of `getTask()` returning just strings