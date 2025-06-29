import type { CVMValue, CVMArrayRef, CVMObjectRef, CVMArray, CVMObject } from '@cvm/types';
import type { VMHeap } from './vm-heap.js';
import { isCVMArrayRef, isCVMObjectRef } from '@cvm/types';

/**
 * Dereferences a heap reference to get the actual array
 * @param heap The VM heap instance
 * @param ref The array reference to dereference
 * @returns The array data or throws if invalid reference
 */
export function dereferenceArray(heap: VMHeap, ref: CVMArrayRef): CVMArray {
  const heapObj = heap.get(ref.id);
  if (!heapObj || heapObj.type !== 'array') {
    throw new Error(`Invalid array reference: ${ref.id}`);
  }
  return heapObj.data as CVMArray;
}

/**
 * Dereferences a heap reference to get the actual object
 * @param heap The VM heap instance
 * @param ref The object reference to dereference
 * @returns The object data or throws if invalid reference
 */
export function dereferenceObject(heap: VMHeap, ref: CVMObjectRef): CVMObject {
  const heapObj = heap.get(ref.id);
  if (!heapObj || heapObj.type !== 'object') {
    throw new Error(`Invalid object reference: ${ref.id}`);
  }
  return heapObj.data as CVMObject;
}

/**
 * Gets the actual value from a reference or returns the value if not a reference
 * @param heap The VM heap instance
 * @param value The value that might be a reference
 * @returns The dereferenced value or the original value
 */
export function resolveValue(heap: VMHeap, value: CVMValue): CVMValue {
  if (isCVMArrayRef(value)) {
    return dereferenceArray(heap, value);
  } else if (isCVMObjectRef(value)) {
    return dereferenceObject(heap, value);
  }
  return value;
}

/**
 * Checks if two references point to the same heap object
 * @param ref1 First reference
 * @param ref2 Second reference
 * @returns true if both references point to the same object
 */
export function sameReference(ref1: CVMArrayRef | CVMObjectRef, ref2: CVMArrayRef | CVMObjectRef): boolean {
  return ref1.type === ref2.type && ref1.id === ref2.id;
}

/**
 * Creates a deep copy of a heap object's data
 * This is useful for operations that need to create independent copies
 * @param heap The VM heap instance
 * @param value The value to copy (might be a reference)
 * @returns A new independent copy of the data
 */
export function deepCopyValue(heap: VMHeap, value: CVMValue): CVMValue {
  if (isCVMArrayRef(value)) {
    const array = dereferenceArray(heap, value);
    // Create a new array with copied elements
    const newArray: CVMArray = {
      type: 'array',
      elements: array.elements.map(el => deepCopyValue(heap, el))
    };
    return heap.allocate('array', newArray);
  } else if (isCVMObjectRef(value)) {
    const obj = dereferenceObject(heap, value);
    // Create a new object with copied properties
    const newObj: CVMObject = {
      type: 'object',
      properties: {}
    };
    for (const [key, val] of Object.entries(obj.properties)) {
      newObj.properties[key] = deepCopyValue(heap, val);
    }
    return heap.allocate('object', newObj);
  }
  // Primitive values are immutable, return as-is
  return value;
}