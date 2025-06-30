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
      elements: [1] 
    });
    const obj = heap.allocate('object', { 
      type: 'object' as const, 
      properties: { arr: array, val: 42 } 
    });
    
    const copyRef = deepCopyValue(heap, obj) as CVMObjectRef;
    const copyData = heap.get(copyRef.id)!.data as any;
    const arrCopyRef = copyData.properties.arr as CVMArrayRef;
    
    expect(copyRef.id).not.toBe(obj.id);
    expect(arrCopyRef.id).not.toBe(array.id);
  });
});