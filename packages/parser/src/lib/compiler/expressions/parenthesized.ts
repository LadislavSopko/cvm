import * as ts from 'typescript';
import { ExpressionVisitor } from '../visitor-types.js';

export const compileParenthesizedExpression: ExpressionVisitor<ts.ParenthesizedExpression> = (
  node,
  state,
  { compileExpression }
) => {
  // Simply compile the inner expression
  compileExpression(node.expression);
};