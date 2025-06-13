# CVM Architecture

## System Components

### 1. Parser
- Input: Source code string
- Output: Array of bytecode instructions
- Approach: Recursive descent parser
- Error handling: Clear syntax error messages

### 2. Bytecode Format
```typescript
interface Instruction {
  op: OpCode;
  arg?: any;
  line?: number;  // Source line for debugging
}

enum OpCode {
  // Stack
  PUSH,      // Push constant
  POP,       // Pop value
  
  // Variables  
  LOAD,      // Load variable
  STORE,     // Store variable
  
  // Operations
  CONCAT,    // String concatenation
  
  // Control
  JUMP,      // Unconditional jump
  JUMP_IF,   // Jump if true
  
  // Functions
  CALL,      // Call function
  RETURN,    // Return from function
  
  // Cognitive
  CC,        // Cognitive call
  
  // I/O
  PRINT,     // Print output
  
  // System
  HALT       // End execution
}
```

### 3. Virtual Machine
```typescript
interface VMState {
  _id: string;           // Execution ID
  programId: string;     // Program reference
  pc: number;            // Program counter
  stack: any[];          // Operand stack
  scopes: Scope[];       // Scope stack
  status: VMStatus;      // Execution status
  ccWaiting?: CCWait;    // Cognitive operation waiting
  output: string[];      // Accumulated output
}

interface Scope {
  variables: Map<string, any>;
  returnAddress?: number;
  functionName?: string;
}

type VMStatus = 'running' | 'waiting_cc' | 'complete' | 'error';

interface CCWait {
  instructionId: number;
  prompt: string;
}
```

### 4. MongoDB Schema

**programs collection:**
```javascript
{
  _id: ObjectId,
  name: string,
  source: string,
  bytecode: Instruction[],
  created: Date,
  modified: Date
}
```

**executions collection:**
```javascript
{
  _id: ObjectId,
  programId: ObjectId,
  state: VMState,
  started: Date,
  lastModified: Date,
  history: [{
    timestamp: Date,
    event: string,
    details: any
  }]
}
```

### 5. MCP Server
- Protocol: JSON-RPC 2.0 over stdio
- Methods:
  - `cvm/loadProgram(name)`
  - `cvm/startExecution(programId)`
  - `cvm/continueExecution(executionId)`
  - `cvm/reportCCResult(executionId, result)`
  - `cvm/getState(executionId)`

## Execution Flow

1. **Load Program**
   - Parse source to bytecode
   - Store in MongoDB
   - Return program ID

2. **Start Execution**
   - Create execution state
   - Initialize scope with globals
   - Begin execution loop

3. **Execution Loop**
   - Fetch instruction at PC
   - Execute instruction
   - Update state in MongoDB
   - If CC instruction: pause and return prompt
   - If complete: mark as finished

4. **Resume from CC**
   - Load execution state
   - Push CC result to stack
   - Continue execution

## Scope Management

### Global Scope
- Always at index 0 in scopes array
- Contains top-level variables

### Function Scopes
- Pushed when entering function
- Contains parameters and local variables
- Stores return address
- Popped on return

### Variable Resolution
- Search from current scope upward
- Global variables accessible from any scope
- Local variables shadow globals

## Error Handling

### Parse Errors
- Line number and column
- Clear error message
- Show problematic code

### Runtime Errors
- Undefined variable
- Stack underflow
- Invalid operation
- Jump to invalid address

### CC Errors
- Timeout handling
- Invalid response handling
- Retry mechanism

## State Persistence

Every instruction execution:
1. Update VM state
2. Save to MongoDB
3. Continue or pause

Benefits:
- Survives crashes
- Debugging via MongoDB
- Execution history
- Multiple concurrent executions

## Performance Considerations

1. **Batch MongoDB Updates**: Update after N instructions
2. **Cache Current State**: Don't reload from DB each instruction
3. **Lazy Scope Creation**: Only create when needed
4. **String Interning**: Reuse common strings

## Security

1. **Sandboxed Execution**: No file system access initially
2. **Resource Limits**: Max stack size, execution steps
3. **Input Validation**: Sanitize CC prompts
4. **Access Control**: Program ownership and permissions