import * as ts from 'typescript';
import { OpCode } from '../../bytecode.js';
import { ExpressionVisitor } from '../visitor-types.js';

export const compileIdentifier: ExpressionVisitor<ts.Identifier> = (
  node,
  state,
  context
) => {
  if (node.text === 'undefined') {
    state.emit(OpCode.PUSH_UNDEFINED);
  } else {
    state.emit(OpCode.LOAD, node.text);
  }
};