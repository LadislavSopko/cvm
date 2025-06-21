import * as ts from 'typescript';
import { OpCode } from '../../bytecode.js';
import { StatementVisitor } from '../visitor-types.js';
import { JumpContext } from '../../compiler-state.js';

export const compileWhileStatement: StatementVisitor<ts.WhileStatement> = (
  node,
  state,
  { compileExpression, compileStatement }
) => {
  // Record loop start position
  const loopStart = state.currentAddress();
  
  // Compile condition
  compileExpression(node.expression);
  
  // Emit JUMP_IF_FALSE with placeholder (will be patched to loop end)
  const jumpIfFalseIndex = state.emit(OpCode.JUMP_IF_FALSE, -1);
  
  // Push loop context
  const loopContext: JumpContext = {
    type: 'loop',
    breakTargets: [jumpIfFalseIndex],
    continueTargets: [],
    endTargets: [],
    startAddress: loopStart
  };
  state.pushContext(loopContext);
  
  // Compile loop body
  compileStatement(node.statement);
  
  // Jump back to loop start
  state.emit(OpCode.JUMP, loopStart);
  
  // Pop context and patch all jumps
  const context = state.popContext();
  if (context) {
    const endAddress = state.currentAddress();
    
    // Patch all break targets to jump to end
    state.patchJumps(context.breakTargets || [], endAddress);
    
    // Continue targets would jump to loopStart, but we don't need to patch
    // them because continue statements directly emit JUMP to startAddress
  }
};