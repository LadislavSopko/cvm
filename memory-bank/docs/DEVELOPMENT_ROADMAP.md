# CVM Development Roadmap

## Phase 1: Core Foundation

### 1.1 Project Setup
- Initialize Node.js project with TypeScript
- Setup MongoDB connection
- Configure testing framework (Vitest)
- Setup MCP protocol handler skeleton

### 1.2 Define Core Types
```typescript
// Bytecode types
enum OpCode { PUSH, POP, LOAD, STORE, CONCAT, CC, PRINT, HALT }
interface Instruction { op: OpCode; arg?: any; line?: number }

// VM types  
interface VMState { pc, stack, scopes, status, output }
interface Scope { variables: Map<string, any> }
type VMStatus = 'running' | 'waiting_cc' | 'complete' | 'error'
```

### 1.3 Implement Basic VM
- VM executor with instruction fetch-decode-execute loop
- Stack operations (PUSH, POP)
- Variable operations (LOAD, STORE)
- String concatenation (CONCAT)
- Print operation (PRINT)
- Halt operation (HALT)

### 1.4 Add MongoDB State Persistence
- Connect to MongoDB
- Implement state save/load functions
- Save state after each instruction (initially)
- Test state recovery after restart

### 1.5 Implement CC Operation
- CC instruction pauses execution
- Save state with 'waiting_cc' status
- Return prompt to caller
- Implement resume with CC result

### 1.6 Build Minimal Parser
- Tokenizer for basic tokens
- Recursive descent parser
- Support: let, =, strings, +, CC(), print(), identifiers
- Generate bytecode from AST

### 1.7 Create MCP Server
- JSON-RPC 2.0 handler
- Methods: loadProgram, startExecution, getNext, reportCCResult
- Connect VM to MCP protocol
- Test with mock Claude responses

### 1.8 Integration Test
- Parse simple program
- Execute with CC call
- Pause and resume
- Verify output

**Milestone: Can execute `let x = CC("prompt"); print(x);`**

## Phase 2: Control Flow

### 2.1 Add Comparison Operations
- Implement EQ, NEQ opcodes
- Add comparison to parser
- String equality comparison

### 2.2 Implement If Statement
- Add JUMP, JUMP_IF opcodes to VM
- Parse if/else statements
- Generate correct jump addresses
- Handle nested if statements

### 2.3 Add Logical Operations
- Implement AND, OR, NOT opcodes
- Parse &&, ||, ! operators
- Short-circuit evaluation

**Milestone: Can execute conditional CC calls**

## Phase 3: Loops

### 3.1 Implement While Loop
- Parse while statements
- Generate loop bytecode with jumps
- Test infinite loop protection

### 3.2 Implement Foreach Loop
- Design iteration mechanism
- Add ITERATE opcode
- Parse foreach syntax
- Handle collection iteration

### 3.3 Add Break/Continue
- Implement BREAK, CONTINUE opcodes
- Track loop context
- Generate correct jump targets

**Milestone: Can process collections with CC calls**

## Phase 4: Functions

### 4.1 Function Declaration
- Parse function syntax
- Store functions in program
- Function table in bytecode

### 4.2 Function Calls
- Implement CALL, RETURN opcodes
- Parameter passing on stack
- Return value handling

### 4.3 Scope Management
- Push/pop scope on call/return
- Local variable storage
- Scope chain for variable lookup

### 4.4 Recursion Support
- Test recursive functions
- Stack overflow protection
- Tail call optimization (optional)

**Milestone: Modular programs with functions**

## Phase 5: Collections

### 5.1 Array Support
- Array literal parsing
- ARRAY opcode
- GET_INDEX, SET_INDEX operations
- Length property

### 5.2 Map Support
- Map literal parsing
- MAP opcode
- GET_PROP, SET_PROP operations
- Key iteration

### 5.3 Collection Operations
- Add to collection
- Remove from collection
- Contains check
- Collection iteration

**Milestone: Full data structure support**

## Phase 6: I/O Operations

### 6.1 File Operations
- LOAD_FILE opcode
- SAVE_FILE opcode
- JSON parsing/serialization
- Error handling

### 6.2 External Data
- HTTP requests (future)
- Database queries (future)
- API integrations (future)

## Phase 7: Developer Experience

### 7.1 Error Handling
- Line number tracking
- Stack traces
- Helpful error messages
- Error recovery

### 7.2 Debugging Support
- Step-through execution
- Breakpoints
- Variable inspection
- Execution history

### 7.3 Development Tools
- Syntax highlighting
- Program validator
- Performance profiler
- Test framework

## Testing Strategy

### Unit Tests (Each Phase)
- VM instruction tests
- Parser tests  
- State persistence tests
- MCP protocol tests

### Integration Tests
- End-to-end program execution
- CC interaction tests
- Error scenario tests
- State recovery tests

### Performance Tests
- Large program execution
- Many CC calls
- State size limits
- Concurrent executions

## Technical Decisions

### Parser
- Hand-written recursive descent (simple, debuggable)
- Clear error messages with line numbers
- Single-pass compilation

### VM Design
- Stack-based (simple, proven)
- String-only values initially
- Grow stack/heap as needed
- Clear instruction boundaries

### State Management
- MongoDB for everything
- Transaction support for consistency
- Batch writes for performance
- State snapshots for debugging

### MCP Integration
- Stateless protocol
- Clear command/response pattern
- Timeout handling
- Error propagation

## Success Metrics

### Phase 1 Complete When
- Basic programs execute
- CC calls work
- State persists
- MCP protocol functional

### Each Phase Complete When  
- All tests pass
- Documentation updated
- Integration tests pass
- No regression in previous features

## Risk Mitigation

### Technical Risks
- MongoDB performance → Batch operations
- Complex parser → Start simple, grow incrementally  
- State size → Implement limits and pagination
- CC latency → Async operation, progress indication

### Process Risks
- Feature creep → Stick to roadmap
- Refactoring temptation → Build right first time
- Testing shortcuts → TDD discipline
- Documentation lag → Update with code

## Next Steps After MVP

1. Performance optimization
2. Multi-tenant support
3. Web IDE
4. Program marketplace
5. Advanced debugging tools
6. Compilation to more efficient format
7. Distributed execution