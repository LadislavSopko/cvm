import { describe, it, expect } from 'vitest';
import { parseProgram } from './parser.js';

describe('parser', () => {
  describe('parseProgram', () => {
    it('should parse minimal program with main', () => {
      const source = `
        function main(): void {
          console.log("Hello World");
        }
        main();
      `;
      
      const result = parseProgram(source);
      
      expect(result.errors).toHaveLength(0);
      expect(result.bytecode).toBeDefined();
      expect(result.hasMain).toBe(true);
    });

    it('should parse program with CC call', () => {
      const source = `
        function main(): void {
          const answer = CC("What is 2+2?");
          console.log(answer);
        }
        main();
      `;
      
      const result = parseProgram(source);
      
      expect(result.errors).toHaveLength(0);
      expect(result.bytecode).toBeDefined();
    });

    it('should parse program with multiple functions', () => {
      const source = `
        function greet(name: string): string {
          return CC("Say hello to " + name);
        }
        
        function main(): void {
          const greeting = greet("World");
          console.log(greeting);
        }
        main();
      `;
      
      const result = parseProgram(source);
      
      expect(result.errors).toHaveLength(0);
      expect(result.bytecode).toBeDefined();
    });

    it('should error if no main function', () => {
      const source = `
        function other(): void {
          console.log("No main");
        }
        other();
      `;
      
      const result = parseProgram(source);
      
      expect(result.errors).toContain('Program must have a main() function');
      expect(result.hasMain).toBe(false);
    });

    it('should error if main not called', () => {
      const source = `
        function main(): void {
          console.log("Main not called");
        }
      `;
      
      const result = parseProgram(source);
      
      expect(result.errors).toContain('main() must be called at the top level');
    });

    it('should error on unsupported features', () => {
      const source = `
        function main(): void {
          // These should error:
          setTimeout(() => {}, 1000);
          fetch("http://example.com");
        }
        main();
      `;
      
      const result = parseProgram(source);
      
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('setTimeout'))).toBe(true);
      expect(result.errors.some(e => e.includes('fetch'))).toBe(true);
    });
  });
});