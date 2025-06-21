import * as ts from 'typescript';
import { OpCode } from '../../bytecode.js';
import { ExpressionVisitor } from '../visitor-types.js';

export const compileElementAccessExpression: ExpressionVisitor<ts.ElementAccessExpression> = (
  node,
  state,
  { compileExpression }
) => {
  // Load array
  compileExpression(node.expression);
  // Load index
  if (node.argumentExpression) {
    compileExpression(node.argumentExpression);
  }
  state.emit(OpCode.ARRAY_GET);
};