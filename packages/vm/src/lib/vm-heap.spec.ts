import { describe, it, expect } from 'vitest';
import { createVMHeap } from './vm-heap.js';
import type { CVMArray } from '@cvm/types';

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


    it('should return undefined for invalid heap reference', () => {
      const heap = createVMHeap();
      const result = heap.get(999);
      expect(result).toBeUndefined();
    });
  });
});