import { describe, it, expect } from 'vitest';
import { 
  isCVMUndefined,
  cvmToString,
  cvmToBoolean,
  cvmTypeof,
  cvmToNumber,
  createCVMUndefined
} from './cvm-value.js';

describe('CVMUndefined', () => {
  describe('createCVMUndefined', () => {
    it('should create undefined value', () => {
      const undef = createCVMUndefined();
      expect(undef).toEqual({ type: 'undefined' });
    });
  });

  describe('isCVMUndefined', () => {
    it('should identify undefined values', () => {
      const undef = createCVMUndefined();
      expect(isCVMUndefined(undef)).toBe(true);
    });

    it('should not identify other values as undefined', () => {
      expect(isCVMUndefined(null)).toBe(false);
      expect(isCVMUndefined(0)).toBe(false);
      expect(isCVMUndefined('')).toBe(false);
      expect(isCVMUndefined(false)).toBe(false);
      expect(isCVMUndefined({ type: 'array', elements: [] })).toBe(false);
    });
  });

  describe('cvmToString', () => {
    it('should convert undefined to "undefined"', () => {
      const undef = createCVMUndefined();
      expect(cvmToString(undef)).toBe('undefined');
    });
  });

  describe('cvmToBoolean', () => {
    it('should convert undefined to false', () => {
      const undef = createCVMUndefined();
      expect(cvmToBoolean(undef)).toBe(false);
    });
  });

  describe('cvmTypeof', () => {
    it('should return "undefined" for undefined values', () => {
      const undef = createCVMUndefined();
      expect(cvmTypeof(undef)).toBe('undefined');
    });
  });

  describe('cvmToNumber', () => {
    it('should convert undefined to NaN', () => {
      const undef = createCVMUndefined();
      expect(cvmToNumber(undef)).toBeNaN();
    });
  });
});