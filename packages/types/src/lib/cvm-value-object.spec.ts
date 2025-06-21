import { describe, it, expect } from 'vitest';
import {
  CVMObject,
  CVMValue,
  isCVMObject,
  createCVMObject,
  cvmToString,
  cvmToBoolean,
  cvmTypeof,
  createCVMArray,
  createCVMUndefined
} from './cvm-value.js';

describe('CVMObject', () => {
  describe('createCVMObject', () => {
    it('should create an empty object', () => {
      const obj = createCVMObject();
      expect(obj.type).toBe('object');
      expect(typeof obj.properties).toBe('object');
      expect(Object.keys(obj.properties).length).toBe(0);
    });

    it('should create an object with initial properties', () => {
      const props: Record<string, CVMValue> = {
        name: 'John',
        age: 30,
        active: true
      };
      const obj = createCVMObject(props);
      expect(obj.properties).toEqual(props);
      expect(obj.properties['name']).toBe('John');
      expect(obj.properties['age']).toBe(30);
      expect(obj.properties['active']).toBe(true);
    });
  });

  describe('isCVMObject', () => {
    it('should return true for CVMObject', () => {
      const obj = createCVMObject();
      expect(isCVMObject(obj)).toBe(true);
    });

    it('should return false for other types', () => {
      expect(isCVMObject('string')).toBe(false);
      expect(isCVMObject(42)).toBe(false);
      expect(isCVMObject(true)).toBe(false);
      expect(isCVMObject(null)).toBe(false);
      expect(isCVMObject(createCVMArray())).toBe(false);
      expect(isCVMObject(createCVMUndefined())).toBe(false);
    });
  });

  describe('cvmToString with objects', () => {
    it('should return [object Object] for objects', () => {
      const obj = createCVMObject();
      expect(cvmToString(obj)).toBe('[object Object]');
    });

    it('should return [object Object] regardless of properties', () => {
      const props: Record<string, CVMValue> = {
        key: 'value'
      };
      const obj = createCVMObject(props);
      expect(cvmToString(obj)).toBe('[object Object]');
    });
  });

  describe('cvmToBoolean with objects', () => {
    it('should return true for any object', () => {
      const empty = createCVMObject();
      expect(cvmToBoolean(empty)).toBe(true);
      
      const withProps = createCVMObject({ key: 'value' });
      expect(cvmToBoolean(withProps)).toBe(true);
    });
  });

  describe('cvmTypeof with objects', () => {
    it('should return "object" for CVMObject', () => {
      const obj = createCVMObject();
      expect(cvmTypeof(obj)).toBe('object');
    });
  });

  describe('object property operations', () => {
    it('should support setting and getting properties', () => {
      const obj = createCVMObject();
      obj.properties['name'] = 'Alice';
      obj.properties['age'] = 25;
      
      expect(obj.properties['name']).toBe('Alice');
      expect(obj.properties['age']).toBe(25);
      expect(obj.properties['missing']).toBeUndefined();
    });

    it('should support nested objects', () => {
      const inner = createCVMObject({ value: 42 });
      const outer = createCVMObject({ nested: inner });
      
      const nestedObj = outer.properties['nested'] as CVMObject;
      expect(isCVMObject(nestedObj)).toBe(true);
      expect(nestedObj.properties['value']).toBe(42);
    });

    it('should support arrays as property values', () => {
      const arr = createCVMArray(['a', 'b', 'c']);
      const obj = createCVMObject({ items: arr });
      
      const items = obj.properties['items'] as any;
      expect(items.type).toBe('array');
      expect(items.elements).toEqual(['a', 'b', 'c']);
    });
  });
});