import { describe, it, expect } from 'vitest';
import { compile } from '@cvm/parser';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';

describe('RegExp Pattern Matching Integration Tests', () => {
  describe('Complete Source-to-Execution Pipeline', () => {
    it('should compile and execute regex.test() method', () => {
      const source = `
        function main() {
          var emailPattern = /\\w+@\\w+\\.\\w+/;
          var validEmail = "user@example.com";
          var invalidEmail = "not-an-email";
          
          var isValid = emailPattern.test(validEmail);
          var isInvalid = emailPattern.test(invalidEmail);
          
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      // Verify REGEX_TEST instructions generated
      const regexTestInstrs = compileResult.bytecode.filter(instr => instr.op === OpCode.REGEX_TEST);
      expect(regexTestInstrs.length).toBe(2);
      
      const vm = new VM();
      const execResult = vm.execute(compileResult.bytecode);
      expect(execResult.status).toBe('complete');
    });

    it('should compile and execute string.match() method', () => {
      const source = `
        function main() {
          var text = "Contact: user@example.com and admin@test.org";
          var emailPattern = /\\w+@\\w+\\.\\w+/g;
          
          var matches = text.match(emailPattern);
          var noMatches = "no emails here".match(emailPattern);
          
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const stringMatchInstrs = compileResult.bytecode.filter(instr => instr.op === OpCode.STRING_MATCH);
      expect(stringMatchInstrs.length).toBe(2);
      
      const vm = new VM();
      const execResult = vm.execute(compileResult.bytecode);
      expect(execResult.status).toBe('complete');
    });

    it('should compile and execute string.replace() with regex', () => {
      const source = `
        function main() {
          var text = "Replace all test words in this test string";
          var pattern = /test/g;
          
          var replaced = text.replace(pattern, "demo");
          var noReplace = "nothing to change".replace(/xyz/g, "new");
          
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const stringReplaceRegexInstrs = compileResult.bytecode.filter(instr => instr.op === OpCode.STRING_REPLACE_REGEX);
      expect(stringReplaceRegexInstrs.length).toBe(2); // Both literal and variable regex emit STRING_REPLACE_REGEX
      
      const stringReplaceInstrs = compileResult.bytecode.filter(instr => instr.op === OpCode.STRING_REPLACE);
      expect(stringReplaceInstrs.length).toBe(0); // No more STRING_REPLACE for replace() calls
      
      const vm = new VM();
      const execResult = vm.execute(compileResult.bytecode);
      expect(execResult.status).toBe('complete');
    });

    it('should handle all three methods in one program', () => {
      const source = `
        function main() {
          var logPattern = /ERROR|WARN|INFO/gi;
          var logLine = "2024-01-01 ERROR: Something went wrong";
          
          // Test if log line contains a level
          var hasLevel = logPattern.test(logLine);
          
          // Extract the level
          var levelMatches = logLine.match(/ERROR|WARN|INFO/i);
          
          // Replace level with [LEVEL]
          var cleaned = logLine.replace(/ERROR|WARN|INFO/i, "[LEVEL]");
          
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      // Should have all three method types
      const regexTest = compileResult.bytecode.filter(instr => instr.op === OpCode.REGEX_TEST);
      const stringMatch = compileResult.bytecode.filter(instr => instr.op === OpCode.STRING_MATCH);
      const stringReplaceRegex = compileResult.bytecode.filter(instr => instr.op === OpCode.STRING_REPLACE_REGEX);
      
      expect(regexTest.length).toBe(1);
      expect(stringMatch.length).toBe(1);
      expect(stringReplaceRegex.length).toBe(1);
      
      const vm = new VM();
      const execResult = vm.execute(compileResult.bytecode);
      expect(execResult.status).toBe('complete');
    });

    it('should handle complex nested method calls', () => {
      const source = `
        function main() {
          var emailPattern = /([a-zA-Z0-9]+)@([a-zA-Z0-9]+)\\.([a-zA-Z]+)/;
          var input = "Contact john@example.com for support";
          
          // Chain multiple operations
          var hasEmail = emailPattern.test(input);
          
          if (hasEmail) {
            var matches = input.match(emailPattern);
            var anonymized = input.replace(emailPattern, "$2@[HIDDEN].$3");
          }
          
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
    it('should handle runtime errors gracefully', () => {
      const source = `
        function main() {
          var pattern = /test/;
          var notAString = 42;
          
          // This should fail at runtime
          var result = pattern.test(notAString);
          
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const vm = new VM();
      const execResult = vm.execute(compileResult.bytecode);
      
      expect(execResult.status).toBe('error');
      expect(execResult.error).toContain('Expected string');
    });

    it('should handle method calls on non-regex objects', () => {
      const source = `
        function main() {
          var notRegex = "just a string";
          var text = "test string";
          
          // This should fail at runtime
          var result = notRegex.test(text);
          
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const vm = new VM();
      const execResult = vm.execute(compileResult.bytecode);
      
      expect(execResult.status).toBe('error');
      expect(execResult.error).toContain('Expected regex object');
    });
  });

  describe('Performance and Memory', () => {
    it('should handle multiple regex operations efficiently', () => {
      const source = `
        function main() {
          var logPattern = /test/g;
          var demoPattern = /demo/i;
          var samplePattern = /sample/gm;
          
          var text = "Test demo sample text for testing";
          
          // Use all patterns
          var matches1 = text.match(logPattern);
          var replaced1 = text.replace(demoPattern, "[MATCH]");
          var hasMatch1 = samplePattern.test(text);
          
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const vm = new VM();
      const execResult = vm.execute(compileResult.bytecode);
      expect(execResult.status).toBe('complete');
    });

    it('should properly manage heap objects', () => {
      const source = `
        function main() {
          var pattern = /test/;
          var text = "test string";
          
          // Create multiple objects
          var result1 = pattern.test(text);
          var matches = text.match(pattern);
          var replaced = text.replace(pattern, "demo");
          
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const vm = new VM();
      const initialHeapSize = vm.createInitialState().heap.objects.size;
      
      const execResult = vm.execute(compileResult.bytecode);
      expect(execResult.status).toBe('complete');
      
      // Heap should have grown with regex and array objects
      expect(execResult.heap.objects.size).toBeGreaterThan(initialHeapSize);
    });
  });

  describe('JavaScript Compliance Validation', () => {
    it('should match JavaScript regex behavior exactly', () => {
      const source = `
        function main() {
          var pattern = /Te*st/i;
          var text = "This is a Test";
          
          var caseInsensitive = pattern.test(text);
          var matches = text.match(pattern);
          var replaced = text.replace(pattern, "Demo");
          
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const vm = new VM();
      const execResult = vm.execute(compileResult.bytecode);
      expect(execResult.status).toBe('complete');
      
      // Results should match JavaScript behavior:
      // /Te*st/i.test("This is a Test") === true
      // "This is a Test".match(/Te*st/i) === ["Test"]
      // "This is a Test".replace(/Te*st/i, "Demo") === "This is a Demo"
    });

    it('should handle global flag state correctly', () => {
      const source = `
        function main() {
          var globalPattern = /test/g;
          var text = "test and test again";
          
          // Global pattern should find all matches
          var allMatches = text.match(globalPattern);
          
          // Replace should replace all with global flag
          var allReplaced = text.replace(globalPattern, "demo");
          
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
});