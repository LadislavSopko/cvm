import { describe, it, expect } from 'vitest';
import * as ts from 'typescript';

describe('Parser RegExp Support', () => {
  it('should parse regex literal into AST', () => {
    const source = 'var pattern = /test/gi;';
    
    // Create TypeScript source file (this is what CVM uses internally)
    const sourceFile = ts.createSourceFile(
      'test.ts',
      source,
      ts.ScriptTarget.Latest,
      true
    );
    
    // Walk AST to find regex literal node
    let regexNode: ts.RegularExpressionLiteral | undefined;
    
    function visit(node: ts.Node) {
      // TypeScript's type guard for regex literals
      if (ts.isRegularExpressionLiteral && ts.isRegularExpressionLiteral(node)) {
        regexNode = node;
      }
      ts.forEachChild(node, visit);
    }
    
    visit(sourceFile);
    
    // Verify we found the regex node
    expect(regexNode).toBeDefined();
    expect(regexNode!.text).toBe('/test/gi'); // Full text including delimiters
  });

  it('should handle various regex patterns', () => {
    const testCases = [
      { pattern: '/hello/', expected: '/hello/' },
      { pattern: '/test/gi', expected: '/test/gi' },
      { pattern: '/\\w+@\\w+\\.\\w+/', expected: '/\\w+@\\w+\\.\\w+/' },
      { pattern: '/\\d+/g', expected: '/\\d+/g' }
    ];
    
    testCases.forEach(({ pattern, expected }) => {
      const source = `var re = ${pattern};`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      
      let regexNode: ts.RegularExpressionLiteral | undefined;
      function visit(node: ts.Node) {
        if (ts.isRegularExpressionLiteral && ts.isRegularExpressionLiteral(node)) {
          regexNode = node;
        }
        ts.forEachChild(node, visit);
      }
      
      visit(sourceFile);
      expect(regexNode).toBeDefined();
      expect(regexNode!.text).toBe(expected);
    });
  });

  it('should extract pattern and flags correctly', () => {
    const source = 'var pattern = /hello\\w+/gim;';
    const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
    
    let regexNode: ts.RegularExpressionLiteral | undefined;
    function visit(node: ts.Node) {
      if (ts.isRegularExpressionLiteral && ts.isRegularExpressionLiteral(node)) {
        regexNode = node;
      }
      ts.forEachChild(node, visit);
    }
    
    visit(sourceFile);
    
    expect(regexNode).toBeDefined();
    const text = regexNode!.text; // '/hello\\w+/gim'
    
    // Extract pattern and flags (this is what the compiler will do)
    const lastSlash = text.lastIndexOf('/');
    const pattern = text.substring(1, lastSlash); // 'hello\\w+'
    const flags = text.substring(lastSlash + 1); // 'gim'
    
    expect(pattern).toBe('hello\\w+');
    expect(flags).toBe('gim');
  });
});