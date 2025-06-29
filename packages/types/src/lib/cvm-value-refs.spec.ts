import { describe, it, expect } from 'vitest';
import type { CVMArrayRef, CVMObjectRef } from './cvm-value.js';
import { isCVMArrayRef, isCVMObjectRef } from './cvm-value.js';

describe('CVMValue Reference Types', () => {
  describe('Type Guards', () => {
    it('should identify array references', () => {
      const ref: CVMArrayRef = { type: 'array-ref', id: 123 };
      expect(isCVMArrayRef(ref)).toBe(true);
      expect(isCVMObjectRef(ref)).toBe(false);
    });

    it('should identify object references', () => {
      const ref: CVMObjectRef = { type: 'object-ref', id: 456 };
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