import { describe, it, expect } from 'vitest';
import { OpCode } from './bytecode.js';

describe('Object Opcodes', () => {
  it('should have OBJECT_CREATE opcode', () => {
    expect(OpCode.OBJECT_CREATE).toBe('OBJECT_CREATE');
  });

  it('should have PROPERTY_GET opcode', () => {
    expect(OpCode.PROPERTY_GET).toBe('PROPERTY_GET');
  });

  it('should have PROPERTY_SET opcode', () => {
    expect(OpCode.PROPERTY_SET).toBe('PROPERTY_SET');
  });

  it('should have JSON_STRINGIFY opcode', () => {
    expect(OpCode.JSON_STRINGIFY).toBe('JSON_STRINGIFY');
  });
});