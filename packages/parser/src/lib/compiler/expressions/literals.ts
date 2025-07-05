import * as ts from 'typescript';
import { OpCode } from '../../bytecode.js';
import { ExpressionVisitor } from '../visitor-types.js';

export const compileStringLiteral: ExpressionVisitor<ts.StringLiteral> = (
  node,
  state,
  context
) => {
  state.emit(OpCode.PUSH, node.text);
};

export const compileNumericLiteral: ExpressionVisitor<ts.NumericLiteral> = (
  node,
  state,
  context
) => {
  state.emit(OpCode.PUSH, Number(node.text));
};

export const compileTrue: ExpressionVisitor = (
  node,
  state,
  context
) => {
  state.emit(OpCode.PUSH, true);
};

export const compileFalse: ExpressionVisitor = (
  node,
  state,
  context
) => {
  state.emit(OpCode.PUSH, false);
};

export const compileNull: ExpressionVisitor = (
  node,
  state,
  context
) => {
  state.emit(OpCode.PUSH, null);
};

export const compileRegularExpressionLiteral: ExpressionVisitor<ts.RegularExpressionLiteral> = (
  node,
  state,
  context
) => {
  // Extract pattern and flags from regex literal text
  const text = node.text; // e.g., "/hello/gi"
  const lastSlash = text.lastIndexOf('/');
  const pattern = text.substring(1, lastSlash); // "hello"
  const flags = text.substring(lastSlash + 1); // "gi"
  
  state.emit(OpCode.LOAD_REGEX, { pattern, flags });
};