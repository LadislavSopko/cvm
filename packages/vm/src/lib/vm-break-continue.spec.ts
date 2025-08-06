import { describe, expect, it } from 'vitest';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';

describe('VM Break/Continue Operations', () => {
  const vm = new VM();

  it('should execute BREAK instruction and jump to target', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: 'start' },
      { op: OpCode.PRINT },
      { op: OpCode.BREAK, arg: 5 },  // Jump to instruction 5
      { op: OpCode.PUSH, arg: 'skipped' },
      { op: OpCode.PRINT },
      { op: OpCode.PUSH, arg: 'end' },  // Instruction 5
      { op: OpCode.PRINT },
      { op: OpCode.HALT }
    ];

    const result = vm.execute(bytecode);

    expect(result.status).toBe('complete');
    expect(result.output).toEqual(['start', 'end']);
    expect(result.pc).toBe(7);
  });

  it('should execute CONTINUE instruction and jump to target', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: 'start' },
      { op: OpCode.PRINT },
      { op: OpCode.CONTINUE, arg: 5 },  // Jump to instruction 5
      { op: OpCode.PUSH, arg: 'skipped' },
      { op: OpCode.PRINT },
      { op: OpCode.PUSH, arg: 'continue_target' },  // Instruction 5
      { op: OpCode.PRINT },
      { op: OpCode.HALT }
    ];

    const result = vm.execute(bytecode);

    expect(result.status).toBe('complete');
    expect(result.output).toEqual(['start', 'continue_target']);
    expect(result.pc).toBe(7);
  });

  it('should error on BREAK without target address', () => {
    const bytecode = [
      { op: OpCode.BREAK }  // Missing arg
    ];

    const result = vm.execute(bytecode);

    expect(result.status).toBe('error');
    expect(result.error).toBe('BREAK requires a target address');
  });

  it('should error on CONTINUE without target address', () => {
    const bytecode = [
      { op: OpCode.CONTINUE }  // Missing arg
    ];

    const result = vm.execute(bytecode);

    expect(result.status).toBe('error');
    expect(result.error).toBe('CONTINUE requires a target address');
  });

  it('should error on BREAK with invalid target (negative)', () => {
    const bytecode = [
      { op: OpCode.BREAK, arg: -1 }
    ];

    const result = vm.execute(bytecode);

    expect(result.status).toBe('error');
    expect(result.error).toBe('Invalid break target: -1');
  });

  it('should error on BREAK with invalid target (out of bounds)', () => {
    const bytecode = [
      { op: OpCode.BREAK, arg: 10 }  // Beyond bytecode length
    ];

    const result = vm.execute(bytecode);

    expect(result.status).toBe('error');
    expect(result.error).toBe('Invalid break target: 10');
  });

  it('should error on CONTINUE with invalid target (negative)', () => {
    const bytecode = [
      { op: OpCode.CONTINUE, arg: -1 }
    ];

    const result = vm.execute(bytecode);

    expect(result.status).toBe('error');
    expect(result.error).toBe('Invalid continue target: -1');
  });

  it('should error on CONTINUE with invalid target (out of bounds)', () => {
    const bytecode = [
      { op: OpCode.CONTINUE, arg: 10 }  // Beyond bytecode length
    ];

    const result = vm.execute(bytecode);

    expect(result.status).toBe('error');
    expect(result.error).toBe('Invalid continue target: 10');
  });

});