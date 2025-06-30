import { describe, it, expect } from 'vitest';
import { VM } from '../vm.js';
import { OpCode } from '@cvm/parser';

describe('Unified GET opcode', () => {
  const vm = new VM();

  it('should handle arrays with GET', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("value");
  });
  
  it('should handle objects with GET', () => {
    const bytecode = [
      { op: OpCode.OBJECT_CREATE },
      { op: OpCode.PUSH, arg: "key" },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.PUSH, arg: "key" },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("value");
  });
  
  it('should handle strings with GET', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: "hello" },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("h");
  });
});

describe('Unified SET opcode', () => {
  const vm = new VM();

  it('should handle arrays with SET', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("value");
  });
  
  it('should handle objects with SET', () => {
    const bytecode = [
      { op: OpCode.OBJECT_CREATE },
      { op: OpCode.PUSH, arg: "key" },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.PUSH, arg: "key" },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("value");
  });
});

describe('Unified GET opcode - Error Cases', () => {
  const vm = new VM();

  it('should error on invalid array reference', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: { type: 'array-ref', id: 999 } },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('Invalid array reference');
  });

  it('should error on invalid object reference', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: { type: 'object-ref', id: 999 } },
      { op: OpCode.PUSH, arg: "key" },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('Invalid object reference');
  });

  it('should error with boolean index on array', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.PUSH, arg: true },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('GET requires numeric or numeric string index for arrays');
  });

  it('should error with object index on array', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.DUP }, // Save array ref
      { op: OpCode.OBJECT_CREATE },
      { op: OpCode.SWAP }, // Array back on top
      { op: OpCode.SWAP }, // Object as index
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('GET requires numeric or numeric string index for arrays');
  });

  it('should error on non-indexable type (number)', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: 42 },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('GET requires array, object, or string');
  });

  it('should error on non-indexable type (boolean)', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: true },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('GET requires array, object, or string');
  });

  it('should error on undefined type', () => {
    const bytecode = [
      { op: OpCode.PUSH_UNDEFINED },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('GET requires array, object, or string');
  });
});

describe('Unified GET opcode - Edge Cases', () => {
  const vm = new VM();

  it('should handle numeric string index on array', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.DUP },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.ARRAY_SET },
      { op: OpCode.PUSH, arg: "0" },  // String "0"
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[1]).toBe("value");
  });

  it('should handle non-numeric string on array (property access)', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.DUP },
      { op: OpCode.PUSH, arg: "customProp" },
      { op: OpCode.PUSH, arg: "propValue" },
      { op: OpCode.SET },
      { op: OpCode.POP }, // Remove array ref from SET
      { op: OpCode.PUSH, arg: "customProp" },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("propValue");
  });

  it('should return undefined for non-existent array property', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.PUSH, arg: "nonExistent" },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toEqual({ type: 'undefined' });
  });

  it('should return undefined for out of bounds array access', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.PUSH, arg: 10 },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toEqual({ type: 'undefined' });
  });

  it('should return undefined for negative array index', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.PUSH, arg: -1 },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toEqual({ type: 'undefined' });
  });

  it('should return undefined for non-existent object property', () => {
    const bytecode = [
      { op: OpCode.OBJECT_CREATE },
      { op: OpCode.PUSH, arg: "nonExistent" },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toEqual({ type: 'undefined' });
  });

  it('should convert number index to string for object', () => {
    const bytecode = [
      { op: OpCode.OBJECT_CREATE },
      { op: OpCode.DUP },
      { op: OpCode.PUSH, arg: "42" },
      { op: OpCode.PUSH, arg: "answer" },
      { op: OpCode.SET },
      { op: OpCode.POP },
      { op: OpCode.PUSH, arg: 42 },  // Number 42
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("answer");
  });

  it('should handle numeric string index on string', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: "hello" },
      { op: OpCode.PUSH, arg: "1" },  // String "1"
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("e");
  });

  it('should return undefined for out of bounds string access', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: "hello" },
      { op: OpCode.PUSH, arg: 10 },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toEqual({ type: 'undefined' });
  });

  it('should return undefined for negative string index', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: "hello" },
      { op: OpCode.PUSH, arg: -1 },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toEqual({ type: 'undefined' });
  });

  it('should return undefined for non-numeric string index on string', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: "hello" },
      { op: OpCode.PUSH, arg: "abc" },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toEqual({ type: 'undefined' });
  });

  it('should handle fractional numeric string correctly', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.DUP },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.PUSH, arg: "first" },
      { op: OpCode.ARRAY_SET },
      { op: OpCode.PUSH, arg: "0.5" },  // Not a valid integer string
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[1]).toEqual({ type: 'undefined' });
  });
});

describe('Unified SET opcode - Error Cases', () => {
  const vm = new VM();

  it('should error on invalid array reference', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: { type: 'array-ref', id: 999 } },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('Invalid array reference');
  });

  it('should error on invalid object reference', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: { type: 'object-ref', id: 999 } },
      { op: OpCode.PUSH, arg: "key" },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('Invalid object reference');
  });

  it('should error with boolean index on array', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.PUSH, arg: true },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('SET requires numeric or numeric string index for arrays');
  });

  it('should error on negative array index', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.PUSH, arg: -1 },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('SET: Negative index not allowed');
  });

  it('should treat negative numeric string as property name', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.DUP },
      { op: OpCode.PUSH, arg: "-1" },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.PUSH, arg: "-1" },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('complete');
    expect(state.stack[1]).toBe("value");
  });

  it('should error when SET used on string', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: "hello" },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.PUSH, arg: "x" },
      { op: OpCode.SET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('SET requires array or object');
  });

  it('should error when SET used on number', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: 42 },
      { op: OpCode.PUSH, arg: "prop" },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('SET requires array or object');
  });

  it('should error when SET used on boolean', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: true },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('SET requires array or object');
  });

  it('should error when SET used on undefined', () => {
    const bytecode = [
      { op: OpCode.PUSH_UNDEFINED },
      { op: OpCode.PUSH, arg: "key" },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('SET requires array or object');
  });
});

describe('Unified SET opcode - Edge Cases', () => {
  const vm = new VM();

  it('should handle numeric string index on array', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.DUP },
      { op: OpCode.PUSH, arg: "2" },  // String "2"
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.PUSH, arg: 2 },    // Number 2
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[1]).toBe("value");
  });

  it('should set array property with non-numeric string key', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.DUP },
      { op: OpCode.PUSH, arg: "customProp" },
      { op: OpCode.PUSH, arg: "propValue" },
      { op: OpCode.SET },
      { op: OpCode.POP },
      { op: OpCode.PUSH, arg: "customProp" },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("propValue");
  });

  it('should auto-expand array when setting beyond bounds', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.DUP },
      { op: OpCode.PUSH, arg: 5 },    // Index 5 in empty array
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.PUSH, arg: 5 },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[1]).toBe("value");
  });

  it('should floor fractional array indices', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.DUP },
      { op: OpCode.PUSH, arg: 2.7 },  // Should be treated as 2
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.PUSH, arg: 2 },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[1]).toBe("value");
  });

  it('should convert any key type to string for objects', () => {
    const bytecode = [
      { op: OpCode.OBJECT_CREATE },
      { op: OpCode.DUP },
      { op: OpCode.PUSH, arg: 42 },   // Number key
      { op: OpCode.PUSH, arg: "answer" },
      { op: OpCode.SET },
      { op: OpCode.POP },
      { op: OpCode.PUSH, arg: "42" }, // String "42"
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("answer");
  });

  it('should return target reference after SET', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      // Stack should now have the array ref
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("value");
  });

  it('should create array properties object if not exists', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.DUP },
      // First verify no properties
      { op: OpCode.PUSH, arg: "test" },
      { op: OpCode.GET },
      { op: OpCode.POP }, // Remove undefined
      // Now set property
      { op: OpCode.PUSH, arg: "test" },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      // SET returns array ref on stack
      { op: OpCode.PUSH, arg: "test" },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("value");
  });
});