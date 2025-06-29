# CVM Fixes - Exact Code Changes

## 1. The [] Accessor Bug

**File**: `/packages/vm/src/lib/handlers/arrays.ts`
**Line**: 114
**Current Code**:
```typescript
const key = index as string;
```
**Fix**:
```typescript
const key = cvmToString(index);
```
**Why**: The code assumes index is already a string, but obj[123] passes a number

## 2. Silent Compiler Failures

**File**: `/packages/parser/src/lib/compiler.ts`
**Lines**: 40-43, 50-53
**Current Code**:
```typescript
if (visitor) {
  visitor(node as any, state, context);
} else {
  // Unsupported statement type - silently skip
}
```
**Fix**:
```typescript
if (visitor) {
  visitor(node as any, state, context);
} else {
  context.reportError(node, `Unsupported statement: ${ts.SyntaxKind[node.kind]}`);
}
```
**Why**: Makes compiler honest about what it can't compile

## 3. Basic Error Propagation

**File**: `/packages/vm/src/lib/vm.ts`
**Current**: VM halts on any error
**Add**: Error state that doesn't crash
```typescript
// In execute() method
if (result && result.type === 'RuntimeError') {
  state.status = 'error';
  state.error = result.message;
  // Don't break - let CC() handle it
  if (currentOp !== OpCode.CC) {
    break;
  }
}
```

**File**: `/packages/vm/src/lib/vm-manager.ts`
**In getNext()**: Check error state before continuing
```typescript
if (initialState.status === 'error') {
  return {
    type: 'error',
    error: initialState.error
  };
}
```

## 4. Memory Leaks

**File**: `/packages/vm/src/lib/vm-manager.ts`
**Line**: 346
**Current Code**:
```typescript
async deleteExecution(executionId: string): Promise<void> {
  return await this.storage.deleteExecution(executionId);
}
```
**Fix**:
```typescript
async deleteExecution(executionId: string): Promise<void> {
  this.vms.delete(executionId); // ADD THIS LINE
  return await this.storage.deleteExecution(executionId);
}
```

**File**: `/packages/vm/src/lib/vm-heap.ts`
**Add method**:
```typescript
gc() {
  // Simple mark & sweep
  const reachable = new Set<number>();
  
  // Mark from stack
  for (const value of state.stack) {
    if (isCVMArrayRef(value) || isCVMObjectRef(value)) {
      this.mark(value.id, reachable);
    }
  }
  
  // Sweep
  for (const [id, obj] of this.objects) {
    if (!reachable.has(id)) {
      this.objects.delete(id);
    }
  }
}
```

## 5. Array Methods Without Functions

**File**: `/packages/parser/src/lib/bytecode.ts`
**Add opcodes**:
```typescript
ARRAY_MAP = 'ARRAY_MAP',
ARRAY_FILTER = 'ARRAY_FILTER',
ARRAY_REDUCE = 'ARRAY_REDUCE',
```

**File**: `/packages/parser/src/lib/compiler/expressions/call-expression.ts`
**Add to method detection**:
```typescript
case 'map':
  state.emit(OpCode.ARRAY_MAP);
  break;
case 'filter':
  state.emit(OpCode.ARRAY_FILTER);
  break;
```

**File**: `/packages/vm/src/lib/handlers/arrays.ts`
**Add handlers**:
```typescript
[OpCode.ARRAY_MAP]: {
  execute: (state, instruction) => {
    const mapper = state.stack.pop(); // For now, just property name
    const arrayRef = state.stack.pop();
    const array = state.heap.get(arrayRef.id).data;
    
    const result = [];
    for (const item of array.elements) {
      if (isCVMObjectRef(item)) {
        const obj = state.heap.get(item.id).data;
        result.push(obj.properties[mapper] || null);
      }
    }
    
    const newArray = createCVMArray();
    newArray.elements = result;
    const ref = state.heap.allocate('array', newArray);
    state.stack.push(ref);
  }
}
```

## 6. Better Error Messages

**File**: `/packages/parser/src/lib/bytecode.ts`
**Enhance Instruction interface**:
```typescript
export interface Instruction {
  op: OpCode;
  arg?: any;
  line?: number;
  column?: number;
  source?: string; // Add source snippet
}
```

**File**: `/packages/vm/src/lib/handlers/types.ts`
**Enhance error type**:
```typescript
export interface VMError {
  type: 'RuntimeError';
  message: string;
  pc: number;
  opcode: OpCode;
  line?: number;
  source?: string;
  stack?: string[];
}
```

## 7. Compound Assignment Fix

**File**: `/packages/parser/src/lib/compiler/statements/expression-statement.ts`
**Line**: 62-67
**Replace error with**:
```typescript
} else if (ts.isElementAccessExpression(expr.left)) {
  // arr[i] += 1
  const tempVar = `__temp_${state.getBytecode().length}`;
  state.emit(OpCode.STORE, tempVar); // Store RHS
  
  // Duplicate array and index
  compileExpression(expr.left.expression); 
  compileExpression(expr.left.argumentExpression);
  state.emit(OpCode.DUP2); // Need DUP2 opcode
  
  // Get current value
  state.emit(OpCode.ARRAY_GET);
  
  // Load RHS and apply operation
  state.emit(OpCode.LOAD, tempVar);
  state.emit(OpCode.ADD); // or appropriate op
  
  // Store back
  state.emit(OpCode.ARRAY_SET);
}
```

## 8. Stack Manipulation Opcodes

**File**: `/packages/parser/src/lib/bytecode.ts`
**Add**:
```typescript
DUP = 'DUP',    // Duplicate top
DUP2 = 'DUP2',  // Duplicate top 2
SWAP = 'SWAP',  // Swap top 2
ROT = 'ROT',    // Rotate top 3
```

**File**: `/packages/vm/src/lib/handlers/stack.ts`
**Add handlers**:
```typescript
[OpCode.SWAP]: {
  execute: (state) => {
    const a = state.stack.pop()!;
    const b = state.stack.pop()!;
    state.stack.push(a);
    state.stack.push(b);
  }
},

[OpCode.DUP]: {
  execute: (state) => {
    const top = state.stack[state.stack.length - 1];
    state.stack.push(top);
  }
}
```

## 9. Fix Type Coercion

**File**: `/packages/parser/src/lib/compiler/statements/expression-statement.ts`
**Lines**: 41-45
**Remove type guessing**:
```typescript
// DELETE THIS:
if (ts.isStringLiteral(expr.right)) {
  state.emit(OpCode.CONCAT);
} else {
  state.emit(OpCode.ADD);
}

// REPLACE WITH:
state.emit(OpCode.ADD); // Let VM decide at runtime
```

**File**: `/packages/vm/src/lib/handlers/arithmetic.ts`
**Fix ADD handler**:
```typescript
[OpCode.ADD]: {
  execute: (state) => {
    const b = state.stack.pop()!;
    const a = state.stack.pop()!;
    
    // Runtime type checking
    if (isCVMString(a) || isCVMString(b)) {
      state.stack.push(cvmToString(a) + cvmToString(b));
    } else {
      state.stack.push(cvmToNumber(a) + cvmToNumber(b));
    }
  }
}
```

## 10. Unified GET/SET Opcodes

**File**: `/packages/parser/src/lib/bytecode.ts`
**Add**:
```typescript
ELEMENT_GET = 'ELEMENT_GET',
ELEMENT_SET = 'ELEMENT_SET',
```

**File**: `/packages/parser/src/lib/compiler/expressions/element-access.ts`
**Line**: 23
**Change**:
```typescript
state.emit(OpCode.ELEMENT_GET); // Instead of ARRAY_GET
```

**File**: `/packages/vm/src/lib/handlers/elements.ts` (new file)
**Create unified handler**:
```typescript
export const elementHandlers = {
  [OpCode.ELEMENT_GET]: {
    execute: (state) => {
      const key = state.stack.pop()!;
      const target = state.stack.pop()!;
      
      if (isCVMArrayRef(target)) {
        const array = state.heap.get(target.id).data;
        const index = cvmToNumber(key);
        state.stack.push(array.elements[index] || createCVMUndefined());
      } else if (isCVMObjectRef(target)) {
        const obj = state.heap.get(target.id).data;
        const prop = cvmToString(key);
        state.stack.push(obj.properties[prop] || createCVMUndefined());
      } else {
        return { type: 'RuntimeError', message: 'Invalid target for element access' };
      }
    }
  }
};
```

## 11. State Serialization Fix

**File**: `/packages/vm/src/lib/vm-manager.ts`
**Create helper**:
```typescript
private serializeState(vmState: VMState): any {
  return {
    pc: vmState.pc,
    stack: vmState.stack,
    variables: Object.fromEntries(vmState.variables),
    heap: this.serializeHeap(vmState.heap),
    iterators: vmState.iterators,
    status: vmState.status,
    error: vmState.error
  };
}

private deserializeState(data: any): VMState {
  const state = createInitialVMState();
  state.pc = data.pc;
  state.stack = data.stack;
  state.variables = new Map(Object.entries(data.variables));
  state.heap = this.deserializeHeap(data.heap);
  state.iterators = data.iterators;
  state.status = data.status;
  state.error = data.error;
  return state;
}
```

**Then replace all 6+ manual mappings with these helpers**

## 12. Compiler Error Handling

**File**: `/packages/parser/src/lib/compiler.ts`
**Wrap compilation**:
```typescript
export function compile(source: string): CompileResult {
  const errors: string[] = [];
  
  try {
    // ... existing code ...
    
    context.reportError = (node, message) => {
      const { line, character } = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart());
      errors.push(`Line ${line + 1}: ${message}`);
    };
    
    // ... compile ...
    
    return {
      success: errors.length === 0,
      bytecode: state.getBytecode(),
      errors
    };
  } catch (e) {
    return {
      success: false,
      bytecode: [],
      errors: [e.message]
    };
  }
}
```

## 13. Test Improvements

**File**: Create `/packages/vm/src/lib/handlers/arrays.spec.ts`
**Add test for numeric keys**:
```typescript
it('should handle numeric keys', () => {
  const obj = {};
  obj[123] = 'value';
  expect(obj[123]).toBe('value');
  expect(obj['123']).toBe('value'); // Both should work
});
```

## 14. Transaction Support

**File**: `/packages/mongodb/src/lib/mongodb-adapter.ts`
**Wrap operations**:
```typescript
async deleteExecution(executionId: string): Promise<void> {
  const session = await this.db.startSession();
  
  try {
    await session.withTransaction(async () => {
      await this.executionsCollection.deleteOne({ id: executionId }, { session });
      await this.outputsCollection.deleteOne({ executionId }, { session });
      
      if (await this.getCurrentExecutionId() === executionId) {
        await this.setCurrentExecutionId(null);
      }
    });
  } finally {
    await session.endSession();
  }
}
```