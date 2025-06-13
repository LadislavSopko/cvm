import * as ts from 'typescript';
import { OpCode, Instruction } from './bytecode.js';

export type CompileError = string;

export interface ParseResult {
  bytecode: Instruction[];
  errors: CompileError[];
  hasMain: boolean;
}

export function parseProgram(source: string): ParseResult {
  const errors: CompileError[] = [];
  const bytecode: Instruction[] = [];
  let hasMain = false;
  let mainCalled = false;

  // Create TypeScript source file
  const sourceFile = ts.createSourceFile(
    'program.ts',
    source,
    ts.ScriptTarget.Latest,
    true
  );

  // We'll just check for basic syntax errors by looking at the parse tree
  // TypeScript's createSourceFile will parse even with errors, so we can still walk the AST

  // Walk the AST to validate CVM rules and generate bytecode
  function visit(node: ts.Node): void {
    // Check for function declarations
    if (ts.isFunctionDeclaration(node) && node.name) {
      const funcName = node.name.text;
      if (funcName === 'main') {
        hasMain = true;
        // Validate main signature
        if (node.parameters.length > 0) {
          errors.push('main() must not have parameters');
        }
        // For now, just mark that we have main
      }
    }

    // Check for function calls at top level
    if (ts.isExpressionStatement(node) && node.parent === sourceFile) {
      const expr = node.expression;
      if (ts.isCallExpression(expr) && ts.isIdentifier(expr.expression) && expr.expression.text === 'main') {
        mainCalled = true;
      }
    }

    // Check for unsupported function calls
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const funcName = node.expression.text;
      const unsupported = ['setTimeout', 'fetch', 'require', 'import'];
      if (unsupported.includes(funcName)) {
        errors.push(`Unsupported function: ${funcName}`);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  // Validate CVM requirements
  if (!hasMain) {
    errors.push('Program must have a main() function');
  }
  if (hasMain && !mainCalled) {
    errors.push('main() must be called at the top level');
  }

  // If no errors, generate simple bytecode (placeholder for now)
  if (errors.length === 0) {
    bytecode.push({ op: OpCode.HALT });
  }

  return {
    bytecode,
    errors,
    hasMain
  };
}