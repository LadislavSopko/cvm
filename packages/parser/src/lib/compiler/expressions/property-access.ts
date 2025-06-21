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
    // Other property accesses are not yet implemented in CVM
    // This would require object support and a PROPERTY_GET opcode
    // For now, silently ignore to match original compiler behavior
    // TODO: Add proper object property support when PROPERTY_GET opcode is implemented
  }
};