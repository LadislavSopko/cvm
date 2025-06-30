# CVM Handler Architecture

## Overview

The CVM uses a handler pattern for executing bytecode instructions. Each opcode has a dedicated handler that implements the `OpcodeHandler` interface. This pattern provides modularity, type safety, and testability.

## Handler Interface

```typescript
interface OpcodeHandler {
  stackIn: number;   // Number of values popped from stack
  stackOut: number;  // Number of values pushed to stack
  execute: (state: VMState, instruction: Instruction) => void;
}
```

## Handler Organization

Handlers are organized by functionality in `packages/vm/src/lib/handlers/`:

### Core Operations
- **arithmetic.ts**: Mathematical operations (ADD, SUB, MUL, DIV, MOD)
- **comparison.ts**: Comparison operations (EQ, NEQ, LT, GT, LTE, GTE)
- **logical.ts**: Boolean operations (AND, OR, NOT)
- **increment.ts**: Increment/decrement operations (INC, DEC)

### Data Types
- **arrays.ts**: Array operations (ARRAY_NEW, ARRAY_PUSH, ARRAY_GET, ARRAY_SET)
- **objects.ts**: Object operations (OBJECT_NEW, OBJECT_SET)
- **strings.ts**: String operations (STRING_LEN, STRING_SPLIT, STRING_SLICE)
- **types.ts**: Type operations (TYPEOF, TO_STRING)

### Control Flow
- **control.ts**: Flow control (JUMP, JUMP_IF, JUMP_IF_FALSE, RETURN)
- **iterators.ts**: For-of loop support (ITER_START, ITER_NEXT, ITER_END)

### I/O and Variables
- **io.ts**: Input/output operations (CONSOLE_LOG, CALL for CC)
- **variables.ts**: Variable operations (LOAD, STORE)
- **stack.ts**: Stack manipulation (PUSH, POP, DUP, SWAP)

### Unified Operations
- **unified.ts**: GET/SET operations for arrays, objects, and strings
- **advanced.ts**: Complex operations (JSON_PARSE, LENGTH)

### Support Files
- **index.ts**: Exports all handlers in a single map
- **heap-helpers.ts**: Utilities for heap management (though in parent directory)
- **stack-utils.ts**: Stack manipulation utilities (in parent directory)

## Current Implementation

As of now, CVM implements **80+ opcodes** covering:
- Complete arithmetic and logical operations
- Array and object manipulation with heap support
- String operations and methods
- Control flow including loops and conditionals
- Type checking and conversions
- File system operations (sandboxed)
- JSON parsing and stringification

## Handler Pattern Benefits

### 1. Modularity
Each handler is self-contained with clear responsibilities:
```typescript
export const addHandler: OpcodeHandler = {
  stackIn: 2,   // Pops two values
  stackOut: 1,  // Pushes one result
  execute: (state, instruction) => {
    const b = state.stack.pop()!;
    const a = state.stack.pop()!;
    state.stack.push(performAdd(a, b));
  }
};
```

### 2. Type Safety
Handlers use TypeScript and type guards:
```typescript
function performAdd(a: CVMValue, b: CVMValue): CVMValue {
  if (isCVMNumber(a) && isCVMNumber(b)) {
    return a + b;
  }
  // String concatenation fallback
  return cvmToString(a) + cvmToString(b);
}
```

### 3. Testability
Each handler can be tested in isolation:
```typescript
describe('ADD handler', () => {
  it('should add two numbers', () => {
    const vm = new VM();
    const state = vm.createInitialState();
    state.stack.push(5, 3);
    
    const handler = handlers[OpCode.ADD];
    handler.execute(state, { op: OpCode.ADD });
    
    expect(state.stack[0]).toBe(8);
  });
});
```

## Adding New Handlers

### 1. Define the Opcode
In `packages/parser/src/lib/bytecode.ts`:
```typescript
export enum OpCode {
  // ... existing opcodes
  MY_NEW_OP = 'MY_NEW_OP',
}
```

### 2. Create Handler Implementation
In appropriate handler file or new file in `packages/vm/src/lib/handlers/`:
```typescript
import { OpcodeHandler } from './types.js';
import { VMError } from './index.js';

export const myNewOpHandler: OpcodeHandler = {
  stackIn: 1,   // How many values to pop
  stackOut: 1,  // How many values to push
  execute: (state, instruction) => {
    // Pop required values
    const value = state.stack.pop()!;
    
    // Validate types if needed
    if (!isCVMString(value)) {
      state.status = 'error';
      state.error = 'MY_NEW_OP requires string';
      return;
    }
    
    // Perform operation
    const result = processValue(value);
    
    // Push result
    state.stack.push(result);
  }
};
```

### 3. Register Handler
In `packages/vm/src/lib/handlers/index.ts`, add to the handlers map:
```typescript
export const handlers: Record<OpCode, OpcodeHandler> = {
  // ... existing handlers
  [OpCode.MY_NEW_OP]: myNewOpHandler,
};
```

### 4. Add Compiler Support
In `packages/parser/src/lib/compiler/` add compilation logic to generate the opcode.

### 5. Write Tests
Test alongside the handler implementation:
```typescript
describe('MY_NEW_OP', () => {
  it('should process values correctly', () => {
    // Test implementation
  });
  
  it('should handle error cases', () => {
    // Test error handling
  });
});
```

## Handler Best Practices

### 1. Stack Validation
The VM validates stack requirements before calling handlers:
```typescript
// In vm.ts
private validateStack(handler: OpcodeHandler, instruction: Instruction, state: VMState): VMError | void {
  if (state.stack.length < handler.stackIn) {
    return {
      type: 'STACK_UNDERFLOW',
      message: `Stack underflow: ${instruction.op} requires ${handler.stackIn} values`,
      instruction
    };
  }
}
```

### 2. Type Checking
Always use type guards for type-specific operations:
```typescript
import { isCVMString, isCVMNumber, isCVMArray } from '@cvm/types';

if (isCVMString(value)) {
  // String-specific logic
} else if (isCVMNumber(value)) {
  // Number-specific logic
} else if (isCVMArray(value)) {
  // Array-specific logic
} else {
  // Handle other types or error
}
```

### 3. Error Handling
Set proper error state instead of throwing:
```typescript
if (divisor === 0) {
  state.status = 'error';
  state.error = 'Division by zero';
  return;
}
```

### 4. Heap Operations
For reference types, use heap utilities:
```typescript
import { resolveHeapValue } from '../heap-helpers.js';

// Resolve array reference if needed
const resolved = resolveHeapValue(value, state);
if (!resolved.success) {
  state.status = 'error';
  state.error = resolved.error;
  return;
}
const array = resolved.value;
```

### 5. State Mutations
Only modify state through proper methods:
```typescript
// Good: Using state methods
state.stack.push(value);
state.variables.set(name, value);
state.heap.objects.set(id, { type: 'array', data: array });

// Bad: Direct manipulation
state.stack[0] = value;  // Don't do this!
```

## Performance Considerations

### 1. Handler Lookup
Handlers use object lookup for O(1) performance:
```typescript
const handler = handlers[instruction.op];
if (!handler) {
  throw new Error(`Unknown opcode: ${instruction.op}`);
}
```

### 2. Stack Operations
Use efficient array methods:
```typescript
// Good: O(1) operations
state.stack.push(value);
state.stack.pop();

// Avoid: O(n) operations in hot paths
state.stack.unshift(value);  // Avoid
state.stack.shift();         // Avoid
```

### 3. Type Conversions
Cache conversions when used multiple times:
```typescript
// If converting multiple times
const strValue = cvmToString(value);
const upperCase = strValue.toUpperCase();
const lowerCase = strValue.toLowerCase();
// Don't convert three times!
```

### 4. Heap Access
Minimize heap lookups:
```typescript
// Cache resolved values
const array = resolveHeapValue(arrayRef, state).value;
// Use cached array for multiple operations
array.elements.push(item1);
array.elements.push(item2);
```

## Testing Handlers

### Unit Tests
Each handler should have comprehensive tests:
```typescript
describe('String handlers', () => {
  let vm: VM;
  let state: VMState;
  
  beforeEach(() => {
    vm = new VM();
    state = vm.createInitialState();
  });
  
  describe('STRING_LEN', () => {
    it('should return string length', () => {
      state.stack.push('hello');
      handlers[OpCode.STRING_LEN].execute(state, { op: OpCode.STRING_LEN });
      expect(state.stack[0]).toBe(5);
    });
    
    it('should handle empty strings', () => {
      state.stack.push('');
      handlers[OpCode.STRING_LEN].execute(state, { op: OpCode.STRING_LEN });
      expect(state.stack[0]).toBe(0);
    });
  });
});
```

### Integration Tests
Test handler interactions:
```typescript
it('should handle array method chaining', () => {
  // Create array
  handlers[OpCode.ARRAY_NEW].execute(state, { op: OpCode.ARRAY_NEW });
  
  // Push values
  state.stack.push(state.stack[0], 1);
  handlers[OpCode.ARRAY_PUSH].execute(state, { op: OpCode.ARRAY_PUSH });
  
  // Get length
  state.stack.push(state.stack[0]);
  handlers[OpCode.ARRAY_LEN].execute(state, { op: OpCode.ARRAY_LEN });
  
  expect(state.stack[state.stack.length - 1]).toBe(1);
});
```

## Common Patterns

### Array Method Pattern
```typescript
// Pop array and arguments
const args = [];
for (let i = 0; i < argCount; i++) {
  args.unshift(state.stack.pop()!);
}
const arrayValue = state.stack.pop()!;

// Resolve array
const resolved = resolveHeapValue(arrayValue, state);
if (!resolved.success) {
  // Handle error
}

// Perform operation
const result = array.elements.filter(/* ... */);

// Allocate new array for result
const newArray: CVMArray = { type: 'array', elements: result };
const heapId = state.heap.nextId++;
state.heap.objects.set(heapId, { type: 'array', data: newArray });

// Push reference
state.stack.push({ type: 'array-ref', id: heapId });
```

### Type Checking Pattern
```typescript
const value = state.stack.pop()!;

// Convert based on type
let result: CVMValue;
if (isCVMString(value)) {
  result = value.toLowerCase();
} else {
  // Convert to string first
  const str = cvmToString(value);
  result = str.toLowerCase();
}

state.stack.push(result);
```

## Future Improvements

### 1. Handler Validation
Add compile-time validation that stackIn/stackOut match implementation

### 2. Performance Profiling
Add optional metrics collection for handler execution times

### 3. Handler Composition
Allow complex operations to compose simpler handlers

### 4. Better Error Context
Include source location information in runtime errors

This architecture has proven robust and extensible, supporting the full CVM language while maintaining clean separation of concerns.