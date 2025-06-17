# System Patterns - CVM Architecture

## Core Architecture

### Component Structure
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   CVM Parser    │────▶│    CVM VM        │────▶│    MongoDB      │
│  (Source→BC)    │     │  (Executor +     │     │  (Persistence)  │
└─────────────────┘     │   VMManager)     │     └─────────────────┘
                        └────────┬─────────┘
                                 │
                        ┌────────▼─────────┐
                        │   MCP Server     │
                        │  (Thin Interface │
                        │   JSON-RPC 2.0)  │
                        └────────┬─────────┘
                                 │
                        ┌────────▼─────────┐
                        │   Claude (AI)    │
                        │ Cognitive Driver │
                        └──────────────────┘

Dependency Direction: Parser → VM → MongoDB
                            └─→ Types ←─┘
                     MCP Server → VM
```

### Execution Pattern
1. **start**: CVM begins execution until first CC or completion
2. **getTask (READ-ONLY)**: Claude polls CVM asking "what's next?" - just reads current state
3. **CVM Response**: Returns current state (RUNNING/AWAITING_COGNITIVE_RESULT/COMPLETED) with CC prompt if waiting
4. **submitTask**: Claude sends cognitive result, CVM resumes execution until next CC or completion
5. **Repeat**: Claude calls getTask again to check new state

Key insight: getTask is read-only, submitTask drives execution forward.

### Key Design Decisions

#### State Management
- Every VM state change persisted to MongoDB
- Execution can pause/resume across sessions
- State includes: PC, stack, variables (output stored separately)
- Output persisted independently from state to prevent unbounded growth

#### Protocol Design
- MCP (Model Context Protocol) for AI communication
- JSON-RPC 2.0 over stdio
- Stateless requests (execution ID tracks state)
- Clear error codes and handling

#### Bytecode Design
- Stack-based VM (simpler than register-based)
- Extended instruction set with 30+ opcodes
- Type system: CVMValue supporting multiple types
- CC instruction triggers cognitive interrupt
- Array operations for collection handling
- Type checking and arithmetic operations

## Component Relationships

### Parser → Bytecode
- Recursive descent parser
- Direct bytecode emission
- Clear error messages with line numbers
- No intermediate AST (keep it simple)

### VM → Storage
- VMManager handles all persistence
- VMManager creates storage adapter (MongoDB or File)
- Uses MONGODB_URI from .env file for MongoDB
- State persisted after each instruction
- Output extracted and stored separately via appendOutput
- Lazy loading of program bytecode
- Execution document tracks state (without output)
- VM itself remains pure execution engine
- VMManager.initialize() connects to storage
- VMManager.dispose() cleans up connections

### MCP Server → VM
- Thin protocol layer that only calls VMManager
- Methods: load, start, getTask, submitTask, status
- No business logic in protocol layer
- No direct MongoDB access
- Clear separation of concerns
- VMManager encapsulates all execution and persistence logic

### Claude → MCP Server
- Claude drives the conversation
- Polls for next action using `cvm/getTask`
- Processes cognitive operations
- Reports results back

## Critical Implementation Paths

### Program Execution Path
```
load → Parse source → Store bytecode → Return program ID
     ↓
start → Create execution state → Initialize VM → Return execution ID
     ↓
getTask → Load state → Execute until CC/complete → Save state → Return status
     ↓
submitTask → Load state → Push result → Mark as running → Save state
```

### State Persistence Path
```
Each instruction → Update VM state → Save to MongoDB → Continue/Pause
```

### Cognitive Interrupt Path
```
CC instruction → Save state with prompt → Return AWAITING_COGNITIVE_RESULT → Claude processes → Report result → Resume
```

## Error Handling Patterns

### Parse Errors
- Stop immediately
- Return line/column info
- Show problematic code
- Clear error message

### Runtime Errors
- Save error state
- Mark execution as failed
- Preserve stack trace
- Allow debugging via state

### Protocol Errors
- Standard JSON-RPC error codes
- Additional CVM-specific codes
- Detailed error data
- Never crash the server

## Type System

### CVMValue Design
- **Union Type**: `string | number | boolean | CVMArray | null`
- **Type Guards**: Runtime type checking functions (isCVMString, isCVMNumber, etc.)
- **Type Conversion**: Explicit conversion helpers (cvmToString, cvmToBoolean)
- **Arrays**: Objects with type discriminator pattern `{ type: 'array', elements: CVMValue[] }`

### Type Safety in VM
- Stack uses `CVMValue[]` instead of `any[]`
- All operations check types before execution
- Stack underflow checks on all pop operations
- Type mismatch errors with clear messages
- Consistent error handling pattern

### Type Coercion Rules
- Number → String: `toString()` for concatenation
- Boolean → String: `'true'` or `'false'`
- Null → String: `'null'`
- Array → String: `'[array:length]'`
- No implicit string → number conversion
- Truthiness: null/0/'' are false, arrays always true

### Implementation Notes (Phase 1 Complete)
- Type system implemented in `@cvm/types` package
- Compiler extends `compileExpression` to handle TypeScript AST nodes
- LOAD operation properly handles null values (no fallback to empty string)
- Full array syntax support: literals `[1,2,3]`, indexing `arr[0]`, methods `arr.push()`
- JSON.parse() returns CVMArray for valid array JSON, empty array for invalid/non-array
- 18 new tests added for array operations

## Security Patterns

### Sandboxing
- No file system access (initially)
- No network access
- No system calls
- Pure computation only

### Resource Limits
- Maximum stack depth
- Maximum execution steps
- Output stored separately (no buffer limits in state)
- CC operation timeouts

### Input Validation
- Sanitize all inputs
- Validate program size
- Check instruction validity
- Prevent injection attacks