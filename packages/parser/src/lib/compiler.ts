import * as ts from 'typescript';
import { OpCode, Instruction } from './bytecode.js';
import { parseProgram } from './parser.js';
import { CompilerState } from './compiler-state.js';
import { statementVisitors, expressionVisitors, CompilerContext } from './compiler/index.js';

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
  
  // Create compiler context for visitor pattern
  const context: CompilerContext = {
    compileStatement,
    compileExpression,
    reportError: (node: ts.Node, message: string): never => {
      throw new Error(message);
    }
  };
  
  function compileStatement(node: ts.Node): void {
    const visitor = statementVisitors[node.kind];
    if (visitor) {
      visitor(node as any, state, context);
    } else {
      // Unsupported statement type - silently skip
      // This matches the original compiler behavior
    }
  }

  function compileExpression(node: ts.Node): void {
    const visitor = expressionVisitors[node.kind];
    if (visitor) {
      visitor(node as any, state, context);
    } else {
      // Unsupported expression type - silently skip
      // This matches the original compiler behavior
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