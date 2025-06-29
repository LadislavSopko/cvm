import * as ts from 'typescript';
import { OpCode } from '../../bytecode.js';
import { ExpressionVisitor } from '../visitor-types.js';

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
      // Always emit ADD - let VM decide at runtime
      state.emit(OpCode.ADD);
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