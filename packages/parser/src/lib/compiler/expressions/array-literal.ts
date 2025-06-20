import * as ts from 'typescript';
import { OpCode } from '../../bytecode.js';
import { ExpressionVisitor } from '../visitor-types.js';

export const compileArrayLiteral: ExpressionVisitor<ts.ArrayLiteralExpression> = (
  node,
  state,
  { compileExpression }
) => {
  // Create new array
  state.emit(OpCode.ARRAY_NEW);
  // Push each element and add to array
  node.elements.forEach(element => {
    compileExpression(element);
    state.emit(OpCode.ARRAY_PUSH);
  });
};