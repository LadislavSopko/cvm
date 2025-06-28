import { describe, it, expect, vi } from 'vitest';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';
import { FileSystemService } from './file-system.js';

// Mock FileSystemService
class MockFileSystemService implements FileSystemService {
  listFiles = vi.fn();
  readFile = vi.fn();
  writeFile = vi.fn();
}

describe('VM File System Read/Write Operations', () => {
  describe('FS_READ_FILE opcode', () => {
    it('should execute readFile synchronously and push result to stack', () => {
      const vm = new VM();
      const mockFs = new MockFileSystemService();
      mockFs.readFile.mockReturnValue('file content');
      
      const bytecode = [
        { op: OpCode.PUSH, arg: './test.txt' },
        { op: OpCode.FS_READ_FILE },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode, undefined, mockFs);
      
      expect(state.status).toBe('complete');
      expect(mockFs.readFile).toHaveBeenCalledWith('./test.txt');
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]).toBe('file content');
    });

    it('should push null when file is not found', () => {
      const vm = new VM();
      const mockFs = new MockFileSystemService();
      mockFs.readFile.mockReturnValue(null);
      
      const bytecode = [
        { op: OpCode.PUSH, arg: './missing.txt' },
        { op: OpCode.FS_READ_FILE },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode, undefined, mockFs);
      
      expect(state.status).toBe('complete');
      expect(mockFs.readFile).toHaveBeenCalledWith('./missing.txt');
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]).toBe(null);
    });

    it('should return error if FileSystem is not provided', () => {
      const vm = new VM();
      const bytecode = [
        { op: OpCode.PUSH, arg: './test.txt' },
        { op: OpCode.FS_READ_FILE },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode); // No FileSystem provided
      
      expect(state.status).toBe('error');
      expect(state.error).toBe('FileSystem not available');
    });

    it('should return error if path is not a string', () => {
      const vm = new VM();
      const mockFs = new MockFileSystemService();
      const bytecode = [
        { op: OpCode.PUSH, arg: 123 },
        { op: OpCode.FS_READ_FILE },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode, undefined, mockFs);
      
      expect(state.status).toBe('error');
      expect(state.error).toBe('FS_READ_FILE requires a string path');
    });

    it('should handle stack underflow', () => {
      const vm = new VM();
      const mockFs = new MockFileSystemService();
      const bytecode = [
        { op: OpCode.FS_READ_FILE },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode, undefined, mockFs);
      
      expect(state.status).toBe('error');
      expect(state.error).toBe('FS_READ_FILE: Stack underflow');
    });
  });

  describe('FS_WRITE_FILE opcode', () => {
    it('should execute writeFile synchronously and push result to stack', () => {
      const vm = new VM();
      const mockFs = new MockFileSystemService();
      mockFs.writeFile.mockReturnValue(true);
      
      const bytecode = [
        { op: OpCode.PUSH, arg: './output.txt' },
        { op: OpCode.PUSH, arg: 'Hello world' },
        { op: OpCode.FS_WRITE_FILE },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode, undefined, mockFs);
      
      expect(state.status).toBe('complete');
      expect(mockFs.writeFile).toHaveBeenCalledWith('./output.txt', 'Hello world');
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]).toBe(true);
    });

    it('should convert non-string content to string', () => {
      const vm = new VM();
      const mockFs = new MockFileSystemService();
      mockFs.writeFile.mockReturnValue(true);
      
      const bytecode = [
        { op: OpCode.PUSH, arg: './output.txt' },
        { op: OpCode.PUSH, arg: 42 },
        { op: OpCode.FS_WRITE_FILE },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode, undefined, mockFs);
      
      expect(state.status).toBe('complete');
      expect(mockFs.writeFile).toHaveBeenCalledWith('./output.txt', '42');
      expect(state.stack[0]).toBe(true);
    });

    it('should push false when write fails', () => {
      const vm = new VM();
      const mockFs = new MockFileSystemService();
      mockFs.writeFile.mockReturnValue(false);
      
      const bytecode = [
        { op: OpCode.PUSH, arg: '/readonly/file.txt' },
        { op: OpCode.PUSH, arg: 'content' },
        { op: OpCode.FS_WRITE_FILE },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode, undefined, mockFs);
      
      expect(state.status).toBe('complete');
      expect(mockFs.writeFile).toHaveBeenCalledWith('/readonly/file.txt', 'content');
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]).toBe(false);
    });

    it('should return error if FileSystem is not provided', () => {
      const vm = new VM();
      const bytecode = [
        { op: OpCode.PUSH, arg: './test.txt' },
        { op: OpCode.PUSH, arg: 'content' },
        { op: OpCode.FS_WRITE_FILE },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode); // No FileSystem provided
      
      expect(state.status).toBe('error');
      expect(state.error).toBe('FileSystem not available');
    });

    it('should return error if path is not a string', () => {
      const vm = new VM();
      const mockFs = new MockFileSystemService();
      const bytecode = [
        { op: OpCode.PUSH, arg: 123 },
        { op: OpCode.PUSH, arg: 'content' },
        { op: OpCode.FS_WRITE_FILE },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode, undefined, mockFs);
      
      expect(state.status).toBe('error');
      expect(state.error).toBe('FS_WRITE_FILE requires a string path');
    });

    it('should handle stack underflow for missing content', () => {
      const vm = new VM();
      const mockFs = new MockFileSystemService();
      const bytecode = [
        { op: OpCode.PUSH, arg: './test.txt' },
        { op: OpCode.FS_WRITE_FILE },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode, undefined, mockFs);
      
      expect(state.status).toBe('error');
      expect(state.error).toBe('FS_WRITE_FILE: Stack underflow');
    });

    it('should handle stack underflow for missing both arguments', () => {
      const vm = new VM();
      const mockFs = new MockFileSystemService();
      const bytecode = [
        { op: OpCode.FS_WRITE_FILE },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode, undefined, mockFs);
      
      expect(state.status).toBe('error');
      expect(state.error).toBe('FS_WRITE_FILE: Stack underflow');
    });

    it('should handle null and undefined content', () => {
      const vm = new VM();
      const mockFs = new MockFileSystemService();
      mockFs.writeFile.mockReturnValue(true);
      
      const bytecode = [
        { op: OpCode.PUSH, arg: './output.txt' },
        { op: OpCode.PUSH, arg: null },
        { op: OpCode.FS_WRITE_FILE },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode, undefined, mockFs);
      
      expect(state.status).toBe('complete');
      expect(mockFs.writeFile).toHaveBeenCalledWith('./output.txt', 'null');
      expect(state.stack[0]).toBe(true);
    });
  });

  describe('VM state persistence across fs operations', () => {
    it('should maintain variables across fs operations', () => {
      const vm = new VM();
      const mockFs = new MockFileSystemService();
      mockFs.readFile.mockReturnValue('file content');
      
      const bytecode = [
        { op: OpCode.PUSH, arg: 'test' },
        { op: OpCode.STORE, arg: 'myVar' },
        { op: OpCode.PUSH, arg: './test.txt' },
        { op: OpCode.FS_READ_FILE },
        { op: OpCode.LOAD, arg: 'myVar' },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode, undefined, mockFs);
      
      expect(state.variables.get('myVar')).toBe('test');
      expect(state.stack).toEqual(['file content', 'test']);
      expect(state.status).toBe('complete');
    });

    it('should handle multiple fs operations in sequence', () => {
      const vm = new VM();
      const mockFs = new MockFileSystemService();
      mockFs.readFile.mockReturnValue('input data');
      mockFs.writeFile.mockReturnValue(true);
      
      const bytecode = [
        { op: OpCode.PUSH, arg: './output.txt' },  // Push path first
        { op: OpCode.PUSH, arg: './input.txt' },
        { op: OpCode.FS_READ_FILE },
        { op: OpCode.PUSH, arg: ' - processed' },
        { op: OpCode.CONCAT },  // Now we have: path (bottom), content (top)
        { op: OpCode.FS_WRITE_FILE },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode, undefined, mockFs);
      
      if (state.status === 'error') {
        console.error('Error:', state.error);
        console.error('Stack:', state.stack);
      }
      expect(state.status).toBe('complete');
      expect(mockFs.readFile).toHaveBeenCalledWith('./input.txt');
      expect(mockFs.writeFile).toHaveBeenCalledWith('./output.txt', 'input data - processed');
      expect(state.stack).toEqual([true]);
    });
  });
});