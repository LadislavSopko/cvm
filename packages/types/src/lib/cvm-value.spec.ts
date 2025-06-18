import { describe, it, expect } from 'vitest';
import { 
  CVMArray, 
  isCVMArray, 
  isCVMString, 
  isCVMNumber, 
  isCVMBoolean, 
  isCVMNull,
  cvmToString,
  cvmToBoolean,
  cvmToNumber,
  createCVMArray
} from './cvm-value.js';

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

  describe('Type Conversion Helpers', () => {
    describe('cvmToString', () => {
      it('should convert all value types to strings', () => {
        expect(cvmToString('hello')).toBe('hello');
        expect(cvmToString(123)).toBe('123');
        expect(cvmToString(true)).toBe('true');
        expect(cvmToString(false)).toBe('false');
        expect(cvmToString(null)).toBe('null');
        expect(cvmToString(createCVMArray(['a', 'b']))).toBe('[array:2]');
      });
    });

    describe('cvmToBoolean', () => {
      it('should convert values to boolean following JS semantics', () => {
        // Boolean values
        expect(cvmToBoolean(true)).toBe(true);
        expect(cvmToBoolean(false)).toBe(false);
        
        // Null is falsy
        expect(cvmToBoolean(null)).toBe(false);
        
        // Numbers: 0 is falsy, others are truthy
        expect(cvmToBoolean(0)).toBe(false);
        expect(cvmToBoolean(1)).toBe(true);
        expect(cvmToBoolean(-1)).toBe(true);
        expect(cvmToBoolean(123.45)).toBe(true);
        
        // Strings: empty is falsy, others are truthy
        expect(cvmToBoolean('')).toBe(false);
        expect(cvmToBoolean('hello')).toBe(true);
        expect(cvmToBoolean('false')).toBe(true);
        expect(cvmToBoolean('0')).toBe(true);
        
        // Arrays are always truthy
        expect(cvmToBoolean(createCVMArray([]))).toBe(true);
        expect(cvmToBoolean(createCVMArray(['a']))).toBe(true);
      });
    });

    describe('cvmToNumber', () => {
      it('should convert numbers to themselves', () => {
        expect(cvmToNumber(0)).toBe(0);
        expect(cvmToNumber(123)).toBe(123);
        expect(cvmToNumber(-456.78)).toBe(-456.78);
      });

      it('should convert booleans to 0/1', () => {
        expect(cvmToNumber(false)).toBe(0);
        expect(cvmToNumber(true)).toBe(1);
      });

      it('should convert null to 0', () => {
        expect(cvmToNumber(null)).toBe(0);
      });

      it('should parse numeric strings', () => {
        expect(cvmToNumber('123')).toBe(123);
        expect(cvmToNumber('-456.78')).toBe(-456.78);
        expect(cvmToNumber('0')).toBe(0);
        expect(cvmToNumber('  42  ')).toBe(42);
      });

      it('should return NaN for non-numeric strings', () => {
        expect(cvmToNumber('hello')).toBeNaN();
        expect(cvmToNumber('')).toBeNaN();
        expect(cvmToNumber('123abc')).toBeNaN();
        expect(cvmToNumber('true')).toBeNaN();
      });

      it('should return NaN for arrays', () => {
        expect(cvmToNumber(createCVMArray([]))).toBeNaN();
        expect(cvmToNumber(createCVMArray([1, 2, 3]))).toBeNaN();
      });
    });
  });
});