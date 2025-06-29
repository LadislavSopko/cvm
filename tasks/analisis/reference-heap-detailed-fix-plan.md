# CVM Reference Heap Detailed Fix Plan

## Overview
This document provides line-by-line guidance for fixing remaining issues in the CVM reference heap implementation. Each fix includes exact file paths, line numbers, and TDD test specifications.

## IMPORTANT UPDATE (2025-06-29)
After code verification, the heap implementation is MORE COMPLETE than the findings document indicated:
- ✅ ARRAY_NEW creates heap references (not inline)
- ✅ OBJECT_CREATE creates heap references (not inline)
- ✅ Array literals [1,2,3] create heap references
- ✅ Object literals {a:1} create heap references
- ✅ STRING_SPLIT creates heap references
- ✅ JSON_PARSE creates heap references
- ✅ FS_LIST_FILES creates heap references

The "incomplete reference implementation" issue in the findings appears to be outdated or incorrect.

## Issue 1: VM Crash on Invalid Heap Access

### 1.1 Problem Location
- **File**: `/home/laco/cvm/packages/vm/src/lib/vm-heap.ts`
- **Lines**: 59-62
- **Current Code**:
```typescript
get(id: number): HeapObject | undefined {
  const obj = objects.get(id);
  if (!obj) {
    throw new Error(`Invalid heap reference: ${id}`);  // Line 60
  }
  return obj;
}
```

### 1.2 Test to Write First
- **Test File**: `/home/laco/cvm/packages/vm/src/lib/vm-heap.spec.ts`
- **Test Name**: `should return undefined for invalid heap reference`
- **Test Code**:
```typescript
it('should return undefined for invalid heap reference', () => {
  const heap = createVMHeap();
  const result = heap.get(999);
  expect(result).toBeUndefined();
});
```

### 1.3 Fix Implementation
- **Change Line 60** from: `throw new Error(`Invalid heap reference: ${id}`);`
- **To**: `return undefined;`
- **Remove Lines**: 61 (closing brace becomes unnecessary)

### 1.4 Additional Tests
- Test that operations handle undefined heap objects gracefully
- Test file: `/home/laco/cvm/packages/vm/src/lib/handlers/arrays.spec.ts`

## Issue 2: Stack Overflow Risk in Serialization

### 2.1 Problem Locations
- **File**: `/home/laco/cvm/packages/vm/src/lib/vm-manager.ts`
- **First occurrence**: Lines 156-169
- **Second occurrence**: Lines 276-289 (duplicate code)

### 2.2 Root Cause
Converting entire heap to plain object before JSON.stringify causes stack overflow with deeply nested structures.

### 2.3 Test to Write First
- **Test File**: `/home/laco/cvm/packages/vm/src/lib/vm-manager.spec.ts`
- **Test Name**: `should handle deeply nested structures without stack overflow`
- **Test Code**:
```typescript
it('should handle deeply nested structures without stack overflow', async () => {
  const manager = new VMManager(storage);
  const deeplyNested = `
    let obj = {};
    let current = obj;
    for (let i = 0; i < 1000; i++) {
      current.child = {};
      current = current.child;
    }
    CC("Ready");
  `;
  const program = compile(deeplyNested);
  await manager.loadProgram('deep', program);
  await manager.startExecution('deep', 'exec1');
  
  // Should not throw stack overflow
  const task = await manager.getNext('exec1');
  expect(task).toBeDefined();
});
```

### 2.4 Extract Duplicated Code First
- **Create function** at line 145 (before first usage):
```typescript
private serializeHeap(heap: VMHeap): SerializedHeap {
  const heapObjects: Record<number, { type: 'array' | 'object'; data: CVMValue }> = {};
  heap.objects.forEach((heapObj, id) => {
    heapObjects[id] = {
      type: heapObj.type,
      data: heapObj.data as CVMValue
    };
  });
  return {
    objects: heapObjects,
    nextId: heap.nextId
  };
}
```

### 2.5 Replace Duplicated Code
- **Replace lines 156-169** with: `execution.heap = this.serializeHeap(state.heap);`
- **Replace lines 276-289** with: `execution.heap = this.serializeHeap(newState.heap);`

### 2.6 Implement Safe Serialization
- **Modify the `serializeHeap` function** created in section 2.4
- **Location**: `/home/laco/cvm/packages/vm/src/lib/vm-manager.ts`
- **Implementation**:

```typescript
private serializeHeap(heap: VMHeap): SerializedHeap {
  // Define replacer inside serializeHeap
  const replacer = (key: string, value: any) => {
    if (isCVMArrayRef(value) || isCVMObjectRef(value)) {
      return { $ref: value.id };
    }
    return value;
  };

  const heapObjects: Record<number, { type: 'array' | 'object'; data: any }> = {};
  heap.objects.forEach((heapObj, id) => {
    heapObjects[id] = {
      type: heapObj.type,
      // Serialize each object's data individually with replacer
      data: JSON.parse(JSON.stringify(heapObj.data, replacer))
    };
  });
  
  return {
    objects: heapObjects,
    nextId: heap.nextId
  };
}
```

- **Update Deserialization in `VMManager`**: 
  - **File**: `/home/laco/cvm/packages/vm/src/lib/vm-manager.ts`
  - **Create a `deserializeHeap` private method**:
```typescript
private deserializeHeap(serializedHeap: SerializedHeap): VMHeap {
  const heap = createVMHeap();
  heap.nextId = serializedHeap.nextId;
  
  // First pass: restore all heap objects without fixing references
  for (const idStr in serializedHeap.objects) {
    const id = parseInt(idStr, 10);
    const serializedObj = serializedHeap.objects[id];
    heap.objects.set(id, {
      id,
      type: serializedObj.type,
      data: serializedObj.data // Still contains $ref stubs
    });
  }
  
  // Second pass: fix all $ref stubs to actual CVM references
  heap.objects.forEach((heapObj) => {
    heapObj.data = this.restoreReferences(heapObj.data, heap);
  });
  
  return heap;
}

private restoreReferences(value: any, heap: VMHeap): any {
  if (value && typeof value === 'object' && value.$ref !== undefined) {
    // Convert $ref stub back to proper CVM reference
    const targetObj = heap.objects.get(value.$ref);
    if (targetObj?.type === 'array') {
      return { type: 'array-ref', id: value.$ref } as CVMArrayRef;
    } else if (targetObj?.type === 'object') {
      return { type: 'object-ref', id: value.$ref } as CVMObjectRef;
    }
    return value; // Invalid reference, keep as-is
  }
  
  // Recursively process arrays and objects
  if (Array.isArray(value)) {
    return value.map(item => this.restoreReferences(item, heap));
  }
  
  if (value && typeof value === 'object') {
    const result: any = {};
    for (const key in value) {
      result[key] = this.restoreReferences(value[key], heap);
    }
    return result;
  }
  
  return value;
}
```
  - **Use `deserializeHeap` where heap is restored**: Find where `execution.heap` is assigned to `state.heap` and use:
```typescript
if (execution.heap) {
  state.heap = this.deserializeHeap(execution.heap);
}
```

## Issue 3: ARRAY_GET/SET Handle Objects

### 3.1 Problem Location
- **File**: `/home/laco/cvm/packages/vm/src/lib/handlers/arrays.ts`
- **ARRAY_GET**: Lines 76-158
- **ARRAY_SET**: Lines 160-235 (similar issue)

### 3.2 Current Behavior
- Lines 97-107: Handles object references
- Lines 135-149: Handles object property access
- This duplicates PROPERTY_GET functionality

### 3.3 Tests to Write First
- **Test File**: `/home/laco/cvm/packages/vm/src/lib/handlers/arrays.spec.ts`
- **Test**: `ARRAY_GET should reject object access`
```typescript
it('should return error when ARRAY_GET used on object', () => {
  const state = createVMState();
  const objRef = state.heap.allocate('object', createCVMObject());
  state.stack.push(objRef);
  state.stack.push('key');
  
  const result = arrayHandlers[OpCode.ARRAY_GET].execute(state, { op: OpCode.ARRAY_GET });
  expect(result?.type).toBe('RuntimeError');
  expect(result?.message).toContain('ARRAY_GET requires an array');
});
```

### 3.4 Fix Implementation for ARRAY_GET
- **Remove lines**: 97-107 (object reference handling)
- **Remove lines**: 135-149 (object property handling)
- **Update error message** at line 113: `'ARRAY_GET requires an array'`

### 3.5 Tests for ARRAY_SET
- **Test**: `ARRAY_SET should reject object access`
```typescript
it('should return error when ARRAY_SET used on object', () => {
  const state = createVMState();
  const objRef = state.heap.allocate('object', createCVMObject());
  state.stack.push(objRef);
  state.stack.push('key');
  state.stack.push('value');
  
  const result = arrayHandlers[OpCode.ARRAY_SET].execute(state, { op: OpCode.ARRAY_SET });
  expect(result?.type).toBe('RuntimeError');
  expect(result?.message).toContain('ARRAY_SET requires an array');
});
```

### 3.6 Fix Implementation for ARRAY_SET
- **File**: `/home/laco/cvm/packages/vm/src/lib/handlers/arrays.ts`
- **ARRAY_SET**: Lines 160-235
- **Remove**: Object reference handling (similar to ARRAY_GET)
- **Remove**: Object property setting logic
- **Update error messages**: Should say `'ARRAY_SET requires an array'`

## Issue 4: Inconsistent Undefined Handling

### 4.1 Problem Location
- **File**: `/home/laco/cvm/packages/vm/src/lib/handlers/arrays.ts`
- **Line**: 130
- **Current**: `const element = arrayOrObject.elements[indexOrKey] ?? null;`

### 4.2 Test to Write First
- **Test**: `should return undefined for missing array elements`
```typescript
it('should return undefined for missing array elements', () => {
  const state = createVMState();
  const arr = createCVMArray([1, 2, 3]);
  const ref = state.heap.allocate('array', arr);
  state.stack.push(ref);
  state.stack.push(10); // Out of bounds
  
  arrayHandlers[OpCode.ARRAY_GET].execute(state, { op: OpCode.ARRAY_GET });
  
  const result = state.stack.pop();
  expect(isCVMUndefined(result)).toBe(true);
});
```

### 4.3 Fix Implementation
- **Import** at top: `import { createCVMUndefined } from '@cvm/types';`
- **Change line 130** to: `const element = arrayOrObject.elements[indexOrKey] ?? createCVMUndefined();`
- **Note**: The corresponding object property access code (line 146) will be removed as part of the fix for Issue 3, so no change is needed there

## Issue 5: Missing Heap Behavior Tests

### 5.1 Test Files to Create
- `/home/laco/cvm/packages/vm/src/lib/heap-behavior.spec.ts`
- `/home/laco/cvm/packages/parser/src/lib/heap-compilation.spec.ts`

### 5.2 Heap Behavior Tests
```typescript
describe('Heap Reference Behavior', () => {
  it('should create heap reference for array literal', () => {
    const program = compile('[1, 2, 3]');
    const state = vm.execute(program);
    // Verify the result is a heap reference
  });
  
  it('should create heap reference for object literal', () => {
    const program = compile('({ a: 1, b: 2 })');
    const state = vm.execute(program);
    // Verify the result is a heap reference
  });
  
  it('should share mutations through references', () => {
    const program = compile(`
      let a = [1, 2, 3];
      let b = a;
      a.push(4);
      b.length
    `);
    const result = vm.execute(program);
    expect(result).toBe(4);
  });
});
```

### 5.3 Integration Tests
- **File**: `/home/laco/cvm/test/integration/heap-efficiency.spec.ts`
- Test 10,000 element arrays
- Test deeply nested objects
- Measure serialization time

## Issue 6: Performance Verification

### 6.1 Benchmark Tests
- **File**: `/home/laco/cvm/packages/vm/src/lib/performance/heap-benchmark.spec.ts`
- Compare inline vs heap performance
- Measure CC() checkpoint speed
- Test memory usage

### 6.2 Key Metrics
- Array access time should not increase by more than 20%
- Serialization should be 90% faster for large arrays
- Memory usage should decrease for programs with shared data

## Build and Test Commands

### 7.1 After Each Fix
```bash
npx nx test vm --watch=false
```

### 7.2 Full Build
```bash
npx nx reset
npx nx run-many --target=build --all --skip-nx-cache
```

### 7.3 Integration Tests
```bash
cd test/integration
npx tsx mcp-test-client.ts ../programs/test-all-features.ts
```

## Success Criteria
1. No VM crashes on invalid heap access
2. No stack overflow on deep structures
3. Clean separation: ARRAY_* for arrays only
4. Consistent undefined handling
5. All tests pass
6. Performance targets met