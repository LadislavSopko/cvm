import { describe, it, expect } from 'vitest';
import { CVMArray, isCVMArray, isCVMString, isCVMNumber, isCVMBoolean, isCVMNull } from './cvm-value.js';

describe('CVMValue Type System', () => {
  describe('Type Guards', () => {
    it('should identify strings correctly', () => {
      expect(isCVMString('hello')).toBe(true);
      expect(isCVMString('')).toBe(true);
      expect(isCVMString(123)).toBe(false);
      expect(isCVMString(null)).toBe(false);
      expect(isCVMString({ type: 'array', elements: [] })).toBe(false);
    });

    it('should identify numbers correctly', () => {
      expect(isCVMNumber(123)).toBe(true);
      expect(isCVMNumber(0)).toBe(true);
      expect(isCVMNumber(-456.78)).toBe(true);
      expect(isCVMNumber('123')).toBe(false);
      expect(isCVMNumber(null)).toBe(false);
    });

    it('should identify booleans correctly', () => {
      expect(isCVMBoolean(true)).toBe(true);
      expect(isCVMBoolean(false)).toBe(true);
      expect(isCVMBoolean(1)).toBe(false);
      expect(isCVMBoolean('true')).toBe(false);
      expect(isCVMBoolean(null)).toBe(false);
    });

    it('should identify null correctly', () => {
      expect(isCVMNull(null)).toBe(true);
      // undefined is not a CVMValue, so we skip this test
      expect(isCVMNull(0)).toBe(false);
      expect(isCVMNull('')).toBe(false);
      expect(isCVMNull(false)).toBe(false);
    });

    it('should identify arrays correctly', () => {
      const arr: CVMArray = { type: 'array', elements: [] };
      expect(isCVMArray(arr)).toBe(true);
      
      const arrWithElements: CVMArray = { type: 'array', elements: ['a', 1, true] };
      expect(isCVMArray(arrWithElements)).toBe(true);
      
      // Native JS array is not a CVMArray
      expect(isCVMArray('array')).toBe(false);
      expect(isCVMArray(null)).toBe(false);
      // Object with wrong type field - cast to CVMValue to satisfy TypeScript
      const notAnArray = { type: 'object' } as unknown as CVMArray;
      expect(isCVMArray(notAnArray)).toBe(false);
    });
  });

  describe('CVMArray operations', () => {
    it('should create empty arrays', () => {
      const arr: CVMArray = { type: 'array', elements: [] };
      expect(arr.elements.length).toBe(0);
    });

    it('should store mixed types', () => {
      const arr: CVMArray = { 
        type: 'array', 
        elements: ['hello', 123, true, null, { type: 'array', elements: ['nested'] }]
      };
      
      expect(arr.elements.length).toBe(5);
      expect(isCVMString(arr.elements[0])).toBe(true);
      expect(isCVMNumber(arr.elements[1])).toBe(true);
      expect(isCVMBoolean(arr.elements[2])).toBe(true);
      expect(isCVMNull(arr.elements[3])).toBe(true);
      expect(isCVMArray(arr.elements[4])).toBe(true);
    });
  });
});