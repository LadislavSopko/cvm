2# Reference-Based Object Storage Implementation Plan for CVM

## Overview
This document outlines a rigorous TDD implementation plan for transforming CVM's value storage from inline nested structures to a reference-based heap system. This will solve the disk storage explosion problem when dealing with large arrays/objects while maintaining JavaScript semantics.

## Goals
1. Replace inline storage of arrays/objects with reference-based heap storage
2. Maintain JavaScript reference semantics (mutations visible through all references)
3. Reduce serialization size for large data structures
4. Enable future reference counting for garbage collection
5. Zero breaking changes to existing CVM programs

## Current Architecture Analysis

### Value Storage
- Arrays/objects stored inline as `CVMArray` and `CVMObject` types
- Variables stored in `Map<string, CVMValue>` 
- Deep nesting causes serialization explosion with large arrays

### Key Files
- `/packages/types/src/lib/cvm-value.ts` - Type definitions
- `/packages/vm/src/lib/vm.ts` - VM state and execution
- `/packages/vm/src/lib/vm-manager.ts` - State persistence
- `/packages/vm/src/lib/handlers/*.ts` - Opcode implementations
- Storage adapters handle serialization/deserialization

## Implementation Phases

### Phase 1: Type System Foundation (Day 1 Morning)

#### 1.1 Create Reference Type Tests
```typescript
// packages/types/src/lib/cvm-value-refs.spec.ts
describe('CVMValue Reference Types', () => {
  describe('Type Guards', () => {
    it('should identify array references', () => {
      const ref: CVMValue = { type: 'array-ref', id: 123 };
      expect(isCVMArrayRef(ref)).toBe(true);
      expect(isCVMObjectRef(ref)).toBe(false);
    });

    it('should identify object references', () => {
      const ref: CVMValue = { type: 'object-ref', id: 456 };
      expect(isCVMObjectRef(ref)).toBe(true);
      expect(isCVMArrayRef(ref)).toBe(false);
    });

    it('should not identify primitives as references', () => {
      expect(isCVMArrayRef('string')).toBe(false);
      expect(isCVMArrayRef(123)).toBe(false);
      expect(isCVMArrayRef(true)).toBe(false);
      expect(isCVMArrayRef(null)).toBe(false);
    });
  });
});
```

#### 1.2 Implement Reference Types
```typescript
// packages/types/src/lib/cvm-value.ts
// Add new interfaces and update CVMValue union
// Implement type guards
```

#### 1.3 Create Heap Type Tests
```typescript
// packages/vm/src/lib/vm-heap.spec.ts
describe('VM Heap', () => {
  describe('Heap Operations', () => {
    it('should allocate array in heap', () => {
      const heap = createVMHeap();
      const array: CVMArray = { type: 'array', elements: [1, 2, 3] };
      const ref = heap.allocate('array', array);
      
      expect(ref.id).toBe(1);
      expect(heap.get(ref.id)?.data).toEqual(array);
    });

    it('should increment ID for each allocation', () => {
      const heap = createVMHeap();
      const ref1 = heap.allocate('array', { type: 'array', elements: [] });
      const ref2 = heap.allocate('object', { type: 'object', properties: {} });
      
      expect(ref2.id).toBe(ref1.id + 1);
    });

    it('should throw on invalid reference access', () => {
      const heap = createVMHeap();
      expect(() => heap.get(999)).toThrow('Invalid heap reference: 999');
    });
  });
});
```

#### 1.4 Implement Heap Structure
```typescript
// packages/vm/src/lib/vm-heap.ts
// Create heap management functions
// Add to VMState interface
```

### Phase 2: Array Creation and Basic Operations (Day 1 Afternoon)

#### 2.1 Test Array Creation Returns References
```typescript
// packages/vm/src/lib/handlers/arrays-ref.spec.ts
describe('Array Reference Operations', () => {
  it('should create array reference on ARRAY_NEW', () => {
    const vm = new VM();
    const state = vm.createInitialState();
    
    vm.executeInstruction(state, { op: OpCode.ARRAY_NEW });
    
    const result = state.stack[0];
    expect(isCVMArrayRef(result)).toBe(true);
    expect(state.heap.objects.has((result as CVMArrayRef).id)).toBe(true);
  });

  it('should handle ARRAY_PUSH with references', () => {
    const vm = new VM();
    const state = vm.createInitialState();
    
    // Create array
    vm.executeInstruction(state, { op: OpCode.ARRAY_NEW });
    const arrayRef = state.stack.pop()!;
    
    // Push value
    state.stack.push(arrayRef);
    state.stack.push('hello');
    vm.executeInstruction(state, { op: OpCode.ARRAY_PUSH });
    
    // Verify
    const heapArray = state.heap.objects.get((arrayRef as CVMArrayRef).id)!;
    expect((heapArray.data as CVMArray).elements).toEqual(['hello']);
  });
});
```

#### 2.2 Implement Array Reference Handlers
```typescript
// Update packages/vm/src/lib/handlers/arrays.ts
// Modify ARRAY_NEW, ARRAY_PUSH, ARRAY_GET, ARRAY_SET, ARRAY_LENGTH
```

### Phase 3: Object Creation and Property Access (Day 2 Morning)

#### 3.1 Test Object Reference Operations
```typescript
// packages/vm/src/lib/handlers/objects-ref.spec.ts
describe('Object Reference Operations', () => {
  it('should create object reference on OBJECT_CREATE', () => {
    const vm = new VM();
    const state = vm.createInitialState();
    
    vm.executeInstruction(state, { op: OpCode.OBJECT_CREATE });
    
    const result = state.stack[0];
    expect(isCVMObjectRef(result)).toBe(true);
  });

  it('should handle PROPERTY_SET with references', () => {
    const vm = new VM();
    const state = vm.createInitialState();
    
    // Create object
    vm.executeInstruction(state, { op: OpCode.OBJECT_CREATE });
    const objRef = state.stack.pop()!;
    
    // Set property
    state.stack.push(objRef);
    state.stack.push('key');
    state.stack.push('value');
    vm.executeInstruction(state, { op: OpCode.PROPERTY_SET });
    
    // Verify
    const heapObj = state.heap.objects.get((objRef as CVMObjectRef).id)!;
    expect((heapObj.data as CVMObject).properties['key']).toBe('value');
  });
});
```

#### 3.2 Implement Object Reference Handlers
```typescript
// Update packages/vm/src/lib/handlers/objects.ts
// Modify OBJECT_CREATE, PROPERTY_GET, PROPERTY_SET, PROPERTY_DELETE
```

### Phase 4: Reference Semantics and Variable Storage (Day 2 Afternoon)

#### 4.1 Test Reference Semantics
```typescript
// packages/vm/src/lib/vm-reference-semantics.spec.ts
describe('Reference Semantics', () => {
  it('should share array mutations through references', () => {
    const vm = new VM();
    const program = compile(`
      let a = [1, 2, 3];
      let b = a;
      a.push(4);
      console.log(b.length); // Should be 4
    `);
    
    const output = vm.execute(program);
    expect(output).toContain('4');
  });

  it('should maintain separate arrays when assigned separately', () => {
    const vm = new VM();
    const program = compile(`
      let a = [1, 2, 3];
      let b = [1, 2, 3];
      a.push(4);
      console.log(b.length); // Should still be 3
    `);
    
    const output = vm.execute(program);
    expect(output).toContain('3');
  });

  it('should handle nested structures', () => {
    const vm = new VM();
    const program = compile(`
      let obj = { arr: [1, 2, 3] };
      let ref = obj.arr;
      ref.push(4);
      console.log(obj.arr.length); // Should be 4
    `);
    
    const output = vm.execute(program);
    expect(output).toContain('4');
  });
});
```

#### 4.2 Update Variable Operations
```typescript
// Update packages/vm/src/lib/handlers/variables.ts
// Ensure STORE, LOAD handle references correctly
```

### Phase 5: Serialization and Persistence (Day 3 Morning)

#### 5.1 Test State Serialization with Heap
```typescript
// packages/vm/src/lib/vm-manager-heap.spec.ts
describe('VM Manager Heap Serialization', () => {
  it('should serialize heap with execution state', async () => {
    const manager = new VMManager(storage);
    const program = compile('let arr = [1, 2, 3];');
    
    await manager.loadProgram('test', program);
    await manager.startExecution('test', 'exec1');
    
    const execution = await storage.getExecution('exec1');
    expect(execution.heap).toBeDefined();
    expect(execution.heap.objects).toBeInstanceOf(Array);
    expect(execution.heap.nextId).toBeGreaterThan(0);
  });

  it('should restore heap on execution resume', async () => {
    const manager = new VMManager(storage);
    // Create execution with array
    // Save at CC point
    // Resume and verify array is accessible
  });

  it('should handle large arrays efficiently', async () => {
    const manager = new VMManager(storage);
    const program = compile(`
      let files = [];
      for (let i = 0; i < 10000; i++) {
        files.push('/path/to/file' + i);
      }
      CC('Ready to process files');
    `);
    
    // Verify serialized size is reasonable (just reference, not 10k strings)
  });
});
```

#### 5.2 Implement Serialization Logic
```typescript
// Update packages/vm/src/lib/vm-manager.ts
// Add heap serialization/deserialization
// Update storage adapters if needed
```

### Phase 6: Equality and Type Operations (Day 3 Afternoon)

#### 6.1 Test Reference Equality
```typescript
// packages/vm/src/lib/handlers/operators-ref.spec.ts
describe('Reference Equality', () => {
  it('should compare array references correctly', () => {
    const vm = new VM();
    const program = compile(`
      let a = [1, 2, 3];
      let b = a;
      let c = [1, 2, 3];
      console.log(a === b); // true
      console.log(a === c); // false
    `);
    
    const output = vm.execute(program);
    expect(output).toContain('true');
    expect(output).toContain('false');
  });

  it('should handle typeof with references', () => {
    const vm = new VM();
    const program = compile(`
      let arr = [1, 2, 3];
      console.log(typeof arr); // 'object'
    `);
    
    const output = vm.execute(program);
    expect(output).toContain('object');
  });
});
```

#### 6.2 Update Comparison Operators
```typescript
// Update packages/vm/src/lib/handlers/operators.ts
// Modify EQ, NEQ, STRICT_EQ, STRICT_NEQ
// Update TYPEOF to handle references
```

### Phase 7: Integration and Migration (Day 4)

#### 7.1 Integration Tests
```typescript
// packages/vm/src/lib/vm-integration-heap.spec.ts
describe('Heap Integration Tests', () => {
  it('should handle complex program with shared references', () => {
    // Test real-world scenario like file processing
  });

  it('should maintain backward compatibility', () => {
    // Ensure existing programs still work
  });

  it('should reduce storage size for large arrays', () => {
    // Measure actual storage savings
  });
});
```

#### 7.2 Performance Tests
```typescript
// packages/vm/src/lib/vm-performance-heap.spec.ts
describe('Heap Performance', () => {
  it('should not regress array access performance', () => {
    // Benchmark array operations
  });

  it('should improve serialization performance', () => {
    // Benchmark CC() checkpoint speed
  });
});
```

### Phase 8: Future - Reference Counting (Optional)

#### 8.1 Test Reference Counting
```typescript
// packages/vm/src/lib/vm-refcount.spec.ts
describe('Reference Counting', () => {
  it('should track reference count', () => {
    // Test increment/decrement on assign/delete
  });

  it('should collect zero-ref objects', () => {
    // Test automatic cleanup
  });

  it('should handle circular references gracefully', () => {
    // Test cycle detection or weak refs
  });
});
```

## Test Execution Strategy

1. **Test First**: Write failing test for each atomic feature
2. **Implement Minimum**: Write just enough code to pass
3. **Refactor**: Clean up while keeping tests green
4. **No Regression**: Run full test suite after each change

## Success Criteria

1. All existing tests pass without modification
2. New reference semantics tests pass
3. Storage size reduced by >90% for large array programs
4. No performance regression in benchmarks
5. Clean, maintainable code with 100% test coverage

## Risk Mitigation

1. **Feature Flag**: Add `--enable-heap-refs` flag for gradual rollout
2. **Compatibility Mode**: Support both inline and ref storage during transition
3. **Comprehensive Testing**: Edge cases, error conditions, performance
4. **Incremental Release**: Deploy in phases, monitor production

## Timeline

- Day 1: Type system and array operations
- Day 2: Objects and reference semantics  
- Day 3: Serialization and operators
- Day 4: Integration, performance, and cleanup

This plan provides atomic, testable steps to transform CVM's storage model while maintaining quality and compatibility.