import { describe, it, expect } from 'vitest';
import { compile } from '@cvm/parser';
import { VM } from '@cvm/vm';

describe('String checking methods integration', () => {
  const vm = new VM();

  describe('string.includes()', () => {
    it('should return true when string contains search string', () => {
      const source = `
        function main() {
          const text = "hello world";
          return text.includes("world");
        }
      `;
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const result = vm.execute(compileResult.bytecode);
      expect(result.status).toBe('complete');
      expect(result.returnValue).toBe(true);
    });

    it('should return false when string does not contain search string', () => {
      const source = `
        function main() {
          const text = "hello world";
          return text.includes("foo");
        }
      `;
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const result = vm.execute(compileResult.bytecode);
      expect(result.status).toBe('complete');
      expect(result.returnValue).toBe(false);
    });

    it('should handle empty search string', () => {
      const source = `
        function main() {
          const text = "hello world";
          return text.includes("");
        }
      `;
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const result = vm.execute(compileResult.bytecode);
      expect(result.status).toBe('complete');
      expect(result.returnValue).toBe(true);
    });

    it('should detect test in file path', () => {
      const source = `
        function main() {
          const path = "/home/user/test/file.spec.ts";
          if (path.includes("test")) {
            return "Test file detected";
          }
          return "Not a test file";
        }
      `;
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const result = vm.execute(compileResult.bytecode);
      expect(result.status).toBe('complete');
      expect(result.returnValue).toBe("Test file detected");
    });
  });

  describe('string.endsWith()', () => {
    it('should return true when string ends with suffix', () => {
      const source = `
        function main() {
          const filename = "script.ts";
          return filename.endsWith(".ts");
        }
      `;
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const result = vm.execute(compileResult.bytecode);
      expect(result.status).toBe('complete');
      expect(result.returnValue).toBe(true);
    });

    it('should return false when string does not end with suffix', () => {
      const source = `
        function main() {
          const filename = "script.js";
          return filename.endsWith(".ts");
        }
      `;
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const result = vm.execute(compileResult.bytecode);
      expect(result.status).toBe('complete');
      expect(result.returnValue).toBe(false);
    });

    it('should detect TypeScript files', () => {
      const source = `
        function main() {
          const path = "/home/user/components/Button.ts";
          if (path.endsWith(".ts")) {
            return "TypeScript file detected";
          }
          return "Not a TypeScript file";
        }
      `;
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const result = vm.execute(compileResult.bytecode);
      expect(result.status).toBe('complete');
      expect(result.returnValue).toBe("TypeScript file detected");
    });
  });

  describe('string.startsWith()', () => {
    it('should return true when string starts with prefix', () => {
      const source = `
        function main() {
          const path = "/home/user/documents";
          return path.startsWith("/home");
        }
      `;
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const result = vm.execute(compileResult.bytecode);
      expect(result.status).toBe('complete');
      expect(result.returnValue).toBe(true);
    });

    it('should return false when string does not start with prefix', () => {
      const source = `
        function main() {
          const path = "/usr/local/bin";
          return path.startsWith("/home");
        }
      `;
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const result = vm.execute(compileResult.bytecode);
      expect(result.status).toBe('complete');
      expect(result.returnValue).toBe(false);
    });

    it('should detect home directory files', () => {
      const source = `
        function main() {
          const path = "/home/user/projects/cvm/src/main.ts";
          if (path.startsWith("/home")) {
            return "Home directory file";
          }
          return "System file";
        }
      `;
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const result = vm.execute(compileResult.bytecode);
      expect(result.status).toBe('complete');
      expect(result.returnValue).toBe("Home directory file");
    });
  });

  describe('Combined string checking methods', () => {
    it('should use all three methods together', () => {
      const source = `
        function main() {
          const path = "/home/user/test/component.spec.ts";
          let result = "";
          
          if (path.startsWith("/home")) {
            result = result + "home";
          }
          
          if (path.includes("test")) {
            if (result.length > 0) {
              result = result + "-";
            }
            result = result + "test";
          }
          
          if (path.endsWith(".ts")) {
            if (result.length > 0) {
              result = result + "-";
            }
            result = result + "typescript";
          }
          
          return result;
        }
      `;
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const result = vm.execute(compileResult.bytecode);
      expect(result.status).toBe('complete');
      expect(result.returnValue).toBe("home-test-typescript");
    });
  });
});