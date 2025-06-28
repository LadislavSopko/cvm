import { describe, it, expect } from 'vitest';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';
import { FileSystemService } from './file-system.js';
import { createCVMArray } from '@cvm/types';

// Mock FileSystemService
class MockFileSystemService implements FileSystemService {
  listFiles(filePath: string, options?: any) {
    // Return mock results based on path
    if (filePath === '/test') {
      return createCVMArray(['/test/file1.txt', '/test/file2.js']);
    }
    if (filePath === '/docs') {
      return createCVMArray(['/docs/readme.md', '/docs/guide.md']);
    }
    return createCVMArray([]);
  }

  readFile(filePath: string): string | null {
    return `Content of ${filePath}`;
  }

  writeFile(filePath: string, content: string): boolean {
    return true;
  }
}

describe('VM - FS_LIST_FILES opcode', () => {
  it('should list files with path argument', () => {
    const vm = new VM();
    const fileSystem = new MockFileSystemService();
    const bytecode = [
      { op: OpCode.PUSH, arg: '/test' },
      { op: OpCode.FS_LIST_FILES },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode, {}, fileSystem);
    
    expect(state.status).toBe('complete');
    expect(state.error).toBeUndefined();
    expect(state.stack.length).toBe(1);
    
    const result = state.stack[0];
    expect(result).toEqual({
      type: 'array',
      elements: ['/test/file1.txt', '/test/file2.js']
    });
  });

  it('should handle options with recursive flag', () => {
    const vm = new VM();
    const fileSystem = new MockFileSystemService();
    
    // Override listFiles to check if options are passed correctly
    let capturedOptions: any;
    fileSystem.listFiles = (path: string, options?: any) => {
      capturedOptions = options;
      return createCVMArray(['/test/file1.txt', '/test/dir/file2.txt']);
    };
    
    const bytecode = [
      { op: OpCode.PUSH, arg: '/test' },
      { op: OpCode.PUSH, arg: { recursive: true } },
      { op: OpCode.FS_LIST_FILES },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode, {}, fileSystem);
    
    expect(state.status).toBe('complete');
    expect(capturedOptions).toEqual({ recursive: true });
  });

  it('should handle options with filter pattern', () => {
    const vm = new VM();
    const fileSystem = new MockFileSystemService();
    
    let capturedOptions: any;
    fileSystem.listFiles = (path: string, options?: any) => {
      capturedOptions = options;
      return createCVMArray(['/test/file1.txt']);
    };
    
    const bytecode = [
      { op: OpCode.PUSH, arg: '/test' },
      { op: OpCode.PUSH, arg: { filter: '*.txt' } },
      { op: OpCode.FS_LIST_FILES },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode, {}, fileSystem);
    
    expect(state.status).toBe('complete');
    expect(capturedOptions).toEqual({ filter: '*.txt' });
  });

  it('should handle both recursive and filter options', () => {
    const vm = new VM();
    const fileSystem = new MockFileSystemService();
    
    let capturedOptions: any;
    fileSystem.listFiles = (path: string, options?: any) => {
      capturedOptions = options;
      return createCVMArray(['/test/file1.txt', '/test/dir/file2.txt']);
    };
    
    const bytecode = [
      { op: OpCode.PUSH, arg: '/test' },
      { op: OpCode.PUSH, arg: { recursive: true, filter: '*.txt' } },
      { op: OpCode.FS_LIST_FILES },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode, {}, fileSystem);
    
    expect(state.status).toBe('complete');
    expect(capturedOptions).toEqual({ recursive: true, filter: '*.txt' });
  });

  it('should error on non-string path', () => {
    const vm = new VM();
    const fileSystem = new MockFileSystemService();
    const bytecode = [
      { op: OpCode.PUSH, arg: 123 },  // Non-string path
      { op: OpCode.FS_LIST_FILES },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode, {}, fileSystem);
    
    expect(state.status).toBe('error');
    expect(state.error).toBe('FS_LIST_FILES requires a string path');
  });

  it('should error on stack underflow', () => {
    const vm = new VM();
    const fileSystem = new MockFileSystemService();
    const bytecode = [
      { op: OpCode.FS_LIST_FILES },  // No path on stack
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode, {}, fileSystem);
    
    expect(state.status).toBe('error');
    expect(state.error).toBe('FS_LIST_FILES: Stack underflow');
  });

  it('should error when FileSystem not available', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.PUSH, arg: '/test' },
      { op: OpCode.FS_LIST_FILES },
      { op: OpCode.HALT }
    ];
    
    // Execute without fileSystem
    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('error');
    expect(state.error).toBe('FileSystem not available');
  });

  it('should handle only path argument without options', () => {
    const vm = new VM();
    const fileSystem = new MockFileSystemService();
    
    let capturedPath: string;
    let capturedOptions: any;
    fileSystem.listFiles = (path: string, options?: any) => {
      capturedPath = path;
      capturedOptions = options;
      return createCVMArray(['/docs/readme.md', '/docs/guide.md']);
    };
    
    const bytecode = [
      { op: OpCode.PUSH, arg: '/docs' },
      { op: OpCode.FS_LIST_FILES },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode, {}, fileSystem);
    
    expect(state.status).toBe('complete');
    expect(capturedPath).toBe('/docs');
    expect(capturedOptions).toEqual({});
    expect(state.stack[0]).toEqual({
      type: 'array',
      elements: ['/docs/readme.md', '/docs/guide.md']
    });
  });
});