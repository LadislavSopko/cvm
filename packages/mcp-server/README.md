# @cvm/mcp-server

MCP (Model Context Protocol) server implementation for CVM. This package provides the interface between Claude and the CVM execution engine through MCP tools.

## Overview

This package provides:
- **MCP Server**: Thin interface layer exposing CVM as MCP tools
- **Tool Definitions**: All CVM operations as MCP-compliant tools
- **Transport Layer**: Communication with Claude Desktop

## Architecture

```
Claude Desktop
      ↓ (MCP Protocol)
CVMMcpServer (this package)
      ↓ (Direct calls)
VMManager (@cvm/vm)
      ↓
Storage + VM Engine
```

## MCP Tools Exposed

### Program Management

#### `load`
Load a program from source code.
```typescript
Parameters:
- programId: string  // Unique identifier for the program
- source: string     // CVM source code

Returns: Success/error message
```

#### `loadFile`
Load a program from a file.
```typescript
Parameters:
- programId: string  // Unique identifier for the program
- filePath: string   // Path to .ts file

Returns: Success/error message
```

#### `list_programs`
List all loaded programs.
```typescript
Returns: Array of program summaries with id, name, created date
```

#### `delete_program`
Delete a program (requires confirmation).
```typescript
Parameters:
- programId: string           // Program to delete
- confirmToken?: string       // Confirmation token from previous call

Returns: Confirmation request or success message
```

### Execution Management

#### `start`
Start a new execution of a program.
```typescript
Parameters:
- programId: string      // Program to execute
- executionId: string    // Unique execution identifier
- setCurrent?: boolean   // Set as current execution (default: true)

Returns: ExecutionResult (completed/waiting/error)
```

#### `getTask`
Get the current task for an execution (CC prompt).
```typescript
Parameters:
- executionId?: string   // Execution ID (uses current if not provided)

Returns: Current prompt or null if not waiting
```

#### `submitTask`
Submit result for a waiting task.
```typescript
Parameters:
- result: string         // Result to submit
- executionId?: string   // Execution ID (uses current if not provided)

Returns: ExecutionResult (completed/waiting/error)
```

#### `status`
Get execution status and state.
```typescript
Parameters:
- executionId?: string   // Execution ID (uses current if not provided)

Returns: Full execution state including PC, stack, variables
```

#### `list_executions`
List all executions.
```typescript
Returns: Array of execution summaries
```

#### `get_execution`
Get detailed execution information.
```typescript
Parameters:
- executionId: string

Returns: Detailed execution state and output
```

#### `set_current`
Set the current execution context.
```typescript
Parameters:
- executionId: string

Returns: Success message
```

#### `delete_execution`
Delete an execution (requires confirmation).
```typescript
Parameters:
- executionId: string
- confirmToken?: string

Returns: Confirmation request or success message
```

#### `restart`
Restart a program (creates new execution).
```typescript
Parameters:
- programId: string
- executionId?: string   // Current execution to base on

Returns: New execution started message
```

## Key Design Decisions

### Thin Interface Layer
- MCP server is purely an interface adapter
- All business logic in VMManager
- No state maintained in MCP layer

### Current Execution Context
- Maintains "current execution" for convenience
- Most tools default to current if executionId not provided
- Reduces need to pass executionId repeatedly

### Confirmation Pattern
- Destructive operations require confirmation
- First call returns token, second call with token executes
- Prevents accidental deletions

### Error Handling
- All errors returned as MCP error responses
- No exceptions bubble up to transport layer
- Clear error messages for debugging

## Usage Flow

1. **Load Program**: `load` or `loadFile`
2. **Start Execution**: `start` with unique executionId
3. **Get Task**: `getTask` returns CC prompt
4. **Submit Result**: `submitTask` with cognitive result
5. **Repeat**: Steps 3-4 until execution completes
6. **Check Status**: `status` to inspect state anytime

## Testing

Run tests:
```bash
npx nx test mcp-server
```

Tests cover:
- All tool implementations
- Error handling
- Current execution management
- Confirmation patterns

## Dependencies

- **@cvm/vm**: Core VM and VMManager
- **@cvm/parser**: For compilation (via VMManager)
- **@modelcontextprotocol/sdk**: MCP protocol implementation
- **zod**: Schema validation for tool parameters