import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SandboxedFileSystem } from './file-system.js';
import { isCVMArray } from '@cvm/types';
import * as fs from 'fs';

// Mock fs module
vi.mock('fs');

describe('SandboxedFileSystem', () => {
  let fileSystem: SandboxedFileSystem;
  const mockFiles = [
    { name: 'file1.txt', isDirectory: () => false, isSymbolicLink: () => false },
    { name: 'file2.js', isDirectory: () => false, isSymbolicLink: () => false },
    { name: 'subdir', isDirectory: () => true, isSymbolicLink: () => false },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CVM_SANDBOX_PATHS = '/test,/home/user/docs';
    fileSystem = new SandboxedFileSystem();
  });

  it('should return absolute paths for files', () => {
    vi.mocked(fs.readdirSync).mockReturnValue(mockFiles as any);
    vi.mocked(fs.statSync).mockReturnValue({
      size: 1024,
      mtime: new Date('2024-01-01')
    } as any);

    const result = fileSystem.listFiles('/test');
    
    expect(isCVMArray(result)).toBe(true);
    if (isCVMArray(result)) {
      expect(result.elements).toHaveLength(3);
      expect(result.elements[0]).toBe('/test/file1.txt');
      expect(result.elements[1]).toBe('/test/file2.js');
      expect(result.elements[2]).toBe('/test/subdir');
    }
  });

  it('should filter files by pattern', () => {
    vi.mocked(fs.readdirSync).mockReturnValue(mockFiles as any);
    vi.mocked(fs.statSync).mockReturnValue({
      size: 1024,
      mtime: new Date('2024-01-01')
    } as any);

    const result = fileSystem.listFiles('/test', { filter: '*.txt' });
    
    expect(isCVMArray(result)).toBe(true);
    if (isCVMArray(result)) {
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0]).toBe('/test/file1.txt');
    }
  });

  it('should handle recursive listing', () => {
    // Mock directory structure
    vi.mocked(fs.readdirSync)
      .mockReturnValueOnce(mockFiles as any) // Root dir
      .mockReturnValueOnce([ // Subdir contents
        { name: 'nested.txt', isDirectory: () => false, isSymbolicLink: () => false }
      ] as any);
    
    vi.mocked(fs.statSync).mockReturnValue({
      size: 1024,
      mtime: new Date('2024-01-01')
    } as any);

    const result = fileSystem.listFiles('/test', { recursive: true });
    
    expect(isCVMArray(result)).toBe(true);
    if (isCVMArray(result)) {
      expect(result.elements).toContain('/test/file1.txt');
      expect(result.elements).toContain('/test/file2.js');
      expect(result.elements).toContain('/test/subdir');
      expect(result.elements).toContain('/test/subdir/nested.txt');
    }
  });

  it('should return empty array for unauthorized paths', () => {
    const result = fileSystem.listFiles('/etc/passwd');
    expect(isCVMArray(result)).toBe(true);
    if (isCVMArray(result)) {
      expect(result.elements).toHaveLength(0);
    }
  });

  it('should handle empty sandbox paths', () => {
    process.env.CVM_SANDBOX_PATHS = '';
    fileSystem = new SandboxedFileSystem();
    
    const result1 = fileSystem.listFiles('/home/user/docs');
    expect(isCVMArray(result1)).toBe(true);
    if (isCVMArray(result1)) {
      expect(result1.elements).toHaveLength(0);
    }
    
    process.env.CVM_SANDBOX_PATHS = '/etc';
    const result2 = fileSystem.listFiles('/home/user/docs');
    expect(isCVMArray(result2)).toBe(true);
    if (isCVMArray(result2)) {
      expect(result2.elements).toHaveLength(0);
    }
  });

  it('should support glob patterns in filter', () => {
    const files = [
      { name: 'test.spec.ts', isDirectory: () => false, isSymbolicLink: () => false },
      { name: 'index.ts', isDirectory: () => false, isSymbolicLink: () => false },
      { name: 'test-utils.js', isDirectory: () => false, isSymbolicLink: () => false },
      { name: 'test-main.ts', isDirectory: () => false, isSymbolicLink: () => false },
    ];
    
    vi.mocked(fs.readdirSync).mockReturnValue(files as any);
    vi.mocked(fs.statSync).mockReturnValue({
      size: 1024,
      mtime: new Date('2024-01-01')
    } as any);
    
    const tsFiles = fileSystem.listFiles('/test', { filter: '*.ts' });
    expect(isCVMArray(tsFiles)).toBe(true);
    if (isCVMArray(tsFiles)) {
      expect(tsFiles.elements).toHaveLength(3); // test.spec.ts, index.ts, test-main.ts
      expect(tsFiles.elements).toContain('/test/test.spec.ts');
      expect(tsFiles.elements).toContain('/test/index.ts');
      expect(tsFiles.elements).toContain('/test/test-main.ts');
    }
    
    const testFiles = fileSystem.listFiles('/test', { filter: 'test-*' });
    expect(isCVMArray(testFiles)).toBe(true);
    if (isCVMArray(testFiles)) {
      expect(testFiles.elements).toHaveLength(2);
      expect(testFiles.elements).toContain('/test/test-utils.js');
      expect(testFiles.elements).toContain('/test/test-main.ts');
    }
  });
});