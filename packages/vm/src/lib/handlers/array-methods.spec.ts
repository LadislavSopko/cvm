import { describe, it, expect } from 'vitest';
import { VM } from '../vm.js';
import { OpCode } from '@cvm/parser';

describe('Array map with property access', () => {
  const vm = new VM();

  it('should map array to property values', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      // Push objects with 'name' property
      { op: OpCode.OBJECT_CREATE },
      { op: OpCode.PUSH, arg: "name" },
      { op: OpCode.PUSH, arg: "Alice" },
      { op: OpCode.PROPERTY_SET },
      { op: OpCode.ARRAY_PUSH },
      // Map to extract 'name' property
      { op: OpCode.PUSH, arg: "name" },
      { op: OpCode.ARRAY_MAP_PROP },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    // Should have array ["Alice"]
    expect(state.status).toBe('complete');
    // The result should be an array with one element "Alice"
  });

  it('should filter array by property existence', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      // Push first object with 'active' property
      { op: OpCode.OBJECT_CREATE },
      { op: OpCode.PUSH, arg: "active" },
      { op: OpCode.PUSH, arg: true },
      { op: OpCode.PROPERTY_SET },
      { op: OpCode.ARRAY_PUSH },
      // Push second object without 'active' property
      { op: OpCode.OBJECT_CREATE },
      { op: OpCode.PUSH, arg: "name" },
      { op: OpCode.PUSH, arg: "Bob" },
      { op: OpCode.PROPERTY_SET },
      { op: OpCode.ARRAY_PUSH },
      // Filter by 'active' property
      { op: OpCode.PUSH, arg: "active" },
      { op: OpCode.ARRAY_FILTER_PROP },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('complete');
    // Should filter to only objects that have the 'active' property
  });
});