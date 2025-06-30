# CVM Evolution Plan - Atomic Steps with Dependency Order

## Executive Summary

This plan reorganizes all fixes and improvements into atomic steps, ordered by dependencies. Each step is self-contained and can be completed independently once its dependencies are met. We follow strict TDD methodology - write failing tests first, then implement fixes.

## Dependency Graph Overview

```
1. Stack Safety Utils (no dependencies)
2. CVMArray Type Update (no dependencies)
3. Error Collection in Compiler (no dependencies)
4. VM Cache Cleanup (no dependencies)
5. Primitive Extraction Fix - Objects (depends on 1)
6. Primitive Extraction Fix - Arrays (depends on 1, 2)
7. Compiler Error Reporting (depends on 3)
8. Stack Safety in ALL Handlers (depends on 1)
9. State Serialization Centralization (depends on 5, 6)
10. Database Transactions (no dependencies)
11. Type Detection Heuristics (depends on 8)
12. Error Propagation through CC() (depends on 8)
13. JavaScript Compliance Tests (depends on 5, 6)
14. String Character Access (depends on 5, 6, 8)
15. Stack Manipulation Opcodes (depends on 8)
16. Array Methods Without Functions (depends on 6, 8)
17. Unified GET/SET Opcodes (depends on 5, 6, 14)
18. Function Support Infrastructure (depends on 9, 15)
19. Integration Test Suite (depends on 13)
20. Technical Debt Documentation (depends on all)
```

## PHASE 1: Foundation (No Dependencies)

### Step 1: Create Stack Safety Utils

**File**: Create `/packages/vm/src/lib/stack-utils.ts`
**Dependencies**: None
**Source**: `/home/laco/cvm/tasks/2-fixing-proposal.md:74-108`

**FIRST - Write Tests**:
```typescript
// File: /packages/vm/src/lib/stack-utils.spec.ts
import { safePop, isVMError } from './stack-utils';

describe('Stack safety utilities', () => {
  it('should return value when stack has elements', () => {
    const state = { stack: [1, 2, 3], pc: 0, bytecode: [] };
    const result = safePop(state);
    expect(result).toBe(3);
    expect(state.stack.length).toBe(2);
  });
  
  it('should return error when stack is empty', () => {
    const state = { stack: [], pc: 5, bytecode: [{ op: 'ADD' }] };
    const result = safePop(state);
    expect(isVMError(result)).toBe(true);
    expect(result.message).toContain('Stack underflow');
    expect(result.pc).toBe(5);
    expect(result.opcode).toBe('ADD');
  });
});
```

**THEN - Implement**:
```typescript
// File: /packages/vm/src/lib/stack-utils.ts
import { VMState, CVMValue, VMError } from '../types';

export function safePop(state: VMState): CVMValue | VMError {
  if (state.stack.length < 1) {
    return {
      type: 'RuntimeError',
      message: 'Stack underflow',
      pc: state.pc,
      opcode: state.bytecode[state.pc]?.op
    };
  }
  return state.stack.pop()!;
}

export function isVMError(value: any): value is VMError {
  return value && value.type === 'RuntimeError';
}
```

### Step 2: Update CVMArray Type Definition

**File**: `/packages/types/src/lib/cvm-value.ts`
**Dependencies**: None
**Source**: `/home/laco/cvm/tasks/cvm-evolution-plan-detailed.md:280-287`

**FIRST - Write Tests**:
```typescript
// File: /packages/types/src/lib/cvm-value.spec.ts
describe('CVMArray with properties', () => {
  it('should support both elements and properties', () => {
    const array: CVMArray = {
      type: 'array',
      elements: [1, 2, 3],
      properties: { foo: 'bar' }
    };
    expect(array.elements[0]).toBe(1);
    expect(array.properties.foo).toBe('bar');
  });
});
```

**THEN - Update Type**:
```typescript
export interface CVMArray {
  type: 'array';
  elements: CVMValue[];
  properties?: Record<string, CVMValue>; // ADD THIS
}
```

### Step 3: Add Error Collection to Compiler

**File**: `/packages/parser/src/lib/compiler.ts`
**Dependencies**: None
**Source**: `/home/laco/cvm/tasks/1-almost-all.md:361-370`

**FIRST - Write Test**:
```typescript
// File: /packages/parser/src/lib/compiler.spec.ts
describe('Compiler error collection', () => {
  it('should collect multiple errors without crashing', () => {
    const source = `
      function main() {
        switch(x) { case 1: break; }  // Error 1
        try { } catch(e) { }          // Error 2
      }
    `;
    const result = compile(source);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBe(2);
    expect(result.errors[0].line).toBeDefined();
    expect(result.errors[0].character).toBeDefined();
  });
});
```

**THEN - Add at top of compile function**:
```typescript
const errors: CompilationError[] = [];
```

### Step 4: VM Cache Memory Leak Fix

**File**: `/packages/vm/src/lib/vm-manager.ts`
**Line**: ~346
**Dependencies**: None
**Source**: `/home/laco/cvm/tasks/1-almost-all.md:479`

**FIRST - Write Test**:
```typescript
// File: /packages/vm/src/lib/vm-manager.spec.ts
describe('VM cleanup on deletion', () => {
  it('should remove VM from cache when execution deleted', async () => {
    const vmManager = new VMManager(storage);
    await vmManager.startExecution('prog1', 'exec1');
    
    // Verify VM is cached
    expect(vmManager['vms'].has('exec1')).toBe(true);
    
    // Delete execution
    await vmManager.deleteExecution('exec1');
    
    // Verify VM is removed from cache
    expect(vmManager['vms'].has('exec1')).toBe(false);
  });
});
```

**THEN - Fix**:
```typescript
async deleteExecution(executionId: string): Promise<void> {
  this.vms.delete(executionId); // CRITICAL: Remove from cache!
  return await this.storage.deleteExecution(executionId);
}
```

### Step 10: Database Transaction Safety

**File**: `/packages/mongodb/src/lib/mongodb-adapter.ts`
**Dependencies**: None
**Source**: `/home/laco/cvm/tasks/1-almost-all.md:463-464`

**FIRST - Write Test**:
```typescript
describe('Atomic deletion operations', () => {
  it('should rollback all changes if any operation fails', async () => {
    // Setup execution with output
    await adapter.saveExecution(mockExecution);
    await adapter.appendOutput('exec1', 'output');
    
    // Mock failure on second operation
    jest.spyOn(outputsCollection, 'deleteMany').mockRejectedValue(new Error('DB Error'));
    
    // Attempt deletion
    await expect(adapter.deleteExecution('exec1')).rejects.toThrow('DB Error');
    
    // Verify execution still exists (rollback)
    const execution = await adapter.getExecution('exec1');
    expect(execution).not.toBeNull();
  });
});
```

**THEN - Implement Transactions**:
```typescript
async deleteExecution(executionId: string): Promise<void> {
  const session = this.client.startSession();
  try {
    await session.withTransaction(async () => {
      await this.executionsCollection.deleteOne({ id: executionId }, { session });
      await this.outputsCollection.deleteMany({ executionId }, { session });
      
      const current = await this.getCurrentExecutionId();
      if (current === executionId) {
        await this.db.collection('system').updateOne(
          { _id: 'current' },
          { $set: { executionId: null } },
          { session }
        );
      }
    });
  } finally {
    await session.endSession();
  }
}
```

## PHASE 2: Primitive Extraction Fixes (Depends on Phase 1)

### Step 5: Fix Object Property Key Extraction (Bug #6.1)

**File**: `/packages/vm/src/lib/handlers/arrays.ts`
**Line**: 114
**Dependencies**: Step 1 (Stack Safety Utils)
**Source**: `/home/laco/cvm/tasks/1-mostly-focus-on-vm.md:146-184`

**FIRST - Write Test**:
```typescript
describe('Object property key extraction', () => {
  it('should handle numeric keys correctly', () => {
    const bytecode = [
      { op: OpCode.OBJECT_NEW },
      { op: OpCode.PUSH, arg: 123 },      // Numeric key
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.PROPERTY_SET },
      { op: OpCode.PUSH, arg: 123 },      // Access with same numeric key
      { op: OpCode.ARRAY_GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("value");
  });
  
  it('should handle boolean keys correctly', () => {
    // Test obj[true] becomes obj["true"]
  });
});
```

**THEN - Fix Line 114**:
```typescript
// Current BROKEN code:
const key = index as string; // BUG: Assumes index is string

// Fixed code:
const key = isCVMString(index) ? index : cvmToString(index);
```

### Step 6: Fix Array Index Extraction (Bug #6.2 & #6.3)

**File**: `/packages/vm/src/lib/handlers/arrays.ts`
**Lines**: 139 (GET), 211 (SET)
**Dependencies**: Step 1 (Stack Safety), Step 2 (CVMArray type)
**Source**: `/home/laco/cvm/tasks/1-mostly-focus-on-vm.md:146-184`

**FIRST - Write Comprehensive Tests**:
```typescript
describe('Array index handling', () => {
  it('should handle numeric indices', () => {
    // Test array[0]
  });
  
  it('should convert string indices to numbers when valid', () => {
    // Test array["0"] equals array[0]
  });
  
  it('should store non-numeric strings as properties', () => {
    // Test array["foo"] stores in properties
  });
});
```

**THEN - Fix Array GET (Line 139)**:
```typescript
// JavaScript-compliant array access:
let element;
if (isCVMNumber(index)) {
  element = array.elements[index] ?? createCVMUndefined();
} else if (isCVMString(index)) {
  const numIndex = Number(index);
  if (!isNaN(numIndex) && numIndex >= 0 && numIndex % 1 === 0) {
    element = array.elements[numIndex] ?? createCVMUndefined();
  } else {
    element = array.properties?.[index] ?? createCVMUndefined();
  }
} else {
  const key = cvmToString(index);
  element = array.properties?.[key] ?? createCVMUndefined();
}
```

**THEN - Fix Array SET (Line 211)**:
```typescript
// JavaScript-compliant array assignment:
if (isCVMNumber(index)) {
  const idx = Math.floor(index);
  if (idx >= 0) {
    array.elements[idx] = value;
  } else {
    return { type: 'RuntimeError', message: 'Negative index not allowed' };
  }
} else if (isCVMString(index)) {
  const numIndex = Number(index);
  if (!isNaN(numIndex) && numIndex >= 0 && numIndex % 1 === 0) {
    array.elements[Math.floor(numIndex)] = value;
  } else {
    if (!array.properties) array.properties = {};
    array.properties[index] = value;
  }
} else {
  const key = cvmToString(index);
  if (!array.properties) array.properties = {};
  array.properties[key] = value;
}
```

### Step 6.4: Fix Object Assignment Key (Bug #6.4)

**File**: `/packages/vm/src/lib/handlers/arrays.ts`
**Line**: 187
**Dependencies**: Step 1 (Stack Safety)
**Source**: `/home/laco/cvm/tasks/1-mostly-focus-on-vm.md:146-184`

**FIRST - Write Test**:
```typescript
describe('Object assignment key handling', () => {
  it('should prevent key collision with different CVMValue types', () => {
    // Test that different CVMValue objects don't all become "[object Object]"
  });
});
```

**THEN - Fix Line 187**:
```typescript
// Current:
obj.properties[index] = value; // BUG: CVMValue as key

// Fixed:
const key = isCVMString(index) ? index : cvmToString(index);
obj.properties[key] = value;
```

## PHASE 3: Compiler Error Reporting (Depends on Step 3)

### Step 7: Implement Compiler Error Reporting

**File**: `/packages/parser/src/lib/compiler.ts`
**Lines**: 40-43, 50-53, reportError function, return statement
**Dependencies**: Step 3 (Error Collection)
**Source**: `/home/laco/cvm/tasks/2-fixing-proposal.md:90-120`

**FIRST - Write Tests**:
```typescript
describe('Compiler error reporting', () => {
  it('should report unsupported syntax errors', () => {
    const source = `
      function main() {
        switch(x) { case 1: break; }
      }
    `;
    const result = compile(source);
    expect(result.success).toBe(false);
    expect(result.errors[0].message).toContain('Unsupported syntax: SwitchStatement');
  });
});
```

**THEN - Update reportError function**:
```typescript
reportError: (node: ts.Node, message: string): void => {
  const { line, character } = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart());
  errors.push({ 
    message, 
    line: line + 1, 
    character: character + 1 
  });
},
```

**THEN - Fix visitor else clause**:
```typescript
if (visitor) {
  visitor(node as any, state, context);
} else {
  context.reportError(node, `Unsupported syntax: ${ts.SyntaxKind[node.kind]}`);
}
```

**THEN - Fix return statement**:
```typescript
return {
  success: errors.length === 0,
  bytecode: state.getBytecode(),
  errors: errors
}
```

## PHASE 4: Apply Stack Safety Everywhere (Depends on Step 1)

### Step 8: Update ALL Handlers with Stack Safety

**Files**: All handler files in `/packages/vm/src/lib/handlers/`
- arithmetic.ts
- arrays.ts
- comparison.ts
- logical.ts
- objects.ts
- strings.ts
**Dependencies**: Step 1 (Stack Safety Utils)
**Source**: `/home/laco/cvm/tasks/1-mostly-focus-on-vm.md:58`

**FIRST - Write Tests for Each Handler**:
```typescript
describe('Arithmetic operations with stack safety', () => {
  it('should handle ADD with insufficient stack', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: 5 },
      { op: OpCode.ADD }, // Only 1 value, needs 2
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toContain('Stack underflow');
  });
});
```

**THEN - Update Each Handler**:
```typescript
// Pattern for ALL handlers:
// BEFORE:
const b = state.stack.pop()!;
const a = state.stack.pop()!;

// AFTER:
import { safePop, isVMError } from '../stack-utils';

const b = safePop(state);
if (isVMError(b)) return b;
const a = safePop(state);
if (isVMError(a)) return a;
```

## PHASE 5: State Management (Depends on Primitive Extraction)

### Step 9: Centralize State Serialization

**File**: `/packages/vm/src/lib/vm-manager.ts`
**Lines**: 129-141, 151-159, 241-250, 261-269 (6+ places!)
**Dependencies**: Steps 5, 6 (Primitive extraction fixes)
**Source**: `/home/laco/cvm/tasks/1-almost-all.md:63-70`

**FIRST - Write Test**:
```typescript
describe('Centralized state serialization', () => {
  it('should correctly serialize and deserialize VM state', () => {
    const originalState = {
      pc: 10,
      stack: [1, "test", true],
      variables: new Map([["x", 5], ["y", "hello"]]),
      heap: new Map(),
      iterators: [],
      status: 'running',
      error: null,
      ccPrompt: null
    };
    
    const serialized = vmManager.serializeVMState(originalState);
    const deserialized = vmManager.deserializeVMState(serialized);
    
    expect(deserialized.pc).toBe(originalState.pc);
    expect(deserialized.variables.get("x")).toBe(5);
  });
});
```

**THEN - Create Helper Methods**:
```typescript
private serializeVMState(vm: VM): any {
  const state = vm.getState();
  return {
    pc: state.pc,
    stack: state.stack,
    variables: Object.fromEntries(state.variables),
    heap: this.serializeHeap(state.heap),
    iterators: state.iterators,
    status: state.status,
    error: state.error,
    ccPrompt: state.ccPrompt
  };
}

private deserializeVMState(data: any): VMState {
  return {
    pc: data.pc || 0,
    stack: data.stack || [],
    variables: new Map(Object.entries(data.variables || {})),
    heap: this.deserializeHeap(data.heap),
    iterators: data.iterators || [],
    status: data.status || 'running',
    error: data.error,
    ccPrompt: data.ccPrompt,
    output: []
  };
}
```

**THEN - Replace ALL 6+ locations with**:
```typescript
// Saving:
execution.state = this.serializeVMState(vm);

// Loading:
const vmState = this.deserializeVMState(execution.state);
```

## PHASE 6: Type System and Error Handling (Depends on Stack Safety)

### Step 11: Fix Type Detection Heuristics

**File**: `/packages/parser/src/lib/compiler/statements/expression-statement.ts`
**Lines**: 41-45
**Dependencies**: Step 8 (Stack safety in handlers)
**Source**: `/home/laco/cvm/tasks/1-almost-all.md:1099-1105`

**FIRST - Write Test**:
```typescript
describe('ADD opcode type handling', () => {
  it('should concatenate when either operand is string', () => {
    const source = `
      function main() {
        var a = "hello";
        var b = 5;
        return a + b; // Should be "hello5"
      }
    `;
    const result = executeProgram(source);
    expect(result).toBe("hello5");
  });
});
```

**THEN - Remove Compiler Heuristic**:
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

**THEN - Update ADD Handler in VM**:
```typescript
[OpCode.ADD]: {
  execute: (state) => {
    const b = safePop(state);
    if (isVMError(b)) return b;
    const a = safePop(state);
    if (isVMError(a)) return a;
    
    // JavaScript + semantics
    if (isCVMString(a) || isCVMString(b)) {
      state.stack.push(cvmToString(a) + cvmToString(b));
    } else {
      state.stack.push(cvmToNumber(a) + cvmToNumber(b));
    }
  }
}
```

### Step 12: Error Propagation Through CC()

**File**: `/packages/vm/src/lib/vm.ts`
**Dependencies**: Step 8 (Stack safety everywhere)
**Source**: `/home/laco/cvm/tasks/1-almost-all.md:84`

**FIRST - Write Test**:
```typescript
describe('Error handling through CC()', () => {
  it('should allow CC() to handle runtime errors', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: 10 },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.DIV }, // Division by zero
      { op: OpCode.CC },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    expect(state.status).toBe('waiting_cc');
    expect(state.ccPrompt).toContain('ERROR: Division by zero');
  });
});
```

**THEN - Implement in VM execute loop**:
```typescript
if (result && result.type === 'RuntimeError') {
  state.status = 'error';
  state.error = result.message;
  
  // Allow CC() to handle errors
  if (instruction.op === OpCode.CC) {
    state.ccPrompt = `ERROR: ${result.message}. How should I proceed?`;
    state.status = 'waiting_cc';
    break;
  }
  break;
}
```

## PHASE 7: JavaScript Compliance Testing (Depends on Primitive Extraction)

### Step 13: JavaScript-Compliant [] Accessor Tests

**File**: Create `/packages/vm/src/lib/handlers/arrays.javascript-compliance.spec.ts`
**Dependencies**: Steps 5, 6 (All primitive extraction fixes)
**Source**: `/home/laco/cvm/tasks/cvm-evolution-plan-detailed.md:583-649`

**Write Comprehensive Test Suite**:
```typescript
describe('JavaScript-compliant [] accessor behavior', () => {
  it('array["0"] should equal array[0]', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.PUSH, arg: "value1" },
      { op: OpCode.ARRAY_SET },
      { op: OpCode.PUSH, arg: "0" },  // String index
      { op: OpCode.ARRAY_GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("value1");
  });
  
  it('array["foo"] should store non-numeric property on array', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.PUSH, arg: "foo" },
      { op: OpCode.PUSH, arg: "bar" },
      { op: OpCode.ARRAY_SET },
      { op: OpCode.PUSH, arg: "foo" },
      { op: OpCode.ARRAY_GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("bar");
  });
  
  it('obj[123] should equal obj["123"]', () => {
    const bytecode = [
      { op: OpCode.OBJECT_NEW },
      { op: OpCode.PUSH, arg: 123 },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.PROPERTY_SET },
      { op: OpCode.PUSH, arg: "123" },
      { op: OpCode.ARRAY_GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("value");
  });
  
  it('"hello"[0] should return "h"', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: "hello" },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.ARRAY_GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("h");
  });
  
  it('"hello"["1"] should return "e"', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: "hello" },
      { op: OpCode.PUSH, arg: "1" },
      { op: OpCode.ARRAY_GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("e");
  });
});
```

## PHASE 8: Missing Features (Depends on Previous Phases)

### Step 14: Implement String Character Access

**File**: `/packages/vm/src/lib/handlers/arrays.ts`
**Dependencies**: Steps 5, 6, 8 (Primitive extraction, Stack safety)
**Source**: `/home/laco/cvm/tasks/1-almost-all.md:189`

**FIRST - Write Tests** (some already in Step 13):
```typescript
describe('String character access', () => {
  it('should access string characters by numeric index', () => {
    // Test "hello"[0] returns "h"
  });
  
  it('should handle out of bounds gracefully', () => {
    // Test "hello"[10] returns undefined
  });
});
```

**THEN - Add to ARRAY_GET handler**:
```typescript
// Add string handling case:
else if (isCVMString(target)) {
  // Handle string character access
  if (isCVMNumber(index)) {
    const idx = Math.floor(index);
    const char = target[idx];
    state.stack.push(char !== undefined ? char : createCVMUndefined());
  } else if (isCVMString(index)) {
    const numIndex = Number(index);
    if (!isNaN(numIndex)) {
      const idx = Math.floor(numIndex);
      const char = target[idx];
      state.stack.push(char !== undefined ? char : createCVMUndefined());
    } else {
      state.stack.push(createCVMUndefined());
    }
  } else {
    state.stack.push(createCVMUndefined());
  }
  return undefined;
}
```

### Step 15: Stack Manipulation Opcodes

**File**: `/packages/parser/src/lib/bytecode.ts` and new `/packages/vm/src/lib/handlers/stack.ts`
**Dependencies**: Step 8 (Stack safety)
**Source**: `/home/laco/cvm/tasks/2-fixing-proposal.md:317-339`

**FIRST - Write Tests**:
```typescript
describe('Stack manipulation opcodes', () => {
  it('should duplicate top value with DUP', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: 42 },
      { op: OpCode.DUP },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack).toEqual([42, 42]);
  });
  
  it('should swap top two values with SWAP', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: 1 },
      { op: OpCode.PUSH, arg: 2 },
      { op: OpCode.SWAP },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack).toEqual([2, 1]);
  });
});
```

**THEN - Add Opcodes to bytecode.ts**:
```typescript
DUP = 'DUP',      // Duplicate top
DUP2 = 'DUP2',    // Duplicate top 2
SWAP = 'SWAP',    // Swap top 2
ROT3 = 'ROT3',    // Rotate top 3
```

**THEN - Create handlers/stack.ts**:
```typescript
export const stackHandlers = {
  [OpCode.DUP]: {
    execute: (state) => {
      if (state.stack.length < 1) {
        return { type: 'RuntimeError', message: 'DUP requires 1 value on stack' };
      }
      const top = state.stack[state.stack.length - 1];
      state.stack.push(top);
    }
  },
  
  [OpCode.SWAP]: {
    execute: (state) => {
      if (state.stack.length < 2) {
        return { type: 'RuntimeError', message: 'SWAP requires 2 values on stack' };
      }
      const len = state.stack.length;
      [state.stack[len-1], state.stack[len-2]] = [state.stack[len-2], state.stack[len-1]];
    }
  },
  
  [OpCode.DUP2]: {
    execute: (state) => {
      if (state.stack.length < 2) {
        return { type: 'RuntimeError', message: 'DUP2 requires 2 values on stack' };
      }
      const len = state.stack.length;
      state.stack.push(state.stack[len-2]);
      state.stack.push(state.stack[len-1]);
    }
  }
};
```

### Step 16: Array Methods Without Functions

**File**: `/packages/parser/src/lib/bytecode.ts` and `/packages/vm/src/lib/handlers/arrays.ts`
**Dependencies**: Steps 6, 8 (Array fixes, Stack safety)
**Source**: `/home/laco/cvm/tasks/2-fixing-proposal.md:259-306`

**FIRST - Write Tests**:
```typescript
describe('Array map with property access', () => {
  it('should map array to property values', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      // Push objects with 'name' property
      { op: OpCode.OBJECT_NEW },
      { op: OpCode.PUSH, arg: "name" },
      { op: OpCode.PUSH, arg: "Alice" },
      { op: OpCode.PROPERTY_SET },
      { op: OpCode.ARRAY_PUSH },
      // Map to extract 'name' property
      { op: OpCode.PUSH, arg: "name" },
      { op: OpCode.ARRAY_MAP_PROP },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    // Should have array ["Alice"]
  });
});
```

**THEN - Add Opcodes**:
```typescript
ARRAY_MAP_PROP = 'ARRAY_MAP_PROP',
ARRAY_FILTER_PROP = 'ARRAY_FILTER_PROP',
```

**THEN - Add Handler**:
```typescript
[OpCode.ARRAY_MAP_PROP]: {
  execute: (state) => {
    const propName = safePop(state);
    if (isVMError(propName)) return propName;
    const arrayRef = safePop(state);
    if (isVMError(arrayRef)) return arrayRef;
    
    if (!isCVMArrayRef(arrayRef)) {
      return { type: 'RuntimeError', message: 'map() requires an array' };
    }
    
    const array = state.heap.get(arrayRef.id).data as CVMArray;
    const result = createCVMArray();
    
    for (const item of array.elements) {
      if (isCVMObjectRef(item)) {
        const obj = state.heap.get(item.id).data as CVMObject;
        result.elements.push(obj.properties[propName] || createCVMNull());
      } else {
        result.elements.push(createCVMNull());
      }
    }
    
    const resultRef = state.heap.allocate('array', result);
    state.stack.push(resultRef);
  }
}
```

## PHASE 9: Architectural Improvements (Depends on Multiple Phases)

### Step 17: Unified GET/SET Opcodes

**File**: `/packages/parser/src/lib/bytecode.ts` and update compiler/VM
**Dependencies**: Steps 5, 6, 14 (All accessor fixes)
**Source**: `/home/laco/cvm/tasks/1-mostly-focus-on-vm.md:29-34`

**FIRST - Write Architecture Tests**:
```typescript
describe('Unified GET opcode', () => {
  it('should handle arrays with GET', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("value");
  });
  
  it('should handle objects with GET', () => {
    // Similar test for objects
  });
  
  it('should handle strings with GET', () => {
    // Similar test for strings
  });
});
```

**THEN - Add New Opcodes**:
```typescript
GET = 'GET',  // Replaces ARRAY_GET + PROPERTY_GET
SET = 'SET',  // Replaces ARRAY_SET + PROPERTY_SET
```

**THEN - Update Compiler** to emit GET for all [] operations

**THEN - Create Unified Handler**:
```typescript
[OpCode.GET]: {
  execute: (state) => {
    const index = safePop(state);
    if (isVMError(index)) return index;
    const target = safePop(state);
    if (isVMError(target)) return target;
    
    if (isCVMArrayRef(target)) {
      // Array logic from Step 6
    } else if (isCVMObjectRef(target)) {
      // Object logic from Step 5
    } else if (isCVMString(target)) {
      // String logic from Step 14
    } else {
      return { type: 'RuntimeError', message: 'GET requires array, object, or string' };
    }
  }
}
```

### Step 18: Function Support Infrastructure

**File**: Multiple files - major architectural change
**Dependencies**: Steps 9, 15 (State management, Stack opcodes)
**Source**: `/home/laco/cvm/tasks/1-almost-all.md:587-590`

**FIRST - Design Call Stack**:
```typescript
interface CallFrame {
  returnAddress: number;
  localVariables: Map<string, CVMValue>;
  baseStackPointer: number;
}

// Add to VMState:
callStack: CallFrame[];
```

**FIRST - Write Basic Tests**:
```typescript
describe('Function call mechanism', () => {
  it('should handle basic function call and return', () => {
    // Test CALL opcode
    // Test local variable scoping
    // Test RETURN opcode
  });
});
```

This is a MAJOR feature requiring:
- Function table in VM
- CALL/RETURN opcodes
- Argument passing
- Local variable scoping
- Call stack management

## PHASE 10: Integration and Documentation

### Step 19: Full Integration Test Suite

**File**: Create `/packages/integration/full-stack.spec.ts`
**Dependencies**: Step 13 (JavaScript compliance tests pass)
**Source**: `/home/laco/cvm/tasks/3-bigreview-plan.md:827-896`

**Create End-to-End Tests**:
```typescript
describe('TypeScript to Result Pipeline', () => {
  it('should compile and execute object property access', () => {
    const source = `
      function main() {
        const obj = { "key": "value" };
        return obj["key"];
      }
    `;
    const bytecode = compile(source);
    const result = vm.execute(bytecode);
    expect(result.stack[0]).toBe("value");
  });
  
  it('should handle complex nested accessors', () => {
    const source = `
      function main() {
        const data = { "users": [{ "name": "Alice" }] };
        return data["users"][0]["name"];
      }
    `;
    // Test full pipeline
  });
});
```

### Step 20: Update Technical Debt Documentation

**File**: Update TODO comments and documentation
**Dependencies**: All previous steps
**Source**: `/home/laco/cvm/tasks/1-almost-all.md:1017-1022`

- Remove TODO about misnamed opcodes (fixed by Step 17)
- Update API documentation
- Document JavaScript compliance behavior
- Update Memory Bank documentation

## Success Metrics

- All tests pass (including 525+ new tests)
- No silent failures
- Proper error messages with context
- Memory stable under load
- Real CVM programs execute correctly
- Type system properly integrated
- State management centralized
- JavaScript-compliant [] accessor behavior

## Implementation Notes

1. Each step is atomic and can be completed independently once dependencies are met
2. Write tests FIRST for every step (TDD)
3. Steps in Phase 1 can be done in parallel (no dependencies)
4. Some steps fix multiple related bugs (e.g., Step 6 fixes both GET and SET)
5. Integration tests (Step 19) validate all previous fixes work together
6. Function support (Step 18) is the most complex and may need further breakdown