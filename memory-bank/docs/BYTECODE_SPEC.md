# CVM Bytecode Specification

## Instruction Format

```typescript
interface Instruction {
  op: OpCode;      // Operation code
  arg?: any;       // Optional argument
  line?: number;   // Source line for debugging
}
```

## Initial OpCodes (Version 1)

| OpCode | Value | Stack Effect | Description |
|--------|-------|--------------|-------------|
| PUSH   | 0x01  | → value      | Push constant onto stack |
| POP    | 0x02  | value →      | Remove top of stack |
| LOAD   | 0x03  | → value      | Load variable by name |
| STORE  | 0x04  | value →      | Store to variable |
| CONCAT | 0x05  | a, b → (a+b) | String concatenation |
| CC     | 0x06  | prompt → result | Cognitive call |
| PRINT  | 0x07  | value →      | Print value |
| HALT   | 0xFF  | -            | Stop execution |

## Future OpCodes

### Control Flow (Version 2)
| OpCode   | Value | Stack Effect | Description |
|----------|-------|--------------|-------------|
| JUMP     | 0x10  | →            | Jump to address |
| JUMP_IF  | 0x11  | cond →       | Jump if truthy |
| JUMP_IFN | 0x12  | cond →       | Jump if falsy |

### Comparison (Version 2)
| OpCode | Value | Stack Effect | Description |
|--------|-------|--------------|-------------|
| EQ     | 0x20  | a, b → bool  | Equal |
| NEQ    | 0x21  | a, b → bool  | Not equal |
| LT     | 0x22  | a, b → bool  | Less than |
| GT     | 0x23  | a, b → bool  | Greater than |

### Functions (Version 4)
| OpCode | Value | Stack Effect | Description |
|--------|-------|--------------|-------------|
| CALL   | 0x30  | args... → result | Call function |
| RETURN | 0x31  | value →      | Return from function |

### Collections (Version 5)
| OpCode    | Value | Stack Effect | Description |
|-----------|-------|--------------|-------------|
| ARRAY     | 0x40  | n, items... → array | Create array |
| MAP       | 0x41  | n, k,v... → map | Create map |
| GET_INDEX | 0x42  | arr, idx → value | Array access |
| SET_INDEX | 0x43  | arr, idx, val → arr | Array update |

## Compilation Examples

### Variable Assignment
Source: `let name = "John";`
```
PUSH "John"
STORE "name"
```

### String Concatenation  
Source: `let msg = "Hello " + name;`
```
PUSH "Hello "
LOAD "name"
CONCAT
STORE "msg"
```

### Cognitive Call
Source: `let result = CC("Analyze: " + data);`
```
PUSH "Analyze: "
LOAD "data"
CONCAT
CC
STORE "result"
```

### Print Statement
Source: `print("Result: " + result);`
```
PUSH "Result: "
LOAD "result"
CONCAT
PRINT
```

### Future: If Statement
Source: `if (result == "yes") { print("Urgent!"); }`
```
LOAD "result"
PUSH "yes"
EQ
JUMP_IFN 8    ; Skip if false
PUSH "Urgent!"
PRINT
; Address 8: continue
```

### Future: Function Call
Source: `let x = process(data);`
```
LOAD "data"
CALL "process"
STORE "x"
```

## Execution Rules

### Stack Operations
- Stack grows upward (push adds to top)
- Binary operations: pop b, pop a, push result
- All values are strings until type system added

### Variable Resolution
- Search current scope first
- Search parent scopes up to global
- Error if not found

### CC Instruction
1. Pop prompt from stack
2. Save VM state to MongoDB
3. Set status to 'waiting_cc'
4. Return prompt to MCP layer
5. On resume: push result, increment PC

### Jump Instructions
- Addresses are absolute (instruction index)
- Out of bounds = runtime error
- Conditional jumps pop condition

## Memory Model

### Stack
- Operand stack for computations
- Cleared between statements
- Size limit for safety

### Variables
- Stored in scope objects
- String keys, any values
- Persistent across CC calls

### Program
- Array of instructions
- Immutable during execution
- Stored in MongoDB

## State Persistence

VM state saved after each:
- CC instruction (before pause)
- Every N instructions (configurable)
- HALT instruction
- Runtime error

State includes:
- Program counter
- Stack contents
- All scopes
- Execution status
- Output buffer

## Error Conditions

| Error | Description |
|-------|-------------|
| STACK_UNDERFLOW | Pop from empty stack |
| UNDEFINED_VAR | Variable not found |
| INVALID_JUMP | Jump target out of bounds |
| CC_TIMEOUT | Cognitive operation timeout |
| STACK_OVERFLOW | Stack exceeds limit |

## Optimization Notes

Future optimizations (don't implement initially):
- Constant folding: `PUSH "a"`, `PUSH "b"`, `CONCAT` → `PUSH "ab"`
- Dead code elimination
- Common subexpression elimination

Keep VM simple and correct first.