# CVM Test Improvement Plan (TDD Approach)

## Overview

This plan follows Test-Driven Development (TDD) principles to improve test coverage systematically. Each test will be written BEFORE implementation changes, ensuring we test actual behavior, not assumed behavior.

## Priority 1: heap-helpers.ts (0% coverage)

### Why Critical
- Exported public API functions
- Foundation for external tools using CVM heap
- Currently completely untested

### TDD Test Plan

#### Test 1: dereferenceArray basic functionality
```typescript
// RED: Write test first
it('should dereference a valid array reference', () => {
  const heap = createVMHeap();
  const array = { type: 'array', elements: [1, 2, 3] };
  const ref = heap.allocate('array', array);
  
  const result = dereferenceArray(heap, ref);
  expect(result).toEqual(array);
});

// GREEN: Function already exists, should pass
// REFACTOR: None needed
```

#### Test 2: dereferenceArray error cases
```typescript
// RED: Test invalid reference
it('should throw for invalid array reference', () => {
  const heap = createVMHeap();
  const invalidRef = { type: 'array-ref', id: 999 };
  
  expect(() => dereferenceArray(heap, invalidRef))
    .toThrow('Invalid array reference: 999');
});

// RED: Test wrong type reference
it('should throw when reference points to non-array', () => {
  const heap = createVMHeap();
  const obj = { type: 'object', properties: {} };
  const ref = heap.allocate('object', obj);
  
  expect(() => dereferenceArray(heap, { type: 'array-ref', id: ref.id }))
    .toThrow('Invalid array reference');
});
```

#### Test 3: dereferenceObject (similar pattern)
```typescript
// Tests for object dereferencing following same pattern
```

#### Test 4: resolveValue comprehensive tests
```typescript
// Test resolving primitives (should return as-is)
it('should return primitive values unchanged', () => {
  const heap = createVMHeap();
  expect(resolveValue(heap, 42)).toBe(42);
  expect(resolveValue(heap, "hello")).toBe("hello");
  expect(resolveValue(heap, true)).toBe(true);
});

// Test resolving references
it('should resolve array references', () => {
  const heap = createVMHeap();
  const array = { type: 'array', elements: [1, 2] };
  const ref = heap.allocate('array', array);
  
  const result = resolveValue(heap, ref);
  expect(result).toEqual(array);
});
```

#### Test 5: sameReference tests
```typescript
it('should return true for same references', () => {
  const ref1 = { type: 'array-ref', id: 1 };
  const ref2 = { type: 'array-ref', id: 1 };
  expect(sameReference(ref1, ref2)).toBe(true);
});

it('should return false for different IDs', () => {
  const ref1 = { type: 'array-ref', id: 1 };
  const ref2 = { type: 'array-ref', id: 2 };
  expect(sameReference(ref1, ref2)).toBe(false);
});

it('should return false for different types', () => {
  const ref1 = { type: 'array-ref', id: 1 };
  const ref2 = { type: 'object-ref', id: 1 };
  expect(sameReference(ref1, ref2)).toBe(false);
});
```

#### Test 6: deepCopyValue comprehensive tests
```typescript
// Test primitive copying
it('should return primitives unchanged', () => {
  const heap = createVMHeap();
  expect(deepCopyValue(heap, 42)).toBe(42);
});

// Test array deep copy
it('should create independent array copy', () => {
  const heap = createVMHeap();
  const original = { type: 'array', elements: [1, 2, 3] };
  const ref = heap.allocate('array', original);
  
  const copyRef = deepCopyValue(heap, ref);
  expect(copyRef.id).not.toBe(ref.id);
  
  // Modify original
  original.elements[0] = 99;
  
  // Copy should be unchanged
  const copy = heap.get(copyRef.id).data;
  expect(copy.elements[0]).toBe(1);
});

// Test nested structure deep copy
it('should deep copy nested structures', () => {
  const heap = createVMHeap();
  const innerArray = heap.allocate('array', { type: 'array', elements: [1, 2] });
  const outerArray = heap.allocate('array', { 
    type: 'array', 
    elements: [innerArray, 3] 
  });
  
  const copyRef = deepCopyValue(heap, outerArray);
  // Verify all nested references are new
});
```

## Priority 2: unified.ts GET/SET uncovered lines

### Uncovered Scenarios

#### GET Operation Tests

##### Test 1: Invalid array reference
```typescript
it('should handle invalid array reference in GET', () => {
  const bytecode = [
    { op: OpCode.PUSH, arg: { type: 'array-ref', id: 999 } },
    { op: OpCode.PUSH, arg: 0 },
    { op: OpCode.GET },
    { op: OpCode.HALT }
  ];
  const state = vm.execute(bytecode);
  expect(state.status).toBe('error');
  expect(state.error).toContain('Invalid array reference');
});
```

##### Test 2: String index on array (numeric string)
```typescript
it('should handle numeric string index on array', () => {
  const bytecode = [
    { op: OpCode.ARRAY_NEW },
    { op: OpCode.PUSH, arg: "0" },
    { op: OpCode.PUSH, arg: "value" },
    { op: OpCode.SET },
    { op: OpCode.PUSH, arg: "0" },  // String "0"
    { op: OpCode.GET },
    { op: OpCode.HALT }
  ];
  const state = vm.execute(bytecode);
  expect(state.stack[0]).toBe("value");
});
```

##### Test 3: Non-numeric string on array (property access)
```typescript
it('should access array properties with non-numeric string', () => {
  const bytecode = [
    { op: OpCode.ARRAY_NEW },
    { op: OpCode.PUSH, arg: "length" },
    { op: OpCode.PUSH, arg: 42 },
    { op: OpCode.SET },
    { op: OpCode.PUSH, arg: "length" },
    { op: OpCode.GET },
    { op: OpCode.HALT }
  ];
  const state = vm.execute(bytecode);
  expect(state.stack[0]).toBe(42);
});
```

##### Test 4: Invalid index type
```typescript
it('should error on invalid index type for array', () => {
  const bytecode = [
    { op: OpCode.ARRAY_NEW },
    { op: OpCode.PUSH, arg: true },  // Boolean index
    { op: OpCode.GET },
    { op: OpCode.HALT }
  ];
  const state = vm.execute(bytecode);
  expect(state.status).toBe('error');
  expect(state.error).toContain('requires numeric or numeric string index');
});
```

##### Test 5: Out of bounds access
```typescript
it('should return undefined for out of bounds array access', () => {
  const bytecode = [
    { op: OpCode.ARRAY_NEW },
    { op: OpCode.PUSH, arg: 10 },  // Out of bounds
    { op: OpCode.GET },
    { op: OpCode.HALT }
  ];
  const state = vm.execute(bytecode);
  expect(state.stack[0]).toEqual({ type: 'undefined' });
});
```

##### Test 6: Invalid object reference
```typescript
it('should handle invalid object reference in GET', () => {
  const bytecode = [
    { op: OpCode.PUSH, arg: { type: 'object-ref', id: 999 } },
    { op: OpCode.PUSH, arg: "key" },
    { op: OpCode.GET },
    { op: OpCode.HALT }
  ];
  const state = vm.execute(bytecode);
  expect(state.status).toBe('error');
  expect(state.error).toContain('Invalid object reference');
});
```

##### Test 7: Non-existent object property
```typescript
it('should return undefined for non-existent object property', () => {
  const bytecode = [
    { op: OpCode.OBJECT_CREATE },
    { op: OpCode.PUSH, arg: "nonexistent" },
    { op: OpCode.GET },
    { op: OpCode.HALT }
  ];
  const state = vm.execute(bytecode);
  expect(state.stack[0]).toEqual({ type: 'undefined' });
});
```

##### Test 8: String out of bounds
```typescript
it('should return undefined for out of bounds string access', () => {
  const bytecode = [
    { op: OpCode.PUSH, arg: "hello" },
    { op: OpCode.PUSH, arg: 10 },  // Out of bounds
    { op: OpCode.GET },
    { op: OpCode.HALT }
  ];
  const state = vm.execute(bytecode);
  expect(state.stack[0]).toEqual({ type: 'undefined' });
});
```

##### Test 9: GET on non-indexable type
```typescript
it('should error when GET used on number', () => {
  const bytecode = [
    { op: OpCode.PUSH, arg: 42 },
    { op: OpCode.PUSH, arg: 0 },
    { op: OpCode.GET },
    { op: OpCode.HALT }
  ];
  const state = vm.execute(bytecode);
  expect(state.status).toBe('error');
  expect(state.error).toContain('requires array, object, or string');
});
```

#### SET Operation Tests

##### Test 1: Invalid array reference
```typescript
it('should handle invalid array reference in SET', () => {
  const bytecode = [
    { op: OpCode.PUSH, arg: { type: 'array-ref', id: 999 } },
    { op: OpCode.PUSH, arg: 0 },
    { op: OpCode.PUSH, arg: "value" },
    { op: OpCode.SET },
    { op: OpCode.HALT }
  ];
  const state = vm.execute(bytecode);
  expect(state.status).toBe('error');
  expect(state.error).toContain('Invalid array reference');
});
```

##### Test 2: Negative array index
```typescript
it('should error on negative array index', () => {
  const bytecode = [
    { op: OpCode.ARRAY_NEW },
    { op: OpCode.PUSH, arg: -1 },
    { op: OpCode.PUSH, arg: "value" },
    { op: OpCode.SET },
    { op: OpCode.HALT }
  ];
  const state = vm.execute(bytecode);
  expect(state.status).toBe('error');
  expect(state.error).toContain('Negative index not allowed');
});
```

##### Test 3: Array property with non-numeric string
```typescript
it('should set array property with non-numeric string key', () => {
  const bytecode = [
    { op: OpCode.ARRAY_NEW },
    { op: OpCode.PUSH, arg: "customProp" },
    { op: OpCode.PUSH, arg: "propValue" },
    { op: OpCode.SET },
    { op: OpCode.POP },
    { op: OpCode.PUSH, arg: "customProp" },
    { op: OpCode.GET },
    { op: OpCode.HALT }
  ];
  const state = vm.execute(bytecode);
  expect(state.stack[0]).toBe("propValue");
});
```

##### Test 4: SET on non-array/object
```typescript
it('should error when SET used on string', () => {
  const bytecode = [
    { op: OpCode.PUSH, arg: "hello" },
    { op: OpCode.PUSH, arg: 0 },
    { op: OpCode.PUSH, arg: "x" },
    { op: OpCode.SET },
    { op: OpCode.HALT }
  ];
  const state = vm.execute(bytecode);
  expect(state.status).toBe('error');
  expect(state.error).toContain('requires array or object');
});
```

## Priority 3: Other Critical Gaps

### arrays.ts uncovered lines
- Edge cases for array methods
- Error handling in array operations

### control.ts uncovered lines
- Complex control flow scenarios
- Break/continue edge cases

### Storage adapter tests
- Concurrent access
- Large data handling
- Error recovery

## Implementation Order

1. **Week 1**: heap-helpers.ts complete test suite
2. **Week 1**: unified.ts GET operation tests
3. **Week 2**: unified.ts SET operation tests
4. **Week 2**: arrays.ts edge cases
5. **Week 3**: Storage adapters resilience tests
6. **Week 3**: Integration test scenarios

## Success Criteria

- All packages achieve >85% coverage
- No critical paths with <80% coverage
- All error paths tested
- Performance benchmarks established

## TDD Process Reminders

1. **RED**: Write failing test first
2. **GREEN**: Write minimal code to pass
3. **REFACTOR**: Improve code while keeping tests green
4. Never write code without a failing test
5. Test behavior, not implementation

## Notes

- Use actual code references, not assumptions
- Each test should test ONE specific behavior
- Error messages should be verified exactly
- Edge cases are as important as happy paths