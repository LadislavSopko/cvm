import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SandboxedFileSystem } from './file-system.js';
import * as fs from 'fs';
import * as path from 'path';

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
    
    expect(result.elements).toHaveLength(3);
    expect(result.elements[0]).toBe('/test/file1.txt');
    expect(result.elements[1]).toBe('/test/file2.js');
    expect(result.elements[2]).toBe('/test/subdir');
  });

  it('should filter files by pattern', () => {
    vi.mocked(fs.readdirSync).mockReturnValue(mockFiles as any);
    vi.mocked(fs.statSync).mockReturnValue({
      size: 1024,
      mtime: new Date('2024-01-01')
    } as any);

    const result = fileSystem.listFiles('/test', { filter: '*.txt' });
    
    expect(result.elements).toHaveLength(1);
    expect(result.elements[0]).toBe('/test/file1.txt');
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
    
    expect(result.elements).toContain('/test/file1.txt');
    expect(result.elements).toContain('/test/file2.js');
    expect(result.elements).toContain('/test/subdir');
    expect(result.elements).toContain('/test/subdir/nested.txt');
  });

  it('should return empty array for unauthorized paths', () => {
    const result = fileSystem.listFiles('/unauthorized/path');
    
    expect(result.elements).toHaveLength(0);
  });

  it('should validate paths against sandbox', () => {
    process.env.CVM_SANDBOX_PATHS = '/allowed/path';
    fileSystem = new SandboxedFileSystem();
    
    vi.mocked(fs.readdirSync).mockReturnValue(mockFiles as any);
    vi.mocked(fs.statSync).mockReturnValue({
      size: 1024,
      mtime: new Date('2024-01-01')
    } as any);

    // Allowed path
    const result1 = fileSystem.listFiles('/allowed/path/subdir');
    expect(result1.elements.length).toBeGreaterThan(0);

    // Disallowed path
    const result2 = fileSystem.listFiles('/not/allowed');
    expect(result2.elements).toHaveLength(0);
  });

  it('should handle glob patterns correctly', () => {
    const testFiles = [
      { name: 'test.spec.ts', isDirectory: () => false, isSymbolicLink: () => false },
      { name: 'main.ts', isDirectory: () => false, isSymbolicLink: () => false },
      { name: 'readme.md', isDirectory: () => false, isSymbolicLink: () => false },
      { name: 'test.js', isDirectory: () => false, isSymbolicLink: () => false },
    ];

    vi.mocked(fs.readdirSync).mockReturnValue(testFiles as any);
    vi.mocked(fs.statSync).mockReturnValue({
      size: 1024,
      mtime: new Date('2024-01-01')
    } as any);

    // Test *.ts pattern
    const tsFiles = fileSystem.listFiles('/test', { filter: '*.ts' });
    expect(tsFiles.elements).toHaveLength(2);
    expect(tsFiles.elements).toContain('/test/test.spec.ts');
    expect(tsFiles.elements).toContain('/test/main.ts');

    // Test test* pattern
    const testFiles2 = fileSystem.listFiles('/test', { filter: 'test*' });
    expect(testFiles2.elements).toHaveLength(2);
    expect(testFiles2.elements).toContain('/test/test.spec.ts');
    expect(testFiles2.elements).toContain('/test/test.js');
  });
});