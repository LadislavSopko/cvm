import * as ts from 'typescript';
import { OpCode } from '../../bytecode.js';
import { ExpressionVisitor } from '../visitor-types.js';

// Helper to check if either operand contains a string literal
function hasStringOperand(left: ts.Node, right: ts.Node): boolean {
  // Check if either operand is a string literal
  if (ts.isStringLiteral(left) || ts.isStringLiteral(right)) {
    return true;
  }
  
  // For binary expressions with +, check recursively
  if (ts.isBinaryExpression(left) && left.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    if (hasStringOperand(left.left, left.right)) return true;
  }
  if (ts.isBinaryExpression(right) && right.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    if (hasStringOperand(right.left, right.right)) return true;
  }
  
  return false;
}

export const compileBinaryExpression: ExpressionVisitor<ts.BinaryExpression> = (
  node,
  state,
  { compileExpression }
) => {
  const operator = node.operatorToken.kind;
  
  // Compile left and right operands
  compileExpression(node.left);
  compileExpression(node.right);
  
  // Emit appropriate opcode based on operator
  switch (operator) {
    case ts.SyntaxKind.PlusToken:
      // Determine if this is numeric addition or string concatenation
      if (hasStringOperand(node.left, node.right)) {
        // If either operand is a string literal, always use CONCAT
        state.emit(OpCode.CONCAT);
      } else {
        // For all other cases, use ADD
        // The VM will handle type conversion with cvmToNumber
        state.emit(OpCode.ADD);
      }
      break;
    case ts.SyntaxKind.MinusToken:
      state.emit(OpCode.SUB);
      break;
    case ts.SyntaxKind.AsteriskToken:
      state.emit(OpCode.MUL);
      break;
    case ts.SyntaxKind.SlashToken:
      state.emit(OpCode.DIV);
      break;
    case ts.SyntaxKind.PercentToken:
      state.emit(OpCode.MOD);
      break;
    case ts.SyntaxKind.EqualsEqualsToken:
      state.emit(OpCode.EQ);
      break;
    case ts.SyntaxKind.ExclamationEqualsToken:
      state.emit(OpCode.NEQ);
      break;
    case ts.SyntaxKind.LessThanToken:
      state.emit(OpCode.LT);
      break;
    case ts.SyntaxKind.GreaterThanToken:
      state.emit(OpCode.GT);
      break;
    case ts.SyntaxKind.LessThanEqualsToken:
      state.emit(OpCode.LTE);
      break;
    case ts.SyntaxKind.GreaterThanEqualsToken:
      state.emit(OpCode.GTE);
      break;
    case ts.SyntaxKind.EqualsEqualsEqualsToken:
      state.emit(OpCode.EQ_STRICT);
      break;
    case ts.SyntaxKind.ExclamationEqualsEqualsToken:
      state.emit(OpCode.NEQ_STRICT);
      break;
    case ts.SyntaxKind.AmpersandAmpersandToken:
      state.emit(OpCode.AND);
      break;
    case ts.SyntaxKind.BarBarToken:
      state.emit(OpCode.OR);
      break;
    default:
      // Other binary operators not yet implemented
      break;
  }
};