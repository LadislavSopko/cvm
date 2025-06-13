import * as ts from 'typescript';
import { OpCode, Instruction } from './bytecode.js';
import { parseProgram } from './parser.js';

export interface CompileResult {
  success: boolean;
  bytecode: Instruction[];
  errors: string[];
}

export function compile(source: string): CompileResult {
  const parseResult = parseProgram(source);
  
  if (parseResult.errors.length > 0) {
    return {
      success: false,
      bytecode: [],
      errors: parseResult.errors
    };
  }

  const bytecode: Instruction[] = [];
  const sourceFile = ts.createSourceFile('program.ts', source, ts.ScriptTarget.Latest, true);
  
  // Simple compiler - just handle main() for now
  function compileStatement(node: ts.Node): void {
    if (ts.isExpressionStatement(node)) {
      const expr = node.expression;
      
      // Handle console.log()
      if (ts.isCallExpression(expr) && 
          ts.isPropertyAccessExpression(expr.expression) &&
          expr.expression.expression.getText() === 'console' &&
          expr.expression.name.getText() === 'log') {
        
        // Compile arguments
        expr.arguments.forEach(arg => {
          compileExpression(arg);
        });
        bytecode.push({ op: OpCode.PRINT });
      }
      // Handle CC() calls at statement level
      else if (ts.isCallExpression(expr) && 
               ts.isIdentifier(expr.expression) && 
               expr.expression.text === 'CC') {
        if (expr.arguments.length > 0) {
          compileExpression(expr.arguments[0]);
        }
        bytecode.push({ op: OpCode.CC });
        bytecode.push({ op: OpCode.POP }); // Discard result if not used
      }
    }
    else if (ts.isVariableStatement(node)) {
      const decl = node.declarationList.declarations[0];
      if (decl.initializer) {
        compileExpression(decl.initializer);
        bytecode.push({ op: OpCode.STORE, arg: decl.name.getText() });
      }
    }
  }

  function compileExpression(node: ts.Node): void {
    if (ts.isStringLiteral(node)) {
      bytecode.push({ op: OpCode.PUSH, arg: node.text });
    }
    else if (ts.isIdentifier(node)) {
      bytecode.push({ op: OpCode.LOAD, arg: node.text });
    }
    else if (ts.isCallExpression(node) && 
             ts.isIdentifier(node.expression) && 
             node.expression.text === 'CC') {
      if (node.arguments.length > 0) {
        compileExpression(node.arguments[0]);
      }
      bytecode.push({ op: OpCode.CC });
    }
    else if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      compileExpression(node.left);
      compileExpression(node.right);
      bytecode.push({ op: OpCode.CONCAT });
    }
  }

  // Find and compile main function
  sourceFile.forEachChild(node => {
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'main' && node.body) {
      node.body.statements.forEach(stmt => {
        compileStatement(stmt);
      });
    }
  });

  bytecode.push({ op: OpCode.HALT });

  return {
    success: true,
    bytecode,
    errors: []
  };
}