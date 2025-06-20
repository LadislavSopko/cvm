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