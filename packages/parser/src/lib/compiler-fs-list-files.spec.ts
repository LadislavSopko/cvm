import { describe, it, expect } from 'vitest';
import { compile } from './compiler.js';
import { OpCode } from './bytecode.js';

describe('Compiler - fs.listFiles()', () => {
  it('should compile fs.listFiles() with single path argument', () => {
    const source = `
      function main() {
        let files = fs.listFiles("/test/path");
      }
      main();
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    
    // Find FS_LIST_FILES opcode
    const fsListIndex = result.bytecode.findIndex(i => i.op === OpCode.FS_LIST_FILES);
    expect(fsListIndex).toBeGreaterThan(-1);
    
    // Check that path is pushed before FS_LIST_FILES
    expect(result.bytecode[fsListIndex - 1]).toEqual({
      op: OpCode.PUSH,
      arg: '/test/path'
    });
  });

  it('should compile fs.listFiles() with options object', () => {
    const source = `
      function main() {
        let files = fs.listFiles("/test", { recursive: true });
      }
      main();
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    
    // Find FS_LIST_FILES opcode
    const fsListIndex = result.bytecode.findIndex(i => i.op === OpCode.FS_LIST_FILES);
    expect(fsListIndex).toBeGreaterThan(-1);
    
    // Should have PUSH operations for both arguments before FS_LIST_FILES
    // The exact bytecode for object literals might be complex, 
    // so just verify FS_LIST_FILES is present
    expect(result.bytecode.some(i => i.op === OpCode.FS_LIST_FILES)).toBe(true);
  });

  it('should compile fs.listFiles() with filter option', () => {
    const source = `
      function main() {
        let txtFiles = fs.listFiles("/docs", { filter: "*.txt" });
      }
      main();
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.bytecode.some(i => i.op === OpCode.FS_LIST_FILES)).toBe(true);
  });

  it('should compile fs.listFiles() with both recursive and filter options', () => {
    const source = `
      function main() {
        let jsFiles = fs.listFiles("/src", { 
          recursive: true, 
          filter: "*.js" 
        });
      }
      main();
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.bytecode.some(i => i.op === OpCode.FS_LIST_FILES)).toBe(true);
  });

  it('should compile fs.listFiles() with no arguments (default to current dir)', () => {
    const source = `
      function main() {
        let files = fs.listFiles();
      }
      main();
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    
    // Find FS_LIST_FILES opcode
    const fsListIndex = result.bytecode.findIndex(i => i.op === OpCode.FS_LIST_FILES);
    expect(fsListIndex).toBeGreaterThan(-1);
    
    // Should push default '.' before FS_LIST_FILES
    expect(result.bytecode[fsListIndex - 1]).toEqual({
      op: OpCode.PUSH,
      arg: '.'
    });
  });

  it('should compile fs.listFiles() with variable path', () => {
    const source = `
      function main() {
        let dir = "/home/user";
        let files = fs.listFiles(dir);
      }
      main();
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.bytecode.some(i => i.op === OpCode.FS_LIST_FILES)).toBe(true);
    expect(result.bytecode.some(i => i.op === OpCode.LOAD && i.arg === 'dir')).toBe(true);
  });

  it('should compile fs.listFiles() result used in loop', () => {
    const source = `
      function main() {
        let files = fs.listFiles("/test");
        for (const file of files) {
          console.log(file.name);
        }
      }
      main();
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.bytecode.some(i => i.op === OpCode.FS_LIST_FILES)).toBe(true);
    expect(result.bytecode.some(i => i.op === OpCode.ITER_START)).toBe(true);
  });

  it('should compile fs.listFiles() with array access to result', () => {
    const source = `
      function main() {
        let files = fs.listFiles("/test");
        if (files.length > 0) {
          let first = files[0];
        }
      }
      main();
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.bytecode.some(i => i.op === OpCode.FS_LIST_FILES)).toBe(true);
    expect(result.bytecode.some(i => i.op === OpCode.LENGTH)).toBe(true);
    expect(result.bytecode.some(i => i.op === OpCode.ARRAY_GET)).toBe(true);
  });

  it('should compile chained method calls with fs.listFiles', () => {
    const source = `
      function main() {
        let count = fs.listFiles("/test").length;
      }
      main();
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.bytecode.some(i => i.op === OpCode.FS_LIST_FILES)).toBe(true);
    expect(result.bytecode.some(i => i.op === OpCode.LENGTH)).toBe(true);
  });

  it('should compile fs.listFiles() used directly in condition', () => {
    const source = `
      function main() {
        if (fs.listFiles("/test").length == 0) {
          console.log("Empty directory");
        }
      }
      main();
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.bytecode.some(i => i.op === OpCode.FS_LIST_FILES)).toBe(true);
    expect(result.bytecode.some(i => i.op === OpCode.LENGTH)).toBe(true);
    expect(result.bytecode.some(i => i.op === OpCode.EQ)).toBe(true);
  });

  it('should compile nested fs.listFiles() calls', () => {
    const source = `
      function main() {
        let dirs = fs.listFiles("/", { filter: "*/" });
        for (const dir of dirs) {
          let files = fs.listFiles(dir.name, { recursive: true });
        }
      }
      main();
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    // Should have two FS_LIST_FILES opcodes
    const fsListCount = result.bytecode.filter(i => i.op === OpCode.FS_LIST_FILES).length;
    expect(fsListCount).toBe(2);
  });

  it('should compile fs.listFiles() with expression as path', () => {
    const source = `
      function main() {
        let base = "/home";
        let user = "john";
        let files = fs.listFiles(base + "/" + user);
      }
      main();
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.bytecode.some(i => i.op === OpCode.FS_LIST_FILES)).toBe(true);
    expect(result.bytecode.some(i => i.op === OpCode.ADD)).toBe(true); // VM decides at runtime
  });
});