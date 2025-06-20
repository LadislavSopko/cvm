import { describe, it, expect } from 'vitest';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';

describe('VM - FS_LIST_FILES opcode', () => {
  it('should enter waiting_fs state with path argument', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.PUSH, arg: '/test' },
      { op: OpCode.FS_LIST_FILES },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('waiting_fs');
    expect(state.error).toBeUndefined();
    expect(state.fsOperation).toBeDefined();
    expect(state.fsOperation?.type).toBe('listFiles');
    expect(state.fsOperation?.path).toBe('/test');
    expect(state.fsOperation?.options).toEqual({});
  });

  it('should handle options with recursive flag', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.PUSH, arg: '/test' },
      { op: OpCode.PUSH, arg: { recursive: true } },
      { op: OpCode.FS_LIST_FILES },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('waiting_fs');
    expect(state.fsOperation?.options).toEqual({ recursive: true });
  });

  it('should handle options with filter pattern', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.PUSH, arg: '/test' },
      { op: OpCode.PUSH, arg: { filter: '*.txt' } },
      { op: OpCode.FS_LIST_FILES },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('waiting_fs');
    expect(state.fsOperation?.options).toEqual({ filter: '*.txt' });
  });

  it('should handle both recursive and filter options', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.PUSH, arg: '/test' },
      { op: OpCode.PUSH, arg: { recursive: true, filter: '*.txt' } },
      { op: OpCode.FS_LIST_FILES },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('waiting_fs');
    expect(state.fsOperation?.options).toEqual({ recursive: true, filter: '*.txt' });
  });

  it('should error on non-string path', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.PUSH, arg: 123 },  // Non-string path
      { op: OpCode.FS_LIST_FILES },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('error');
    expect(state.error).toBe('FS_LIST_FILES requires a string path');
  });

  it('should error on stack underflow', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.FS_LIST_FILES },  // No path on stack
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('error');
    expect(state.error).toBe('FS_LIST_FILES: Stack underflow');
  });

  it('should resume with file system result', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.PUSH, arg: '/test' },
      { op: OpCode.FS_LIST_FILES },
      { op: OpCode.HALT }
    ];
    
    // First execution - should pause at FS_LIST_FILES
    const state1 = vm.execute(bytecode);
    expect(state1.status).toBe('waiting_fs');
    
    // Simulate file system result - now returns array of paths
    const mockResult = {
      elements: [
        '/test/file1.txt',
        '/test/file2.js'
      ]
    };
    
    // Resume with result
    const state2 = vm.resumeWithFsResult(state1, mockResult as any, bytecode);
    
    expect(state2.status).toBe('complete');
    expect(state2.stack.length).toBe(1);
    expect(state2.stack[0]).toEqual(mockResult);
  });

  it('should handle only path argument without options', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.PUSH, arg: '/docs' },
      { op: OpCode.FS_LIST_FILES },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('waiting_fs');
    expect(state.fsOperation?.path).toBe('/docs');
    expect(state.fsOperation?.options).toEqual({});
  });
});