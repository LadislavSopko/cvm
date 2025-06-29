import * as ts from 'typescript';
import { OpCode } from '../../bytecode.js';
import { ExpressionVisitor } from '../visitor-types.js';

export const compileElementAccessExpression: ExpressionVisitor<ts.ElementAccessExpression> = (
  node,
  state,
  { compileExpression, reportError }
) => {
  // Load the target (array or object)
  compileExpression(node.expression);
  
  // Load the index/key
  if (node.argumentExpression) {
    compileExpression(node.argumentExpression);
  } else {
    reportError(node, 'Element access requires an index expression');
  }
  
  // For now, we'll try ARRAY_GET first since we can't know the type at compile time
  // The VM could be enhanced to handle this more elegantly with a unified GET opcode
  // that works for both arrays and objects
  state.emit(OpCode.ARRAY_GET);
  
  // Note: Unified GET opcode is now available for cleaner element access semantics
};