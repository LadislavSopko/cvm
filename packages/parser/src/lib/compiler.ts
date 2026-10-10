// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025-2026 Ladislav Sopko

import * as ts from 'typescript';
import { OpCode, Instruction } from './bytecode.js';
import { CompilerState } from './compiler-state.js';
import { statementVisitors, expressionVisitors, CompilerContext } from './compiler/index.js';
import { logger } from '@cvm/types';

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

const FORBIDDEN_CALLS = ['setTimeout', 'fetch', 'require', 'import'];

function syntaxErrors(source: string): CompilationError[] {
  const { diagnostics } = ts.transpileModule(source, {
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022 }
  });
  return (diagnostics ?? []).map(d => {
    const pos = d.file && d.start !== undefined
      ? d.file.getLineAndCharacterOfPosition(d.start)
      : { line: -1, character: -1 };
    return {
      message: ts.flattenDiagnosticMessageText(d.messageText, ' '),
      line: pos.line + 1,
      character: pos.character + 1
    };
  });
}

function programErrors(sourceFile: ts.SourceFile): CompilationError[] {
  const errors: CompilationError[] = [];
  const at = (node: ts.Node, message: string): void => {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    errors.push({ message, line: line + 1, character: character + 1 });
  };
  let mainFn: ts.FunctionDeclaration | undefined;
  const visit = (node: ts.Node): void => {
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'main') {
      mainFn = node;
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && FORBIDDEN_CALLS.includes(node.expression.text)) {
      at(node, `Unsupported function: ${node.expression.text}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  if (!mainFn) {
    errors.push({ message: 'Program must have a main() function', line: 0, character: 0 });
  } else if (mainFn.parameters.length > 0) {
    at(mainFn, 'main() must not have parameters');
  }
  return errors;
}

export function compile(source: string): CompileResult {
  logger.trace("Compilation starting", { sourceLength: source.length });
  const errors: CompilationError[] = [];

  const syntax = syntaxErrors(source);
  if (syntax.length > 0) {
    return { success: false, bytecode: [], errors: syntax };
  }

  const state = new CompilerState();
  const sourceFile = ts.createSourceFile('program.ts', source, ts.ScriptTarget.Latest, true);

  const programChecks = programErrors(sourceFile);
  if (programChecks.length > 0) {
    return { success: false, bytecode: [], errors: programChecks };
  }

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
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const nodeName = ts.SyntaxKind[node.kind];
    logger.debug("Compiling statement", { line: line + 1, kind: nodeName });
    
    const visitor = statementVisitors[node.kind];
    if (visitor) {
      logger.trace("Visiting statement", { kind: nodeName, pc: state.currentAddress() });
      visitor(node as any, state, context);
      logger.trace("Completed statement", { kind: nodeName, pc: state.currentAddress() });
    } else {
      // Report unsupported syntax instead of silently skipping
      errors.push({
        message: `Unsupported statement: ${ts.SyntaxKind[node.kind]}`,
        line: line + 1,
        character: character + 1
      });
      logger.debug("Unsupported statement", { kind: nodeName, line: line + 1 });
    }
  }

  function compileExpression(node: ts.Node): void {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const nodeName = ts.SyntaxKind[node.kind];
    logger.debug("Compiling expression", { line: line + 1, kind: nodeName });
    
    const visitor = expressionVisitors[node.kind];
    if (visitor) {
      logger.trace("Visiting expression", { kind: nodeName, pc: state.currentAddress() });
      visitor(node as any, state, context);
      logger.trace("Completed expression", { kind: nodeName, pc: state.currentAddress() });
    } else {
      // Report unsupported syntax instead of silently skipping
      errors.push({
        message: `Unsupported expression: ${ts.SyntaxKind[node.kind]}`,
        line: line + 1,
        character: character + 1
      });
      logger.debug("Unsupported expression", { kind: nodeName, line: line + 1 });
    }
  }

  // Find and compile main function
  sourceFile.forEachChild(node => {
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'main' && node.body) {
      logger.debug("Found main function", { statementCount: node.body.statements.length });
      node.body.statements.forEach((stmt, index) => {
        logger.trace("Compiling main statement", { 
          statementIndex: index + 1, 
          totalStatements: node.body!.statements.length 
        });
        try {
          compileStatement(stmt);
        } catch (e) {
          logger.debug("Error in statement", {
            statementIndex: index + 1,
            error: String(e)
          });
          const msg = e instanceof Error ? e.message : String(e);
          if (!errors.some(er => er.message === msg)) {
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(stmt.getStart());
            errors.push({ message: msg, line: line + 1, character: character + 1 });
          }
        }
      });
    }
  });

  state.emit(OpCode.HALT);

  const bytecode = state.getBytecode();
  logger.debug("Compilation completed", { 
    bytecodeLength: bytecode.length,
    contextStackValid: state.isValid(),
    unclosedContexts: state.getUnclosedContexts()
  });
  
  // Log any unpatched jump instructions
  const unpatchedJumps = bytecode.map((instr, idx) => ({ idx, instr }))
    .filter(({ instr }) => 
      (instr.op === OpCode.JUMP_IF_FALSE || instr.op === OpCode.JUMP || instr.op === OpCode.CONTINUE || instr.op === OpCode.BREAK) 
      && instr.arg === -1
    );
  
  if (unpatchedJumps.length > 0) {
    logger.debug("Found unpatched jump instructions", { unpatchedJumps });
    if (errors.length === 0) {
      errors.push({
        message: `Internal compiler error: unpatched jump at instruction ${unpatchedJumps[0].idx}`,
        line: 0,
        character: 0
      });
    }
  }

  return {
    success: errors.length === 0,
    bytecode,
    errors
  };
}