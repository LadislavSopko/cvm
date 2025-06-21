import * as ts from 'typescript';
import { OpCode } from '../../bytecode.js';
import { ExpressionVisitor } from '../visitor-types.js';

export const compilePropertyAccessExpression: ExpressionVisitor<ts.PropertyAccessExpression> = (
  node,
  state,
  { compileExpression }
) => {
  // Special handling for .length property
  if (node.name.text === 'length') {
    // Handle .length for both arrays and strings
    compileExpression(node.expression);
    state.emit(OpCode.LENGTH);
  } else {
    // General property access using PROPERTY_GET
    compileExpression(node.expression); // Push object onto stack
    state.emit(OpCode.PUSH, node.name.text); // Push property name
    state.emit(OpCode.PROPERTY_GET);
  }
};