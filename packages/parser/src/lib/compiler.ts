import * as ts from 'typescript';
import { OpCode, Instruction } from './bytecode.js';
import { parseProgram } from './parser.js';
import { CompilerState } from './compiler-state.js';

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

  const state = new CompilerState();
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
        state.emit(OpCode.PRINT);
      }
      // Handle CC() calls at statement level
      else if (ts.isCallExpression(expr) && 
               ts.isIdentifier(expr.expression) && 
               expr.expression.text === 'CC') {
        if (expr.arguments.length > 0) {
          compileExpression(expr.arguments[0]);
        }
        state.emit(OpCode.CC);
        state.emit(OpCode.POP); // Discard result if not used
      }
      // Handle array.push()
      else if (ts.isCallExpression(expr) && 
               ts.isPropertyAccessExpression(expr.expression) &&
               expr.expression.name.getText() === 'push') {
        // Load the array
        compileExpression(expr.expression.expression);
        // Compile the argument to push
        if (expr.arguments.length > 0) {
          compileExpression(expr.arguments[0]);
        }
        state.emit(OpCode.ARRAY_PUSH);
      }
    }
    else if (ts.isVariableStatement(node)) {
      const decl = node.declarationList.declarations[0];
      if (decl.initializer) {
        compileExpression(decl.initializer);
        state.emit(OpCode.STORE, decl.name.getText());
      }
    }
  }

  function compileExpression(node: ts.Node): void {
    if (ts.isStringLiteral(node)) {
      state.emit(OpCode.PUSH, node.text);
    }
    else if (ts.isNumericLiteral(node)) {
      state.emit(OpCode.PUSH, Number(node.text));
    }
    else if (node.kind === ts.SyntaxKind.TrueKeyword) {
      state.emit(OpCode.PUSH, true);
    }
    else if (node.kind === ts.SyntaxKind.FalseKeyword) {
      state.emit(OpCode.PUSH, false);
    }
    else if (node.kind === ts.SyntaxKind.NullKeyword) {
      state.emit(OpCode.PUSH, null);
    }
    else if (ts.isArrayLiteralExpression(node)) {
      // Create new array
      state.emit(OpCode.ARRAY_NEW);
      // Push each element and add to array
      node.elements.forEach(element => {
        compileExpression(element);
        state.emit(OpCode.ARRAY_PUSH);
      });
    }
    else if (ts.isElementAccessExpression(node)) {
      // Load array
      compileExpression(node.expression);
      // Load index
      if (node.argumentExpression) {
        compileExpression(node.argumentExpression);
      }
      state.emit(OpCode.ARRAY_GET);
    }
    else if (ts.isPropertyAccessExpression(node) && node.name.text === 'length') {
      // Handle array.length
      compileExpression(node.expression);
      state.emit(OpCode.ARRAY_LEN);
    }
    else if (ts.isIdentifier(node)) {
      state.emit(OpCode.LOAD, node.text);
    }
    else if (ts.isCallExpression(node)) {
      // Handle JSON.parse()
      if (ts.isPropertyAccessExpression(node.expression) &&
          ts.isIdentifier(node.expression.expression) &&
          node.expression.expression.text === 'JSON' &&
          node.expression.name.text === 'parse') {
        if (node.arguments.length > 0) {
          compileExpression(node.arguments[0]);
        }
        state.emit(OpCode.JSON_PARSE);
      }
      // Handle CC() calls
      else if (ts.isIdentifier(node.expression) && node.expression.text === 'CC') {
        if (node.arguments.length > 0) {
          compileExpression(node.arguments[0]);
        }
        state.emit(OpCode.CC);
      }
    }
    else if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      compileExpression(node.left);
      compileExpression(node.right);
      state.emit(OpCode.CONCAT);
    }
    else if (ts.isTypeOfExpression(node)) {
      compileExpression(node.expression);
      state.emit(OpCode.TYPEOF);
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

  state.emit(OpCode.HALT);

  return {
    success: true,
    bytecode: state.getBytecode(),
    errors: []
  };
}