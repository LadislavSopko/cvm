import * as ts from 'typescript';
import { OpCode, Instruction } from './bytecode.js';
import { parseProgram } from './parser.js';
import { CompilerState } from './compiler-state.js';
import { statementVisitors, expressionVisitors, CompilerContext } from './compiler/index.js';

export interface CompilationError {
  message: string;
  line: number;
  character: number;
}

export interface CompileResult {
  success: boolean;
  bytecode: Instruction[];
  errors: CompilationError[];
}

export function compile(source: string): CompileResult {
  console.log("DEBUGGING: compile() function called with source length:", source.length);
  const errors: CompilationError[] = [];
  const parseResult = parseProgram(source);
  
  if (parseResult.errors.length > 0) {
    // Convert string errors to CompilationError format
    // For parse errors, we don't have line/char info, so use 0
    return {
      success: false,
      bytecode: [],
      errors: parseResult.errors.map(err => ({
        message: err,
        line: 0,
        character: 0
      }))
    };
  }

  const state = new CompilerState();
  const sourceFile = ts.createSourceFile('program.ts', source, ts.ScriptTarget.Latest, true);
  
  // Create compiler context for visitor pattern
  const context: CompilerContext = {
    compileStatement,
    compileExpression,
    reportError: (node: ts.Node, message: string): never => {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      errors.push({
        message,
        line: line + 1, // TypeScript uses 0-based lines
        character: character + 1 // TypeScript uses 0-based columns
      });
      throw new Error(message); // Still throw to maintain control flow
    }
  };
  
  function compileStatement(node: ts.Node): void {
    const visitor = statementVisitors[node.kind];
    if (visitor) {
      visitor(node as any, state, context);
    } else {
      // Report unsupported syntax instead of silently skipping
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      errors.push({
        message: `Unsupported statement: ${ts.SyntaxKind[node.kind]}`,
        line: line + 1,
        character: character + 1
      });
    }
  }

  function compileExpression(node: ts.Node): void {
    const visitor = expressionVisitors[node.kind];
    if (visitor) {
      visitor(node as any, state, context);
    } else {
      // Report unsupported syntax instead of silently skipping
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      errors.push({
        message: `Unsupported expression: ${ts.SyntaxKind[node.kind]}`,
        line: line + 1,
        character: character + 1
      });
    }
  }

  // Find and compile main function
  sourceFile.forEachChild(node => {
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'main' && node.body) {
      node.body.statements.forEach(stmt => {
        try {
          compileStatement(stmt);
        } catch (e) {
          // Error already added to errors array by reportError
          // Continue processing other statements
        }
      });
    }
  });

  state.emit(OpCode.HALT);

  return {
    success: errors.length === 0,
    bytecode: state.getBytecode(),
    errors
  };
}