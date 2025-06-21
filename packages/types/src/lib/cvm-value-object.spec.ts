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
      expect(obj.properties).toBeInstanceOf(Map);
      expect(obj.properties.size).toBe(0);
    });

    it('should create an object with initial properties', () => {
      const props = new Map<string, CVMValue>([
        ['name', 'John'],
        ['age', 30],
        ['active', true]
      ]);
      const obj = createCVMObject(props);
      expect(obj.properties).toBe(props);
      expect(obj.properties.get('name')).toBe('John');
      expect(obj.properties.get('age')).toBe(30);
      expect(obj.properties.get('active')).toBe(true);
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
      const props = new Map<string, CVMValue>([
        ['key', 'value']
      ]);
      const obj = createCVMObject(props);
      expect(cvmToString(obj)).toBe('[object Object]');
    });
  });

  describe('cvmToBoolean with objects', () => {
    it('should return true for any object', () => {
      const empty = createCVMObject();
      expect(cvmToBoolean(empty)).toBe(true);
      
      const withProps = createCVMObject(new Map([['key', 'value']]));
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
      obj.properties.set('name', 'Alice');
      obj.properties.set('age', 25);
      
      expect(obj.properties.get('name')).toBe('Alice');
      expect(obj.properties.get('age')).toBe(25);
      expect(obj.properties.get('missing')).toBeUndefined();
    });

    it('should support nested objects', () => {
      const inner = createCVMObject(new Map([['value', 42]]));
      const outer = createCVMObject(new Map([['nested', inner]]));
      
      const nestedObj = outer.properties.get('nested') as CVMObject;
      expect(isCVMObject(nestedObj)).toBe(true);
      expect(nestedObj.properties.get('value')).toBe(42);
    });

    it('should support arrays as property values', () => {
      const arr = createCVMArray(['a', 'b', 'c']);
      const obj = createCVMObject(new Map([['items', arr]]));
      
      const items = obj.properties.get('items') as any;
      expect(items.type).toBe('array');
      expect(items.elements).toEqual(['a', 'b', 'c']);
    });
  });
});