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
  cvmTypeof,
  createCVMArray,
  createCVMUndefined,
  createCVMObject,
  CVMArrayRef,
  CVMObjectRef
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

  describe('CVMArray with properties', () => {
    it('should support both elements and properties', () => {
      const array: CVMArray = {
        type: 'array',
        elements: [1, 2, 3],
        properties: { foo: 'bar' }
      };
      expect(array.elements[0]).toBe(1);
      expect(array.properties!.foo).toBe('bar');
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

      it('should convert undefined to "undefined"', () => {
        expect(cvmToString(createCVMUndefined())).toBe('undefined');
      });

      it('should convert objects to "[object Object]"', () => {
        expect(cvmToString(createCVMObject({}))).toBe('[object Object]');
        expect(cvmToString(createCVMObject({ a: 1, b: 2 }))).toBe('[object Object]');
      });

      it('should handle references using String fallback', () => {
        const arrayRef: CVMArrayRef = { type: 'array-ref', id: 1 };
        const objRef: CVMObjectRef = { type: 'object-ref', id: 1 };
        expect(cvmToString(arrayRef)).toBe('[object Object]');
        expect(cvmToString(objRef)).toBe('[object Object]');
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

      it('should handle undefined as falsy', () => {
        expect(cvmToBoolean(createCVMUndefined())).toBe(false);
      });

      it('should handle objects as truthy', () => {
        expect(cvmToBoolean(createCVMObject({}))).toBe(true);
        expect(cvmToBoolean(createCVMObject({ a: 1 }))).toBe(true);
      });

      it('should handle references using Boolean fallback', () => {
        const arrayRef: CVMArrayRef = { type: 'array-ref', id: 1 };
        const objRef: CVMObjectRef = { type: 'object-ref', id: 1 };
        expect(cvmToBoolean(arrayRef)).toBe(true);
        expect(cvmToBoolean(objRef)).toBe(true);
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
        expect(cvmToNumber('123abc')).toBeNaN();
        expect(cvmToNumber('true')).toBeNaN();
      });

      it('should return 0 for empty string', () => {
        expect(cvmToNumber('')).toBe(0);  // JavaScript: Number("") === 0
      });

      it('should return NaN for arrays', () => {
        expect(cvmToNumber(createCVMArray([]))).toBeNaN();
        expect(cvmToNumber(createCVMArray([1, 2, 3]))).toBeNaN();
      });

      it('should return NaN for undefined', () => {
        expect(cvmToNumber(createCVMUndefined())).toBeNaN();
      });

      it('should handle objects', () => {
        const obj = createCVMObject({ a: 1 });
        expect(cvmToNumber(obj)).toBeNaN();
      });

      it('should handle object references', () => {
        const objRef: CVMObjectRef = { type: 'object-ref', id: 1 };
        expect(cvmToNumber(objRef)).toBeNaN();
      });
    });

    describe('cvmTypeof', () => {
      it('should return correct types for primitives', () => {
        expect(cvmTypeof('hello')).toBe('string');
        expect(cvmTypeof(123)).toBe('number');
        expect(cvmTypeof(true)).toBe('boolean');
        expect(cvmTypeof(false)).toBe('boolean');
        expect(cvmTypeof(null)).toBe('null');
      });

      it('should return undefined for undefined value', () => {
        expect(cvmTypeof(createCVMUndefined())).toBe('undefined');
      });

      it('should return array for arrays', () => {
        expect(cvmTypeof(createCVMArray([]))).toBe('array');
        expect(cvmTypeof(createCVMArray([1, 2, 3]))).toBe('array');
      });

      it('should return array for array references', () => {
        const arrayRef: CVMArrayRef = { type: 'array-ref', id: 1 };
        expect(cvmTypeof(arrayRef)).toBe('array');
      });

      it('should return object for objects', () => {
        expect(cvmTypeof(createCVMObject({}))).toBe('object');
        expect(cvmTypeof(createCVMObject({ a: 1 }))).toBe('object');
      });

      it('should return object for object references', () => {
        const objRef: CVMObjectRef = { type: 'object-ref', id: 1 };
        expect(cvmTypeof(objRef)).toBe('object');
      });

      it('should return unknown for unrecognized types', () => {
        // This case is hard to test since all CVMValue types should be covered
        // but it's there as a fallback. We can test it by casting an invalid value
        const invalidValue = { type: 'invalid' } as any;
        expect(cvmTypeof(invalidValue)).toBe('unknown');
      });
    });
  });
});