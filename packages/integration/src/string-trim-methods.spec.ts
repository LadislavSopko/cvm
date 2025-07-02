import { describe, it, expect } from 'vitest';
import { compile } from '@cvm/parser';
import { VM } from '@cvm/vm';

describe('String trim methods integration', () => {
  const vm = new VM();

  describe('string.trim()', () => {
    it('should trim whitespace from both ends', () => {
      const source = `
        function main() {
          const input = "  hello world  ";
          return input.trim();
        }
      `;
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const result = vm.execute(compileResult.bytecode);
      expect(result.status).toBe('complete');
      expect(result.returnValue).toBe("hello world");
    });

    it('should handle user input cleaning', () => {
      const source = `
        function main() {
          const userInput = "  file.txt  ";
          const cleanInput = userInput.trim();
          return cleanInput;
        }
      `;
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const result = vm.execute(compileResult.bytecode);
      expect(result.status).toBe('complete');
      expect(result.returnValue).toBe("file.txt");
    });

    it('should handle empty string', () => {
      const source = `
        function main() {
          const empty = "";
          return empty.trim();
        }
      `;
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const result = vm.execute(compileResult.bytecode);
      expect(result.status).toBe('complete');
      expect(result.returnValue).toBe("");
    });

    it('should handle string with only whitespace', () => {
      const source = `
        function main() {
          const spaces = "   ";
          return spaces.trim();
        }
      `;
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const result = vm.execute(compileResult.bytecode);
      expect(result.status).toBe('complete');
      expect(result.returnValue).toBe("");
    });
  });

  describe('string.trimStart()', () => {
    it('should trim whitespace from start only', () => {
      const source = `
        function main() {
          const input = "  hello world  ";
          return input.trimStart();
        }
      `;
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const result = vm.execute(compileResult.bytecode);
      expect(result.status).toBe('complete');
      expect(result.returnValue).toBe("hello world  ");
    });

    it('should clean leading whitespace from user input', () => {
      const source = `
        function main() {
          const userInput = "   config.json";
          const cleanStart = userInput.trimStart();
          return cleanStart;
        }
      `;
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const result = vm.execute(compileResult.bytecode);
      expect(result.status).toBe('complete');
      expect(result.returnValue).toBe("config.json");
    });

    it('should handle tabs and newlines', () => {
      const source = `
        function main() {
          const input = "\\t\\n  data.csv";
          return input.trimStart();
        }
      `;
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const result = vm.execute(compileResult.bytecode);
      expect(result.status).toBe('complete');
      expect(result.returnValue).toBe("data.csv");
    });
  });

  describe('string.trimEnd()', () => {
    it('should trim whitespace from end only', () => {
      const source = `
        function main() {
          const input = "  hello world  ";
          return input.trimEnd();
        }
      `;
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const result = vm.execute(compileResult.bytecode);
      expect(result.status).toBe('complete');
      expect(result.returnValue).toBe("  hello world");
    });

    it('should clean trailing whitespace from user input', () => {
      const source = `
        function main() {
          const userInput = "report.pdf   ";
          const cleanEnd = userInput.trimEnd();
          return cleanEnd;
        }
      `;
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const result = vm.execute(compileResult.bytecode);
      expect(result.status).toBe('complete');
      expect(result.returnValue).toBe("report.pdf");
    });

    it('should handle various trailing whitespace', () => {
      const source = `
        function main() {
          const input = "document.txt\\t\\n  ";
          return input.trimEnd();
        }
      `;
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const result = vm.execute(compileResult.bytecode);
      expect(result.status).toBe('complete');
      expect(result.returnValue).toBe("document.txt");
    });
  });

  describe('Combined trim methods', () => {
    it('should use all three trim methods together', () => {
      const source = `
        function main() {
          const userInput = "  important.doc  ";
          const results = [];
          
          results.push(userInput.trim());
          results.push(userInput.trimStart());
          results.push(userInput.trimEnd());
          
          return results[0] + "," + results[1] + "," + results[2];
        }
      `;
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const result = vm.execute(compileResult.bytecode);
      expect(result.status).toBe('complete');
      expect(result.returnValue).toBe("important.doc,important.doc  ,  important.doc");
    });

    it('should clean user input for file operations', () => {
      const source = `
        function main() {
          // Simulate user input with accidental spaces
          const fileName = "  README.md  ";
          const dirName = "   src/";
          const ext = ".ts   ";
          
          // Clean the inputs
          const cleanFile = fileName.trim();
          const cleanDir = dirName.trimStart();
          const cleanExt = ext.trimEnd();
          
          return cleanDir + cleanFile + cleanExt;
        }
      `;
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const result = vm.execute(compileResult.bytecode);
      expect(result.status).toBe('complete');
      expect(result.returnValue).toBe("src/README.md.ts");
    });
  });
});