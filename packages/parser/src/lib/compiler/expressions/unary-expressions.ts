import * as ts from 'typescript';
import { OpCode } from '../../bytecode.js';
import { ExpressionVisitor } from '../visitor-types.js';

export const compilePrefixUnaryExpression: ExpressionVisitor<ts.PrefixUnaryExpression> = (
  node,
  state,
  { compileExpression }
) => {
  // Handle unary operators like !, -, +, ++, --
  switch (node.operator) {
    case ts.SyntaxKind.ExclamationToken:
      // Compile the operand first
      compileExpression(node.operand);
      // Then apply NOT
      state.emit(OpCode.NOT);
      break;
    case ts.SyntaxKind.MinusToken:
      // Unary minus
      compileExpression(node.operand);
      state.emit(OpCode.UNARY_MINUS);
      break;
    case ts.SyntaxKind.PlusToken:
      // Unary plus
      compileExpression(node.operand);
      state.emit(OpCode.UNARY_PLUS);
      break;
    case ts.SyntaxKind.PlusPlusToken:
      // Pre-increment: ++x
      if (ts.isIdentifier(node.operand)) {
        state.emit(OpCode.PUSH, node.operand.text);
        state.emit(OpCode.INC, false); // false = pre-increment
      }
      break;
    case ts.SyntaxKind.MinusMinusToken:
      // Pre-decrement: --x
      if (ts.isIdentifier(node.operand)) {
        state.emit(OpCode.PUSH, node.operand.text);
        state.emit(OpCode.DEC, false); // false = pre-decrement
      }
      break;
    default:
      // Other unary operators not yet implemented
      break;
  }
};

export const compilePostfixUnaryExpression: ExpressionVisitor<ts.PostfixUnaryExpression> = (
  node,
  state,
  { compileExpression }
) => {
  // Handle post-increment and post-decrement: x++, x--
  switch (node.operator) {
    case ts.SyntaxKind.PlusPlusToken:
      // Post-increment: x++
      if (ts.isIdentifier(node.operand)) {
        state.emit(OpCode.PUSH, node.operand.text);
        state.emit(OpCode.INC, true); // true = post-increment
      }
      break;
    case ts.SyntaxKind.MinusMinusToken:
      // Post-decrement: x--
      if (ts.isIdentifier(node.operand)) {
        state.emit(OpCode.PUSH, node.operand.text);
        state.emit(OpCode.DEC, true); // true = post-decrement
      }
      break;
    default:
      // Other postfix operators not yet implemented
      break;
  }
};