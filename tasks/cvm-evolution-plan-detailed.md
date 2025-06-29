# CVM Evolution Plan - Detailed Technical Implementation

## Executive Summary

This plan addresses the critical architectural flaws in CVM identified across three comprehensive analyses. We follow strict TDD methodology - write failing tests first, then implement fixes.

## Critical Bugs to Fix First (TDD Approach)

### 1. The [] Accessor Bug - ONE LINE FIX

**Source**: `/home/laco/cvm/tasks/1-almost-all.md:175` and `/home/laco/cvm/tasks/2-fixing-proposal.md:11`

**File**: `/packages/vm/src/lib/handlers/arrays.ts`  
**Line**: 114

**FIRST - Write Failing Test**:
```typescript
// File: /packages/vm/src/lib/handlers/arrays.spec.ts
describe('ARRAY_GET with numeric keys', () => {
  it('should handle numeric object keys correctly', () => {
    const obj = {};
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
    expect(state.stack[0]).toBe("value"); // WILL FAIL - returns undefined
  });
});
```

**THEN - Apply Fix**:
```typescript
// Current BROKEN code:
const key = index as string; // BUG: Assumes index is string

// Fixed code:
const key = cvmToString(index); // FIX: Properly converts any type to string
```

**Evidence from analysis** (`/home/laco/cvm/tasks/1-almost-all.md:909`): "obj[123] passes a number, not a string. cvmToString() handles all types correctly."

### 2. Silent Compiler Failures

**Source**: `/home/laco/cvm/tasks/1-almost-all.md:361-370`

**File**: `/packages/parser/src/lib/compiler.ts`  
**Lines**: 40-43 (statements), 50-53 (expressions)

**FIRST - Write Failing Tests**:
```typescript
// File: /packages/parser/src/lib/compiler.spec.ts
describe('Compiler error reporting', () => {
  it('should report error for unsupported syntax', () => {
    const source = `
      function main() {
        switch(x) {  // Switch not supported
          case 1: break;
        }
      }
    `;
    const result = compile(source);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('Unsupported syntax: SwitchStatement');
  });
  
  it('should report error for try-catch blocks', () => {
    const source = `
      function main() {
        try {
          doSomething();
        } catch(e) {
          console.log(e);
        }
      }
    `;
    const result = compile(source);
    expect(result.success).toBe(false);
    expect(result.errors[0].message).toContain('Unsupported syntax: TryStatement');
  });
});
```

**THEN - Implement Error Reporting**:

Fix compiler.ts error collection:
```typescript
// Add at top of compile function:
const errors: CompilationError[] = [];

// Replace reportError function:
reportError: (node: ts.Node, message: string): void => {
  const { line, character } = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart());
  errors.push({ 
    message, 
    line: line + 1, 
    character: character + 1 
  });
},

// Fix visitor else clause:
if (visitor) {
  visitor(node as any, state, context);
} else {
  context.reportError(node, `Unsupported syntax: ${ts.SyntaxKind[node.kind]}`);
}

// Fix return statement:
return {
  success: errors.length === 0,
  bytecode: state.getBytecode(),
  errors: errors
}
```

### 3. Stack Underflow Protection

**Source**: `/home/laco/cvm/tasks/2-fixing-proposal.md:74-108`

**FIRST - Write Failing Tests**:
```typescript
// File: /packages/vm/src/lib/handlers/arithmetic.spec.ts
describe('Stack underflow protection', () => {
  it('should handle ADD with insufficient stack', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: 5 },
      { op: OpCode.ADD }, // Only 1 value on stack, needs 2
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toContain('Stack underflow');
  });
});
```

**THEN - Create Stack Utils**:
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

**Update ALL handlers** (Evidence from `/home/laco/cvm/tasks/1-mostly-focus-on-vm.md:58`):
- arithmetic.ts
- arrays.ts  
- comparison.ts
- logical.ts
- objects.ts
- strings.ts

Pattern to replace:
```typescript
// BEFORE:
const b = state.stack.pop()!;
const a = state.stack.pop()!;

// AFTER:
const b = safePop(state);
if (isVMError(b)) return b;
const a = safePop(state);
if (isVMError(a)) return a;
```

## Memory Management Fixes

### 4. VM Cache Memory Leak

**Source**: `/home/laco/cvm/tasks/1-almost-all.md:479`

**File**: `/packages/vm/src/lib/vm-manager.ts`  
**Line**: ~346

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

### 5. Database Transaction Safety

**Source**: `/home/laco/cvm/tasks/1-almost-all.md:463-464`

**File**: `/packages/mongodb/src/lib/mongodb-adapter.ts`

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

## Type System Integration Fixes

### 6. Fix ALL Primitive Extraction Bugs

**Source**: `/home/laco/cvm/tasks/1-mostly-focus-on-vm.md:146-184`

**IMPORTANT**: To support JavaScript-compliant behavior, we need to update the CVMArray type:
```typescript
// In types package - cvm-value.ts
export interface CVMArray {
  type: 'array';
  elements: CVMValue[];
  properties?: Record<string, CVMValue>; // ADD THIS - arrays can have string properties
}
```

Multiple critical bugs in arrays.ts:

**Bug #6.1 - Object Property Key** (Line 114):
```typescript
// TEST FIRST:
it('should extract primitive from CVMValue for object keys', () => {
  // Test with CVMString, CVMNumber, CVMBoolean as keys
});

// FIX:
const key = isCVMString(index) ? index : cvmToString(index);
```

**Bug #6.2 - Array Index** (Line 139):
```typescript
// TEST FIRST:
it('should handle both numeric and string indices for arrays', () => {
  // Test array[0] and array["0"] are equivalent
  // Test array["foo"] stores as property, not element
});

// FIX - JavaScript-compliant array access:
let element;
if (isCVMNumber(index)) {
  element = array.elements[index] ?? createCVMUndefined();
} else if (isCVMString(index)) {
  // Try to convert string to number
  const numIndex = Number(index);
  if (!isNaN(numIndex) && numIndex >= 0 && numIndex % 1 === 0) {
    // Valid array index like "0", "1", "2"
    element = array.elements[numIndex] ?? createCVMUndefined();
  } else {
    // Non-numeric string - arrays can have string properties too!
    // This requires arrays to have a properties object like objects do
    element = array.properties?.[index] ?? createCVMUndefined();
  }
} else {
  // Convert other types to string for property access
  const key = cvmToString(index);
  element = array.properties?.[key] ?? createCVMUndefined();
}
```

**Bug #6.3 - Array Assignment** (Line 211):
```typescript
// TEST FIRST:
it('should handle array assignment with string and numeric indices', () => {
  // Test array[0] = value
  // Test array["0"] = value (should go to same location)
  // Test array["foo"] = value (should store as property)
});

// FIX - JavaScript-compliant array assignment:
if (isCVMNumber(index)) {
  const idx = Math.floor(index);
  if (idx >= 0) {
    array.elements[idx] = value;
  } else {
    return { type: 'RuntimeError', message: 'Negative index not allowed' };
  }
} else if (isCVMString(index)) {
  // Try to convert string to number
  const numIndex = Number(index);
  if (!isNaN(numIndex) && numIndex >= 0 && numIndex % 1 === 0) {
    // Valid array index like "0", "1", "2"
    array.elements[Math.floor(numIndex)] = value;
  } else {
    // Non-numeric string - store as property
    if (!array.properties) array.properties = {};
    array.properties[index] = value;
  }
} else {
  // Convert other types to string for property storage
  const key = cvmToString(index);
  if (!array.properties) array.properties = {};
  array.properties[key] = value;
}
```

**Bug #6.4 - Object Assignment Key** (Line 187):
```typescript
// TEST FIRST:
it('should prevent key collision on object assignment', () => {
  // Test multiple CVMValue keys don't collide
});

// FIX:
const key = isCVMString(index) ? index : cvmToString(index);
obj.properties[key] = value;
```

## Error Handling Infrastructure

### 7. Basic Error Propagation Through CC()

**Source**: `/home/laco/cvm/tasks/1-almost-all.md:84`

**File**: `/packages/vm/src/lib/vm.ts`

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

**THEN - Implement**:
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

## State Management Centralization

### 8. Fix State Serialization Duplication

**Source**: `/home/laco/cvm/tasks/1-almost-all.md:63-70`

**File**: `/packages/vm/src/lib/vm-manager.ts`  
**Lines**: 129-141, 151-159, 241-250, 261-269 (6+ places!)

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

**THEN - Create Centralized Methods**:
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

Replace ALL manual state copying with these methods.

## Missing Core Features

### 9. Implement Basic Function Support

**Source**: `/home/laco/cvm/tasks/1-almost-all.md:587-590`

**File**: `/packages/vm/src/lib/handlers/control.ts`  
**Line**: 147 - CALL opcode throws "Functions not implemented"

This requires major architectural work:

**FIRST - Design and Test Call Stack**:
```typescript
// New type in VMState:
interface CallFrame {
  returnAddress: number;
  localVariables: Map<string, CVMValue>;
  baseStackPointer: number;
}

// Add to VMState:
callStack: CallFrame[];
```

**Tests for function infrastructure**:
```typescript
describe('Function call mechanism', () => {
  it('should handle basic function call and return', () => {
    // Test CALL opcode with return address
    // Test local variable scoping
    // Test RETURN opcode
  });
});
```

### 10. Array Methods Without Full Functions

**Source**: `/home/laco/cvm/tasks/2-fixing-proposal.md:259-306`

Since functions aren't implemented, create specialized opcodes:

**FIRST - Write Tests**:
```typescript
describe('Array map with property access', () => {
  it('should map array to property values', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      // Push objects with 'name' property
      { op: OpCode.PUSH, arg: "name" }, // Property to extract
      { op: OpCode.ARRAY_MAP_PROP },
      { op: OpCode.HALT }
    ];
    // Test extraction of property from each element
  });
});
```

**THEN - Add Opcodes**:
```typescript
// In bytecode.ts:
ARRAY_MAP_PROP = 'ARRAY_MAP_PROP',
ARRAY_FILTER_PROP = 'ARRAY_FILTER_PROP',
```

## Architectural Improvements

### 11. Unified GET/SET Opcodes

**Source**: `/home/laco/cvm/tasks/1-mostly-focus-on-vm.md:29-34`

**Problem**: Compiler emits ARRAY_GET for all [] operations, forcing VM to guess types.

**FIRST - Test New Architecture**:
```typescript
describe('Unified GET opcode', () => {
  it('should handle arrays with GET', () => {
    // Test GET on array
  });
  
  it('should handle objects with GET', () => {
    // Test GET on object
  });
  
  it('should handle strings with GET', () => {
    // Test GET on string (character access)
  });
});
```

**THEN - Implement**:
```typescript
// New opcodes in bytecode.ts:
GET = 'GET',  // Replaces ARRAY_GET + PROPERTY_GET
SET = 'SET',  // Replaces ARRAY_SET + PROPERTY_SET

// Update compiler to emit GET for all accessor operations
// Update VM handlers to dispatch based on runtime type
```

### 12. Stack Manipulation Opcodes

**Source**: `/home/laco/cvm/tasks/2-fixing-proposal.md:317-339`

**Problem**: Compiler uses temporary variables to reorder stack.

**FIRST - Test Stack Operations**:
```typescript
describe('Stack manipulation opcodes', () => {
  it('should duplicate top value with DUP', () => {
    // Test DUP
  });
  
  it('should swap top two values with SWAP', () => {
    // Test SWAP
  });
});
```

**THEN - Add Opcodes**:
```typescript
DUP = 'DUP',     // Duplicate top
DUP2 = 'DUP2',   // Duplicate top 2
SWAP = 'SWAP',   // Swap top 2
ROT3 = 'ROT3',   // Rotate top 3
```

## Test Coverage Improvements

### 13. Critical Missing Test Categories

**Source**: `/home/laco/cvm/tasks/3-bigreview-plan.md:827-896`

**Create comprehensive test suites for**:

1. **Object Property Access via ARRAY_GET** (100% broken):
```typescript
// File: /packages/vm/src/lib/handlers/arrays.object-access.spec.ts
describe('Object property access through ARRAY_GET', () => {
  // Multiple test cases for obj["key"] operations
  // Test numeric vs string keys
  // Test key collision scenarios
});
```

2. **JavaScript-Compliant [] Accessor Behavior**:
```typescript
// File: /packages/vm/src/lib/handlers/arrays.javascript-compliance.spec.ts
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
    expect(state.stack[0]).toBe("value1"); // Should convert "0" to 0
  });
  
  it('array["foo"] should store non-numeric property on array', () => {
    // Arrays in JS can have string properties beyond numeric indices
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.PUSH, arg: "foo" },
      { op: OpCode.PUSH, arg: "bar" },
      { op: OpCode.ARRAY_SET },  // Should work - arrays are objects
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
      { op: OpCode.PUSH, arg: 123 },    // Numeric key
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.PROPERTY_SET },
      { op: OpCode.PUSH, arg: "123" },  // String key
      { op: OpCode.ARRAY_GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("value"); // Should find value stored with numeric key
  });
  
  it('"hello"[0] should return "h"', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: "hello" },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.ARRAY_GET },  // Should work on strings
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("h");
  });
  
  it('"hello"["1"] should return "e"', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: "hello" },
      { op: OpCode.PUSH, arg: "1" },  // String index
      { op: OpCode.ARRAY_GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("e"); // Should convert "1" to 1
  });
});
```

3. **Cross-Type Operations**:
```typescript
// File: /packages/vm/src/lib/handlers/arrays.cross-type.spec.ts
describe('ARRAY_GET on different types', () => {
  // Test ARRAY_GET on arrays
  // Test ARRAY_GET on objects  
  // Test ARRAY_GET on strings
  // Test error cases
});
```

4. **Integration Tests**:
```typescript
// File: /packages/integration/full-stack.spec.ts
describe('TypeScript to Result Pipeline', () => {
  // Compile TypeScript
  // Execute bytecode
  // Verify results
});
```

## Technical Debt Cleanup

### 14. Fix Misnamed Opcodes

**Source**: `/home/laco/cvm/tasks/1-almost-all.md:1017-1022`

**File**: `/packages/vm/src/lib/handlers/arrays.ts`  
**Lines**: 19-22 - TODO comment about misnamed opcodes

The ARRAY_GET/SET opcodes handle both arrays AND objects. This should be addressed when implementing unified GET/SET opcodes.

### 15. Fix Type Detection Heuristics

**Source**: `/home/laco/cvm/tasks/1-almost-all.md:1099-1105`

**File**: `/packages/parser/src/lib/compiler/statements/expression-statement.ts`  
**Lines**: 41-45

**Problem**: Compiler guesses ADD vs CONCAT based on literal type.

**FIRST - Test Runtime Type Handling**:
```typescript
describe('ADD opcode type handling', () => {
  it('should concatenate when either operand is string', () => {
    // Test "hello" + 5 = "hello5"
    // Test 5 + "hello" = "5hello"
  });
});
```

**THEN - Remove Heuristic**:
```typescript
// DELETE the type checking:
// if (ts.isStringLiteral(expr.right)) { ... }

// ALWAYS emit ADD:
state.emit(OpCode.ADD);

// Let VM decide at runtime based on actual types
```

## Implementation Strategy

Since we're following TDD rigorously:

1. **Write failing tests for each bug/feature**
2. **Implement minimal code to make tests pass**
3. **Refactor for clarity while keeping tests green**
4. **Add edge case tests**
5. **Document behavior through tests**

## Priority Order (Based on Impact)

1. **[] Accessor Bug** - Breaks basic functionality
2. **Silent Compiler Failures** - Hides problems
3. **Stack Safety** - Prevents crashes
4. **Memory Leaks** - System stability
5. **Primitive Extraction** - Type system integration
6. **Error Propagation** - Robustness
7. **State Centralization** - Maintainability
8. **Array Methods** - Feature completeness
9. **Unified Opcodes** - Architecture cleanup
10. **Function Support** - Major feature

## Success Metrics

- All tests pass (including 525+ new tests)
- No silent failures
- Proper error messages with context
- Memory stable under load
- Real CVM programs execute correctly
- Type system properly integrated
- State management centralized