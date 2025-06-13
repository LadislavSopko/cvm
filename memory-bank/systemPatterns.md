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
1. **startExecution**: CVM begins execution until first CC or completion
2. **getNext (READ-ONLY)**: Claude polls CVM asking "what's next?" - just reads current state
3. **CVM Response**: Returns current state (running/waiting_cc/complete) with CC prompt if waiting
4. **reportCCResult**: Claude sends cognitive result, CVM resumes execution until next CC or completion
5. **Repeat**: Claude calls getNext again to check new state

Key insight: getNext is read-only, reportCCResult drives execution forward.

### Key Design Decisions

#### State Management
- Every VM state change persisted to MongoDB
- Execution can pause/resume across sessions
- Complete execution history maintained
- State includes: PC, stack, variables, output

#### Protocol Design
- MCP (Model Context Protocol) for AI communication
- JSON-RPC 2.0 over stdio
- Stateless requests (execution ID tracks state)
- Clear error codes and handling

#### Bytecode Design
- Stack-based VM (simpler than register-based)
- Minimal initial instruction set
- All values are strings (initially)
- CC instruction triggers cognitive interrupt

## Component Relationships

### Parser → Bytecode
- Recursive descent parser
- Direct bytecode emission
- Clear error messages with line numbers
- No intermediate AST (keep it simple)

### VM → MongoDB
- VMManager handles all persistence
- VMManager creates its own MongoDB connection from environment
- Uses MONGODB_URI from .env file
- State persisted after each instruction
- Lazy loading of program bytecode
- Execution document tracks all state
- History array for debugging
- VM itself remains pure execution engine
- VMManager.initialize() connects to database
- VMManager.dispose() cleans up connections

### MCP Server → VM
- Thin protocol layer that only calls VMManager
- Methods: loadProgram, startExecution, getNext, reportCCResult, getExecutionState
- No business logic in protocol layer
- No direct MongoDB access
- Clear separation of concerns
- VMManager encapsulates all execution and persistence logic

### Claude → MCP Server
- Claude drives the conversation
- Polls for next action using `cvm/getNext`
- Processes cognitive operations
- Reports results back

## Critical Implementation Paths

### Program Execution Path
```
loadProgram → Parse source → Store bytecode → Return program ID
     ↓
startExecution → Create execution state → Initialize VM → Return execution ID
     ↓
getNext → Load state → Execute until CC/complete → Save state → Return status
     ↓
reportCCResult → Load state → Push result → Mark as running → Save state
```

### State Persistence Path
```
Each instruction → Update VM state → Save to MongoDB → Continue/Pause
```

### Cognitive Interrupt Path
```
CC instruction → Save state with prompt → Return waiting_cc → Claude processes → Report result → Resume
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

## Security Patterns

### Sandboxing
- No file system access (initially)
- No network access
- No system calls
- Pure computation only

### Resource Limits
- Maximum stack depth
- Maximum execution steps
- Maximum output buffer
- CC operation timeouts

### Input Validation
- Sanitize all inputs
- Validate program size
- Check instruction validity
- Prevent injection attacks