import type { CVMArray, CVMObject, CVMArrayRef, CVMObjectRef } from '@cvm/types';

export interface HeapObject {
  id: number;
  type: 'array' | 'object';
  data: CVMArray | CVMObject;
}

export interface VMHeap {
  objects: Map<number, HeapObject>;
  nextId: number;
  allocate(type: 'array', data: CVMArray): CVMArrayRef;
  allocate(type: 'object', data: CVMObject): CVMObjectRef;
  get(id: number): HeapObject | undefined;
}

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