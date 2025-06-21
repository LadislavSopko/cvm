import * as ts from 'typescript';
import { OpCode } from '../../bytecode.js';
import { StatementVisitor } from '../visitor-types.js';
import { JumpContext } from '../../compiler-state.js';

export const compileIfStatement: StatementVisitor<ts.IfStatement> = (
  node,
  state,
  { compileExpression, compileStatement }
) => {
  // Compile condition
  compileExpression(node.expression);
  
  // Emit JUMP_IF_FALSE with placeholder address
  const jumpIfFalseIndex = state.emit(OpCode.JUMP_IF_FALSE, -1);
  
  // Push if context
  const ifContext: JumpContext = {
    type: 'if',
    endTargets: []
  };
  
  // Check if there's an else block
  if (node.elseStatement) {
    ifContext.elseTarget = jumpIfFalseIndex;
  } else {
    ifContext.endTargets.push(jumpIfFalseIndex);
  }
  
  state.pushContext(ifContext);
  
  // Compile then statement
  compileStatement(node.thenStatement);
  
  // Handle else block if present
  if (node.elseStatement) {
    // Emit JUMP to skip else block
    const jumpIndex = state.emit(OpCode.JUMP, -1);
    ifContext.endTargets.push(jumpIndex);
    
    // Patch JUMP_IF_FALSE to jump to else block
    const elseAddress = state.currentAddress();
    state.patchJump(jumpIfFalseIndex, elseAddress);
    
    // Compile else statement
    compileStatement(node.elseStatement);
  }
  
  // Pop context and patch all end jumps
  const context = state.popContext();
  if (context) {
    const endAddress = state.currentAddress();
    state.patchJumps(context.endTargets, endAddress);
  }
};