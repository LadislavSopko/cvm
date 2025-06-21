import * as ts from 'typescript';
import { OpCode } from '../../bytecode.js';
import { ExpressionVisitor } from '../visitor-types.js';

export const compileConditionalExpression: ExpressionVisitor<ts.ConditionalExpression> = (
  node,
  state,
  { compileExpression }
) => {
  // Ternary operator: condition ? whenTrue : whenFalse
  
  // Compile condition
  compileExpression(node.condition);
  
  // Emit jump to false branch (will patch address later)
  const jumpToFalseIndex = state.emit(OpCode.JUMP_IF_FALSE, -1);
  
  // True branch
  compileExpression(node.whenTrue);
  
  // Jump over false branch
  const jumpToEndIndex = state.emit(OpCode.JUMP, -1);
  
  // False branch starts here
  const falseBranchAddress = state.currentAddress();
  state.patchJump(jumpToFalseIndex, falseBranchAddress);
  
  compileExpression(node.whenFalse);
  
  // End of ternary
  const endAddress = state.currentAddress();
  state.patchJump(jumpToEndIndex, endAddress);
};