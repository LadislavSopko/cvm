import type { CVMArray, CVMObject, CVMArrayRef, CVMObjectRef } from '@cvm/types';

/**
 * Represents an object stored in the VM heap
 */
export interface HeapObject {
  /** Unique identifier for the heap object */
  id: number;
  /** Type of the stored object */
  type: 'array' | 'object';
  /** The actual data stored (array or object) */
  data: CVMArray | CVMObject;
}

/**
 * Virtual Machine Heap for storing arrays and objects by reference
 * This enables efficient memory usage and proper JavaScript reference semantics
 */
export interface VMHeap {
  /** Map of object IDs to heap objects */
  objects: Map<number, HeapObject>;
  /** Next available ID for heap allocation */
  nextId: number;
  /** Allocate an array on the heap and return a reference */
  allocate(type: 'array', data: CVMArray): CVMArrayRef;
  /** Allocate an object on the heap and return a reference */
  allocate(type: 'object', data: CVMObject): CVMObjectRef;
  /** Get a heap object by its ID */
  get(id: number): HeapObject | undefined;
}

/**
 * Creates a new VM heap instance
 * @returns A new VMHeap with empty storage
 */
export function createVMHeap(): VMHeap {
  const objects = new Map<number, HeapObject>();
  let nextId = 1;

  return {
    objects,
    nextId,
    
    allocate(type: 'array' | 'object', data: CVMArray | CVMObject): any {
      const id = nextId++;
      const heapObject: HeapObject = { id, type, data };
      objects.set(id, heapObject);
      
      // Return appropriate reference type based on data type
      if (type === 'array') {
        return { type: 'array-ref', id } as CVMArrayRef;
      } else {
        return { type: 'object-ref', id } as CVMObjectRef;
      }
    },
    
    get(id: number): HeapObject | undefined {
      const obj = objects.get(id);
      if (!obj) {
        throw new Error(`Invalid heap reference: ${id}`);
      }
      return obj;
    }
  };
}