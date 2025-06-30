# CVM Test Implementation Plan - Precise & Executable

## Execution Order & Time Estimate

Total estimated time: **3-4 hours** for all tests

## Phase 1: heap-helpers.ts Tests (45 minutes)

### File: `/home/laco/cvm/packages/vm/src/lib/heap-helpers.spec.ts` (NEW FILE)

```typescript
import { describe, it, expect } from 'vitest';
import { 
  dereferenceArray, 
  dereferenceObject, 
  resolveValue, 
  sameReference, 
  deepCopyValue 
} from './heap-helpers.js';
import { createVMHeap } from './vm-heap.js';
import { CVMArrayRef, CVMObjectRef } from '@cvm/types';
```

#### Test Suite 1: dereferenceArray (10 min)

**Lines to cover**: heap-helpers.ts:11-17

```typescript
describe('dereferenceArray', () => {
  it('should dereference a valid array reference', () => {
    const heap = createVMHeap();
    const array = { type: 'array' as const, elements: [1, 2, 3] };
    const ref = heap.allocate('array', array);
    
    const result = dereferenceArray(heap, ref as CVMArrayRef);
    expect(result).toEqual(array);
  });

  it('should throw for non-existent reference', () => {
    const heap = createVMHeap();
    const invalidRef: CVMArrayRef = { type: 'array-ref', id: 999 };
    
    expect(() => dereferenceArray(heap, invalidRef))
      .toThrow('Invalid array reference: 999');
  });

  it('should throw when reference points to object not array', () => {
    const heap = createVMHeap();
    const obj = { type: 'object' as const, properties: {} };
    const objRef = heap.allocate('object', obj);
    const arrayRef: CVMArrayRef = { type: 'array-ref', id: objRef.id };
    
    expect(() => dereferenceArray(heap, arrayRef))
      .toThrow('Invalid array reference: ' + objRef.id);
  });
});
```

#### Test Suite 2: dereferenceObject (10 min)

**Lines to cover**: heap-helpers.ts:25-31

```typescript
describe('dereferenceObject', () => {
  it('should dereference a valid object reference', () => {
    const heap = createVMHeap();
    const obj = { type: 'object' as const, properties: { a: 1, b: 2 } };
    const ref = heap.allocate('object', obj);
    
    const result = dereferenceObject(heap, ref as CVMObjectRef);
    expect(result).toEqual(obj);
  });

  it('should throw for non-existent reference', () => {
    const heap = createVMHeap();
    const invalidRef: CVMObjectRef = { type: 'object-ref', id: 999 };
    
    expect(() => dereferenceObject(heap, invalidRef))
      .toThrow('Invalid object reference: 999');
  });

  it('should throw when reference points to array not object', () => {
    const heap = createVMHeap();
    const array = { type: 'array' as const, elements: [] };
    const arrayRef = heap.allocate('array', array);
    const objRef: CVMObjectRef = { type: 'object-ref', id: arrayRef.id };
    
    expect(() => dereferenceObject(heap, objRef))
      .toThrow('Invalid object reference: ' + arrayRef.id);
  });
});
```

#### Test Suite 3: resolveValue (5 min)

**Lines to cover**: heap-helpers.ts:39-46

```typescript
describe('resolveValue', () => {
  it('should return primitives unchanged', () => {
    const heap = createVMHeap();
    expect(resolveValue(heap, 42)).toBe(42);
    expect(resolveValue(heap, "hello")).toBe("hello");
    expect(resolveValue(heap, true)).toBe(true);
    expect(resolveValue(heap, null)).toBe(null);
    expect(resolveValue(heap, { type: 'undefined' })).toEqual({ type: 'undefined' });
  });

  it('should resolve array references', () => {
    const heap = createVMHeap();
    const array = { type: 'array' as const, elements: [1, 2] };
    const ref = heap.allocate('array', array);
    
    const result = resolveValue(heap, ref);
    expect(result).toEqual(array);
  });

  it('should resolve object references', () => {
    const heap = createVMHeap();
    const obj = { type: 'object' as const, properties: { x: 10 } };
    const ref = heap.allocate('object', obj);
    
    const result = resolveValue(heap, ref);
    expect(result).toEqual(obj);
  });
});
```

#### Test Suite 4: sameReference (5 min)

**Lines to cover**: heap-helpers.ts:54-56

```typescript
describe('sameReference', () => {
  it('should return true for identical references', () => {
    const ref1: CVMArrayRef = { type: 'array-ref', id: 1 };
    const ref2: CVMArrayRef = { type: 'array-ref', id: 1 };
    expect(sameReference(ref1, ref2)).toBe(true);
  });

  it('should return false for different IDs', () => {
    const ref1: CVMArrayRef = { type: 'array-ref', id: 1 };
    const ref2: CVMArrayRef = { type: 'array-ref', id: 2 };
    expect(sameReference(ref1, ref2)).toBe(false);
  });

  it('should return false for different types', () => {
    const ref1: CVMArrayRef = { type: 'array-ref', id: 1 };
    const ref2: CVMObjectRef = { type: 'object-ref', id: 1 };
    expect(sameReference(ref1, ref2)).toBe(false);
  });

  it('should handle object references', () => {
    const ref1: CVMObjectRef = { type: 'object-ref', id: 5 };
    const ref2: CVMObjectRef = { type: 'object-ref', id: 5 };
    expect(sameReference(ref1, ref2)).toBe(true);
  });
});
```

#### Test Suite 5: deepCopyValue (15 min)

**Lines to cover**: heap-helpers.ts:65-88

```typescript
describe('deepCopyValue', () => {
  it('should return primitives unchanged', () => {
    const heap = createVMHeap();
    expect(deepCopyValue(heap, 42)).toBe(42);
    expect(deepCopyValue(heap, "test")).toBe("test");
    expect(deepCopyValue(heap, false)).toBe(false);
    expect(deepCopyValue(heap, null)).toBe(null);
  });

  it('should create independent array copy', () => {
    const heap = createVMHeap();
    const original = { type: 'array' as const, elements: [1, 2, 3] };
    const ref = heap.allocate('array', original);
    
    const copyRef = deepCopyValue(heap, ref) as CVMArrayRef;
    expect(copyRef.type).toBe('array-ref');
    expect(copyRef.id).not.toBe(ref.id);
    
    // Verify independence
    const originalData = heap.get(ref.id)!.data as any;
    const copyData = heap.get(copyRef.id)!.data as any;
    originalData.elements[0] = 99;
    expect(copyData.elements[0]).toBe(1);
  });

  it('should deep copy nested arrays', () => {
    const heap = createVMHeap();
    const innerArray = heap.allocate('array', { 
      type: 'array' as const, 
      elements: [1, 2] 
    });
    const outerArray = heap.allocate('array', { 
      type: 'array' as const, 
      elements: [innerArray, 3] 
    });
    
    const copyRef = deepCopyValue(heap, outerArray) as CVMArrayRef;
    const copyData = heap.get(copyRef.id)!.data as any;
    const innerCopyRef = copyData.elements[0] as CVMArrayRef;
    
    // All references should be different
    expect(copyRef.id).not.toBe(outerArray.id);
    expect(innerCopyRef.id).not.toBe(innerArray.id);
  });

  it('should create independent object copy', () => {
    const heap = createVMHeap();
    const original = { 
      type: 'object' as const, 
      properties: { a: 1, b: "test" } 
    };
    const ref = heap.allocate('object', original);
    
    const copyRef = deepCopyValue(heap, ref) as CVMObjectRef;
    expect(copyRef.type).toBe('object-ref');
    expect(copyRef.id).not.toBe(ref.id);
    
    // Verify independence
    const originalData = heap.get(ref.id)!.data as any;
    const copyData = heap.get(copyRef.id)!.data as any;
    originalData.properties.a = 99;
    expect(copyData.properties.a).toBe(1);
  });

  it('should deep copy nested objects', () => {
    const heap = createVMHeap();
    const innerObj = heap.allocate('object', { 
      type: 'object' as const, 
      properties: { x: 10 } 
    });
    const outerObj = heap.allocate('object', { 
      type: 'object' as const, 
      properties: { inner: innerObj, y: 20 } 
    });
    
    const copyRef = deepCopyValue(heap, outerObj) as CVMObjectRef;
    const copyData = heap.get(copyRef.id)!.data as any;
    const innerCopyRef = copyData.properties.inner as CVMObjectRef;
    
    expect(copyRef.id).not.toBe(outerObj.id);
    expect(innerCopyRef.id).not.toBe(innerObj.id);
  });

  it('should handle mixed nested structures', () => {
    const heap = createVMHeap();
    const array = heap.allocate('array', { 
      type: 'array' as const, 
      elements: [1, 2] 
    });
    const obj = heap.allocate('object', { 
      type: 'object' as const, 
      properties: { 
        arr: array, 
        num: 42,
        str: "test"
      } 
    });
    
    const copyRef = deepCopyValue(heap, obj) as CVMObjectRef;
    const copyData = heap.get(copyRef.id)!.data as any;
    const arrayCopyRef = copyData.properties.arr as CVMArrayRef;
    
    expect(copyRef.id).not.toBe(obj.id);
    expect(arrayCopyRef.id).not.toBe(array.id);
    expect(copyData.properties.num).toBe(42);
    expect(copyData.properties.str).toBe("test");
  });
});
```

## Phase 2: unified.ts GET Tests (1 hour)

### File: `/home/laco/cvm/packages/vm/src/lib/handlers/unified-get-set.spec.ts` (APPEND)

#### Test Suite 6: GET Error Cases (30 min)

**Lines to cover**: unified.ts:26-31, 50-56, 65-72, 100-106

```typescript
describe('Unified GET opcode - Error Cases', () => {
  const vm = new VM();

  it('should error on invalid array reference', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: { type: 'array-ref', id: 999 } },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('GET: Invalid array reference');
  });

  it('should error on invalid object reference', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: { type: 'object-ref', id: 999 } },
      { op: OpCode.PUSH, arg: "key" },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('GET: Invalid object reference');
  });

  it('should error with boolean index on array', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.PUSH, arg: true },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('GET: GET requires numeric or numeric string index for arrays');
  });

  it('should error with object index on array', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.DUP }, // Save array ref
      { op: OpCode.OBJECT_CREATE },
      { op: OpCode.SWAP }, // Array back on top
      { op: OpCode.SWAP }, // Object as index
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('GET: GET requires numeric or numeric string index for arrays');
  });

  it('should error on non-indexable type (number)', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: 42 },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('GET: GET requires array, object, or string');
  });

  it('should error on non-indexable type (boolean)', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: true },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('GET: GET requires array, object, or string');
  });

  it('should error on undefined type', () => {
    const bytecode = [
      { op: OpCode.PUSH_UNDEFINED },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('GET: GET requires array, object, or string');
  });
});
```

#### Test Suite 7: GET Edge Cases (30 min)

**Lines to cover**: unified.ts:39-48, 58-59, 74-76, 83-96

```typescript
describe('Unified GET opcode - Edge Cases', () => {
  const vm = new VM();

  it('should handle numeric string index on array', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.DUP },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.ARRAY_SET },
      { op: OpCode.PUSH, arg: "0" },  // String "0"
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("value");
  });

  it('should handle non-numeric string on array (property access)', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.DUP },
      { op: OpCode.PUSH, arg: "customProp" },
      { op: OpCode.PUSH, arg: "propValue" },
      { op: OpCode.SET },
      { op: OpCode.POP }, // Remove array ref from SET
      { op: OpCode.PUSH, arg: "customProp" },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("propValue");
  });

  it('should return undefined for non-existent array property', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.PUSH, arg: "nonExistent" },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toEqual({ type: 'undefined' });
  });

  it('should return undefined for out of bounds array access', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.PUSH, arg: 10 },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toEqual({ type: 'undefined' });
  });

  it('should return undefined for negative array index', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.PUSH, arg: -1 },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toEqual({ type: 'undefined' });
  });

  it('should return undefined for non-existent object property', () => {
    const bytecode = [
      { op: OpCode.OBJECT_CREATE },
      { op: OpCode.PUSH, arg: "nonExistent" },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toEqual({ type: 'undefined' });
  });

  it('should convert number index to string for object', () => {
    const bytecode = [
      { op: OpCode.OBJECT_CREATE },
      { op: OpCode.DUP },
      { op: OpCode.PUSH, arg: "42" },
      { op: OpCode.PUSH, arg: "answer" },
      { op: OpCode.SET },
      { op: OpCode.POP },
      { op: OpCode.PUSH, arg: 42 },  // Number 42
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("answer");
  });

  it('should handle numeric string index on string', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: "hello" },
      { op: OpCode.PUSH, arg: "1" },  // String "1"
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("e");
  });

  it('should return undefined for out of bounds string access', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: "hello" },
      { op: OpCode.PUSH, arg: 10 },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toEqual({ type: 'undefined' });
  });

  it('should return undefined for negative string index', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: "hello" },
      { op: OpCode.PUSH, arg: -1 },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toEqual({ type: 'undefined' });
  });

  it('should return undefined for non-numeric string index on string', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: "hello" },
      { op: OpCode.PUSH, arg: "abc" },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toEqual({ type: 'undefined' });
  });

  it('should handle fractional numeric string correctly', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.DUP },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.PUSH, arg: "first" },
      { op: OpCode.ARRAY_SET },
      { op: OpCode.PUSH, arg: "0.5" },  // Not a valid integer string
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toEqual({ type: 'undefined' });
  });
});
```

## Phase 3: unified.ts SET Tests (45 minutes)

#### Test Suite 8: SET Error Cases (25 min)

**Lines to cover**: unified.ts:122-128, 149-155, 158-165, 174-181, 189-195

```typescript
describe('Unified SET opcode - Error Cases', () => {
  const vm = new VM();

  it('should error on invalid array reference', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: { type: 'array-ref', id: 999 } },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('SET: Invalid array reference');
  });

  it('should error on invalid object reference', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: { type: 'object-ref', id: 999 } },
      { op: OpCode.PUSH, arg: "key" },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('SET: Invalid object reference');
  });

  it('should error with boolean index on array', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.PUSH, arg: true },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('SET: SET requires numeric or numeric string index for arrays');
  });

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
    expect(state.error).toBe('SET: SET: Negative index not allowed');
  });

  it('should error on negative numeric string index', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.PUSH, arg: "-1" },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('SET: SET: Negative index not allowed');
  });

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
    expect(state.error).toBe('SET: SET requires array or object');
  });

  it('should error when SET used on number', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: 42 },
      { op: OpCode.PUSH, arg: "prop" },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('SET: SET requires array or object');
  });

  it('should error when SET used on boolean', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: true },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('SET: SET requires array or object');
  });

  it('should error when SET used on undefined', () => {
    const bytecode = [
      { op: OpCode.PUSH_UNDEFINED },
      { op: OpCode.PUSH, arg: "key" },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('SET: SET requires array or object');
  });
});
```

#### Test Suite 9: SET Edge Cases (20 min)

**Lines to cover**: unified.ts:136-147, 167-168, 183-185

```typescript
describe('Unified SET opcode - Edge Cases', () => {
  const vm = new VM();

  it('should handle numeric string index on array', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.DUP },
      { op: OpCode.PUSH, arg: "2" },  // String "2"
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.PUSH, arg: 2 },    // Number 2
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("value");
  });

  it('should set array property with non-numeric string key', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.DUP },
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

  it('should auto-expand array when setting beyond bounds', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.DUP },
      { op: OpCode.PUSH, arg: 5 },    // Index 5 in empty array
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.PUSH, arg: 5 },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("value");
  });

  it('should floor fractional array indices', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.DUP },
      { op: OpCode.PUSH, arg: 2.7 },  // Should be treated as 2
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.PUSH, arg: 2 },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("value");
  });

  it('should convert any key type to string for objects', () => {
    const bytecode = [
      { op: OpCode.OBJECT_CREATE },
      { op: OpCode.DUP },
      { op: OpCode.PUSH, arg: 42 },   // Number key
      { op: OpCode.PUSH, arg: "answer" },
      { op: OpCode.SET },
      { op: OpCode.POP },
      { op: OpCode.PUSH, arg: "42" }, // String "42"
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("answer");
  });

  it('should return target reference after SET', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      // Stack should now have the array ref
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("value");
  });

  it('should create array properties object if not exists', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.DUP },
      // First verify no properties
      { op: OpCode.PUSH, arg: "test" },
      { op: OpCode.GET },
      { op: OpCode.POP }, // Remove undefined
      // Now set property
      { op: OpCode.PUSH, arg: "test" },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.POP },
      { op: OpCode.PUSH, arg: "test" },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("value");
  });
});
```

## Phase 4: Verification & Additional Tests (30 minutes)

### Run Coverage Check
```bash
npx nx run vm:test --coverage
npx nx run parser:test --coverage
```

### Create Integration Test File: `/home/laco/cvm/test/integration/heap-unified-integration.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { VMManager } from '@cvm/vm';

describe('Heap and Unified Operations Integration', () => {
  it('should handle complex nested structure manipulation', async () => {
    const vmManager = new VMManager();
    await vmManager.initialize();
    
    const program = `
      function main() {
        // Create nested structure
        const data = {
          users: [
            { name: "Alice", scores: [10, 20] },
            { name: "Bob", scores: [15, 25] }
          ]
        };
        
        // Access nested property
        const firstUser = data.users[0];
        const firstName = firstUser.name;
        
        // Modify nested array
        data.users[1].scores[0] = 30;
        
        // Add new property
        data.totalUsers = 2;
        
        return data.users[1].scores[0]; // Should be 30
      }
      main();
    `;
    
    await vmManager.loadProgram('test', program);
    await vmManager.startExecution('test', 'exec1');
    
    const result = await vmManager.continueExecution('exec1');
    expect(result.type).toBe('completed');
    expect(result.result).toBe(30);
    
    await vmManager.dispose();
  });
});
```

## Execution Instructions

1. **Create test files in order**:
   - First: heap-helpers.spec.ts (new file)
   - Second: Add to unified-get-set.spec.ts
   - Third: Create integration test

2. **Run tests after each phase**:
   ```bash
   npx nx test vm -- heap-helpers.spec.ts
   npx nx test vm -- unified-get-set.spec.ts
   ```

3. **Check coverage improvement**:
   ```bash
   npx nx run vm:test --coverage
   ```

4. **Expected Results**:
   - heap-helpers.ts: 0% → 100%
   - unified.ts: 44% → 95%+
   - Overall VM package: 78% → 88%+

## Time Breakdown

- Phase 1 (heap-helpers): 45 min
- Phase 2 (GET tests): 60 min
- Phase 3 (SET tests): 45 min
- Phase 4 (verification): 30 min
- **Total: ~3 hours**

All tests follow TDD principles:
1. Test is written based on expected behavior
2. Test will pass because code already exists
3. Coverage gaps will be filled

The uncovered lines are now precisely targeted with specific test cases.