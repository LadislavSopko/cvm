/**
 * Core value types for the CVM virtual machine
 */

export interface CVMArray {
  type: 'array';
  elements: CVMValue[];
}

export interface CVMUndefined {
  type: 'undefined';
}

export interface CVMObject {
  type: 'object';
  properties: Record<string, CVMValue>;
}

export interface CVMArrayRef {
  type: 'array-ref';
  id: number;
}

export interface CVMObjectRef {
  type: 'object-ref';
  id: number;
}

export type CVMValue = string | boolean | number | CVMArray | CVMObject | CVMArrayRef | CVMObjectRef | null | CVMUndefined;

// Type guards for runtime type checking
export function isCVMString(value: CVMValue): value is string {
  return typeof value === 'string';
}

export function isCVMNumber(value: CVMValue): value is number {
  return typeof value === 'number';
}

export function isCVMBoolean(value: CVMValue): value is boolean {
  return typeof value === 'boolean';
}

export function isCVMNull(value: CVMValue): value is null {
  return value === null;
}

export function isCVMArray(value: CVMValue): value is CVMArray {
  return value !== null && 
         typeof value === 'object' && 
         'type' in value && 
         value.type === 'array';
}

export function isCVMUndefined(value: CVMValue): value is CVMUndefined {
  return value !== null && 
         typeof value === 'object' && 
         'type' in value && 
         value.type === 'undefined';
}

export function isCVMObject(value: CVMValue): value is CVMObject {
  return value !== null && 
         typeof value === 'object' && 
         'type' in value && 
         value.type === 'object';
}

export function isCVMArrayRef(value: CVMValue): value is CVMArrayRef {
  return value !== null && 
         typeof value === 'object' && 
         'type' in value && 
         value.type === 'array-ref';
}

export function isCVMObjectRef(value: CVMValue): value is CVMObjectRef {
  return value !== null && 
         typeof value === 'object' && 
         'type' in value && 
         value.type === 'object-ref';
}

// Type conversion helpers
export function cvmToString(value: CVMValue): string {
  if (isCVMString(value)) return value;
  if (isCVMNumber(value)) return value.toString();
  if (isCVMBoolean(value)) return value.toString();
  if (isCVMNull(value)) return 'null';
  if (isCVMUndefined(value)) return 'undefined';
  if (isCVMArray(value)) return `[array:${value.elements.length}]`;
  if (isCVMObject(value)) return '[object Object]';
  return String(value);
}

export function cvmToBoolean(value: CVMValue): boolean {
  // JavaScript-like truthiness
  if (isCVMBoolean(value)) return value;
  if (isCVMNull(value)) return false;
  if (isCVMUndefined(value)) return false;
  if (isCVMNumber(value)) return value !== 0;
  if (isCVMString(value)) return value !== '';
  if (isCVMArray(value)) return true; // Arrays are always truthy
  if (isCVMObject(value)) return true; // Objects are always truthy
  return Boolean(value);
}

export function cvmTypeof(value: CVMValue): string {
  if (isCVMString(value)) return 'string';
  if (isCVMNumber(value)) return 'number';
  if (isCVMBoolean(value)) return 'boolean';
  if (isCVMNull(value)) return 'null';
  if (isCVMUndefined(value)) return 'undefined';
  if (isCVMArray(value)) return 'array';
  if (isCVMArrayRef(value)) return 'array'; // Array references report as 'array'
  if (isCVMObject(value)) return 'object';
  if (isCVMObjectRef(value)) return 'object'; // Object references report as 'object'
  return 'unknown';
}

export function cvmToNumber(value: CVMValue): number {
  // JavaScript-like numeric conversion
  if (isCVMNumber(value)) return value;
  if (isCVMBoolean(value)) return value ? 1 : 0;
  if (isCVMNull(value)) return 0;
  if (isCVMUndefined(value)) return NaN;
  if (isCVMString(value)) {
    // Parse string to number, returns NaN if not parseable
    const trimmed = value.trim();
    if (trimmed === '') return 0; // JavaScript behavior: Number("") === 0
    return Number(trimmed);
  }
  if (isCVMArray(value)) return NaN;
  return Number(value);
}

// Array creation helper
export function createCVMArray(elements: CVMValue[] = []): CVMArray {
  return { type: 'array', elements };
}

// Undefined creation helper
export function createCVMUndefined(): CVMUndefined {
  return { type: 'undefined' };
}

// Object creation helper
export function createCVMObject(properties: Record<string, CVMValue> = {}): CVMObject {
  return { type: 'object', properties };
}