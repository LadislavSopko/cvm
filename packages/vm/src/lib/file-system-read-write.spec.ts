import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { SandboxedFileSystem } from './file-system.js';

describe('SandboxedFileSystem Read/Write Operations', () => {
  const testDir = path.join(process.cwd(), 'test-sandbox');
  let fileSystem: SandboxedFileSystem;
  
  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Set sandbox path
    process.env.CVM_SANDBOX_PATHS = testDir;
    fileSystem = new SandboxedFileSystem();
  });
  
  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    delete process.env.CVM_SANDBOX_PATHS;
  });

  describe('readFile', () => {
    it('should read existing file content', () => {
      const testFile = path.join(testDir, 'test.txt');
      const content = 'Hello, CVM!';
      fs.writeFileSync(testFile, content);
      
      const result = fileSystem.readFile(testFile);
      expect(result).toBe(content);
    });

    it('should return null for non-existent file', () => {
      const result = fileSystem.readFile(path.join(testDir, 'missing.txt'));
      expect(result).toBe(null);
    });

    it('should return null for file outside sandbox', () => {
      const result = fileSystem.readFile('/etc/passwd');
      expect(result).toBe(null);
    });

    it('should return null for directory', () => {
      const subDir = path.join(testDir, 'subdir');
      fs.mkdirSync(subDir);
      
      const result = fileSystem.readFile(subDir);
      expect(result).toBe(null);
    });

    it('should return null for symbolic link', () => {
      const targetFile = path.join(testDir, 'target.txt');
      const linkFile = path.join(testDir, 'link.txt');
      fs.writeFileSync(targetFile, 'content');
      fs.symlinkSync(targetFile, linkFile);
      
      const result = fileSystem.readFile(linkFile);
      expect(result).toBe(null);
    });

    it('should handle relative paths', () => {
      const testFile = path.join(testDir, 'test.txt');
      fs.writeFileSync(testFile, 'content');
      
      // Change to parent directory
      const originalCwd = process.cwd();
      process.chdir(path.dirname(testDir));
      
      try {
        const relativePath = `./${path.basename(testDir)}/test.txt`;
        const result = fileSystem.readFile(relativePath);
        expect(result).toBe('content');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should read UTF-8 content correctly', () => {
      const testFile = path.join(testDir, 'unicode.txt');
      const content = '🎉 Unicode test: café, 中文, עברית';
      fs.writeFileSync(testFile, content, 'utf-8');
      
      const result = fileSystem.readFile(testFile);
      expect(result).toBe(content);
    });
  });

  describe('writeFile', () => {
    it('should write content to new file', () => {
      const testFile = path.join(testDir, 'output.txt');
      const content = 'Test content';
      
      const result = fileSystem.writeFile(testFile, content);
      expect(result).toBe(true);
      
      const written = fs.readFileSync(testFile, 'utf-8');
      expect(written).toBe(content);
    });

    it('should overwrite existing file', () => {
      const testFile = path.join(testDir, 'output.txt');
      fs.writeFileSync(testFile, 'old content');
      
      const result = fileSystem.writeFile(testFile, 'new content');
      expect(result).toBe(true);
      
      const written = fs.readFileSync(testFile, 'utf-8');
      expect(written).toBe('new content');
    });

    it('should create parent directories if needed', () => {
      const testFile = path.join(testDir, 'sub', 'dir', 'output.txt');
      
      const result = fileSystem.writeFile(testFile, 'content');
      expect(result).toBe(true);
      
      expect(fs.existsSync(testFile)).toBe(true);
      const written = fs.readFileSync(testFile, 'utf-8');
      expect(written).toBe('content');
    });

    it('should return false for path outside sandbox', () => {
      const result = fileSystem.writeFile('/tmp/evil.txt', 'content');
      expect(result).toBe(false);
    });

    it('should return false if parent directory is outside sandbox', () => {
      // Try to write to a file whose parent is outside sandbox
      const result = fileSystem.writeFile('../../../evil.txt', 'content');
      expect(result).toBe(false);
    });

    it('should not overwrite symbolic links', () => {
      const targetFile = '/tmp/target.txt';
      const linkFile = path.join(testDir, 'link.txt');
      
      // Create a symlink pointing outside sandbox
      if (fs.existsSync(linkFile)) {
        fs.unlinkSync(linkFile);
      }
      fs.symlinkSync(targetFile, linkFile);
      
      const result = fileSystem.writeFile(linkFile, 'content');
      expect(result).toBe(false);
      
      // Ensure target wasn't created
      expect(fs.existsSync(targetFile)).toBe(false);
    });

    it('should handle relative paths', () => {
      const originalCwd = process.cwd();
      process.chdir(path.dirname(testDir));
      
      try {
        const relativePath = `./${path.basename(testDir)}/output.txt`;
        const result = fileSystem.writeFile(relativePath, 'content');
        expect(result).toBe(true);
        
        const fullPath = path.join(testDir, 'output.txt');
        expect(fs.existsSync(fullPath)).toBe(true);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should write UTF-8 content correctly', () => {
      const testFile = path.join(testDir, 'unicode.txt');
      const content = '🎉 Unicode test: café, 中文, עברית';
      
      const result = fileSystem.writeFile(testFile, content);
      expect(result).toBe(true);
      
      const written = fs.readFileSync(testFile, 'utf-8');
      expect(written).toBe(content);
    });

    it('should handle empty content', () => {
      const testFile = path.join(testDir, 'empty.txt');
      
      const result = fileSystem.writeFile(testFile, '');
      expect(result).toBe(true);
      
      const written = fs.readFileSync(testFile, 'utf-8');
      expect(written).toBe('');
    });
  });

  describe('sandbox security', () => {
    it('should respect multiple sandbox paths', () => {
      const testDir2 = path.join(process.cwd(), 'test-sandbox2');
      fs.mkdirSync(testDir2, { recursive: true });
      
      try {
        // Set multiple paths BEFORE creating the SandboxedFileSystem instance
        const originalPaths = process.env.CVM_SANDBOX_PATHS;
        process.env.CVM_SANDBOX_PATHS = `${testDir},${testDir2}`;
        
        // Create new instance that will read the updated env var
        const fs2 = new SandboxedFileSystem();
        
        // Write to first sandbox
        const file1 = path.join(testDir, 'file1.txt');
        expect(fs2.writeFile(file1, 'content1')).toBe(true);
        
        // Write to second sandbox
        const file2 = path.join(testDir2, 'file2.txt');
        expect(fs2.writeFile(file2, 'content2')).toBe(true);
        
        // Read from both
        expect(fs2.readFile(file1)).toBe('content1');
        expect(fs2.readFile(file2)).toBe('content2');
        
        // Restore original paths
        process.env.CVM_SANDBOX_PATHS = originalPaths;
      } finally {
        fs.rmSync(testDir2, { recursive: true, force: true });
      }
    });

    it('should handle path traversal attempts', () => {
      const testFile = path.join(testDir, 'safe.txt');
      fs.writeFileSync(testFile, 'safe content');
      
      // Various traversal attempts
      const traversalPaths = [
        path.join(testDir, '..', '..', 'etc', 'passwd'),
        path.join(testDir, '..', 'outside.txt'),
        `${testDir}/../../../etc/passwd`
      ];
      
      for (const badPath of traversalPaths) {
        expect(fileSystem.readFile(badPath)).toBe(null);
        expect(fileSystem.writeFile(badPath, 'evil')).toBe(false);
      }
    });
  });
});