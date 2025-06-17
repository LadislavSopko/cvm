/**
 * Core value types for the CVM virtual machine
 */

export interface CVMArray {
  type: 'array';
  elements: CVMValue[];
}

export type CVMValue = string | boolean | number | CVMArray | null;

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

// Type conversion helpers
export function cvmToString(value: CVMValue): string {
  if (isCVMString(value)) return value;
  if (isCVMNumber(value)) return value.toString();
  if (isCVMBoolean(value)) return value.toString();
  if (isCVMNull(value)) return 'null';
  if (isCVMArray(value)) return `[array:${value.elements.length}]`;
  return String(value);
}

export function cvmToBoolean(value: CVMValue): boolean {
  // JavaScript-like truthiness
  if (isCVMBoolean(value)) return value;
  if (isCVMNull(value)) return false;
  if (isCVMNumber(value)) return value !== 0;
  if (isCVMString(value)) return value !== '';
  if (isCVMArray(value)) return true; // Arrays are always truthy
  return Boolean(value);
}

export function cvmTypeof(value: CVMValue): string {
  if (isCVMString(value)) return 'string';
  if (isCVMNumber(value)) return 'number';
  if (isCVMBoolean(value)) return 'boolean';
  if (isCVMNull(value)) return 'null';
  if (isCVMArray(value)) return 'array';
  return 'unknown';
}

// Array creation helper
export function createCVMArray(elements: CVMValue[] = []): CVMArray {
  return { type: 'array', elements };
}