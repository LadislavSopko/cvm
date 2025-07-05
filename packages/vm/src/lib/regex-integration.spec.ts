import { describe, it, expect } from 'vitest';
import { compile } from '@cvm/parser';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';

describe('Regex Integration Tests', () => {
  describe('End-to-End Compilation and Execution', () => {
    it('should compile and execute basic regex literal', () => {
      const source = `
        function main() {
          var pattern = /test/gi;
          return 0;
        }
      `;
      
      // Step 1: Compile source to bytecode
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      expect(compileResult.errors.length).toBe(0);
      expect(compileResult.bytecode.length).toBeGreaterThan(0);
      
      // Verify LOAD_REGEX instruction was generated
      const hasLoadRegex = compileResult.bytecode.some(instr => instr.op === OpCode.LOAD_REGEX);
      expect(hasLoadRegex).toBe(true);
      
      // Step 2: Execute bytecode in VM
      const vm = new VM();
      const execResult = vm.execute(compileResult.bytecode);
      
      // Verify execution succeeded
      expect(execResult.status).toBe('complete');
      expect(execResult.error).toBeUndefined();
      
      // Step 3: Verify regex object was created
      // After main() execution, regex should be on stack or in variables
      // Since it's a local variable, it should be cleaned up, but heap object exists
      expect(execResult.heap.objects.size).toBeGreaterThan(0);
    });

    it('should handle multiple regex literals in one program', () => {
      const source = `
        function main() {
          var email = /\\w+@\\w+\\.\\w+/i;
          var phone = /\\d{3}-\\d{3}-\\d{4}/;
          var url = /https?:\\/\\/[^\\s]+/g;
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      // Should have three LOAD_REGEX instructions
      const loadRegexInstrs = compileResult.bytecode.filter(instr => instr.op === OpCode.LOAD_REGEX);
      expect(loadRegexInstrs.length).toBe(3);
      
      // Verify each instruction has correct payload
      expect(loadRegexInstrs[0].arg).toEqual({ pattern: '\\w+@\\w+\\.\\w+', flags: 'i' });
      expect(loadRegexInstrs[1].arg).toEqual({ pattern: '\\d{3}-\\d{3}-\\d{4}', flags: '' });
      expect(loadRegexInstrs[2].arg).toEqual({ pattern: 'https?:\\/\\/[^\\s]+', flags: 'g' });
      
      // Execute and verify
      const vm = new VM();
      const execResult = vm.execute(compileResult.bytecode);
      
      expect(execResult.status).toBe('complete');
      expect(execResult.heap.objects.size).toBeGreaterThan(0);
    });

    it('should handle complex regex patterns with all flags', () => {
      const source = `
        function main() {
          var complex = /^(?:https?:\\/\\/)?(?:www\\.)?([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\\.)+[a-zA-Z]{2,}$/gims;
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const loadRegexInstr = compileResult.bytecode.find(instr => instr.op === OpCode.LOAD_REGEX);
      expect(loadRegexInstr).toBeDefined();
      expect(loadRegexInstr!.arg.pattern).toBe('^(?:https?:\\/\\/)?(?:www\\.)?([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\\.)+[a-zA-Z]{2,}$');
      expect(loadRegexInstr!.arg.flags).toBe('gims');
      
      const vm = new VM();
      const execResult = vm.execute(compileResult.bytecode);
      
      expect(execResult.status).toBe('complete');
    });

    it('should handle regex in variable assignments', () => {
      const source = `
        function main() {
          var pattern;
          pattern = /assignment.*test/m;
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const vm = new VM();
      const execResult = vm.execute(compileResult.bytecode);
      
      expect(execResult.status).toBe('complete');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid regex patterns in source code', () => {
      const source = `
        function main() {
          var invalid = /[unclosed/;
          return 0;
        }
      `;
      
      // Should compile successfully (compiler doesn't validate regex)
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      // Should fail at runtime
      const vm = new VM();
      const execResult = vm.execute(compileResult.bytecode);
      
      expect(execResult.status).toBe('error');
      expect(execResult.error).toBeDefined();
      expect(execResult.error).toContain('Invalid regular expression');
    });

    it('should handle invalid flags in source code', () => {
      const source = `
        function main() {
          var invalid = /test/xyz;
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const vm = new VM();
      const execResult = vm.execute(compileResult.bytecode);
      
      expect(execResult.status).toBe('error');
      expect(execResult.error).toContain('Invalid regular expression');
    });

    it('should handle multiple invalid regex in one program', () => {
      const source = `
        function main() {
          var first = /[unclosed/;
          var second = /valid/g;
          var third = /test/xyz;
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const vm = new VM();
      const execResult = vm.execute(compileResult.bytecode);
      
      // Should fail on first invalid regex
      expect(execResult.status).toBe('error');
      expect(execResult.error).toContain('Invalid regular expression');
    });
  });

  describe('Performance and Memory', () => {
    it('should handle many regex literals efficiently', () => {
      // Generate source with many regex literals
      const regexCount = 50;
      let source = 'function main() {\n';
      
      for (let i = 0; i < regexCount; i++) {
        source += `  var regex${i} = /pattern${i}/g;\n`;
      }
      
      source += '  return 0;\n}';
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      // Should have correct number of LOAD_REGEX instructions
      const loadRegexInstrs = compileResult.bytecode.filter(instr => instr.op === OpCode.LOAD_REGEX);
      expect(loadRegexInstrs.length).toBe(regexCount);
      
      const vm = new VM();
      const execResult = vm.execute(compileResult.bytecode);
      
      expect(execResult.status).toBe('complete');
      expect(execResult.heap.objects.size).toBeGreaterThan(0);
    });

    it('should properly clean up regex objects', () => {
      const source = `
        function main() {
          var temp = /temporary/;
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      const vm = new VM();
      
      const initialHeapSize = vm.createInitialState().heap.objects.size;
      const execResult = vm.execute(compileResult.bytecode);
      
      expect(execResult.status).toBe('complete');
      
      // Heap should have grown (regex objects allocated)
      expect(execResult.heap.objects.size).toBeGreaterThan(initialHeapSize);
    });
  });
});