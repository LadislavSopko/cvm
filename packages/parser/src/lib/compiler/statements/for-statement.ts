import * as ts from 'typescript';
import { OpCode } from '../../bytecode.js';
import { StatementVisitor } from '../visitor-types.js';
import { JumpContext } from '../../compiler-state.js';

export const compileForStatement: StatementVisitor<ts.ForStatement> = (
  node,
  state,
  { compileExpression, compileStatement }
) => {
  // 1. Compile init
  if (node.initializer) {
    if (ts.isVariableDeclarationList(node.initializer)) {
      // Handle variable declaration list
      for (const declaration of node.initializer.declarations) {
        if (declaration.initializer) {
          compileExpression(declaration.initializer);
          state.emit(OpCode.STORE, declaration.name.getText());
        }
      }
    } else {
      compileExpression(node.initializer);
      state.emit(OpCode.POP); // Discard init expression result
    }
  }
  
  // 2. Mark loop start
  const loopStart = state.currentAddress();
  
  // 3. Compile test condition
  let jumpIfFalseIndex: number | undefined;
  if (node.condition) {
    compileExpression(node.condition);
    jumpIfFalseIndex = state.emit(OpCode.JUMP_IF_FALSE, -1); // Will patch later
  }
  
  // 4. Set up loop context
  const loopContext: JumpContext = {
    type: 'loop',
    breakTargets: jumpIfFalseIndex ? [jumpIfFalseIndex] : [],
    continueTargets: [],
    endTargets: [],
    startAddress: loopStart
  };
  state.pushContext(loopContext);
  
  // 5. Compile body
  compileStatement(node.statement);
  
  // 6. Compile update
  if (node.incrementor) {
    compileExpression(node.incrementor);
    state.emit(OpCode.POP); // Discard update expression result
  }
  
  // 7. Jump back to start
  state.emit(OpCode.JUMP, loopStart);
  
  // 8. Pop context and patch jumps
  const context = state.popContext();
  if (context) {
    const endAddress = state.currentAddress();
    
    // Patch all break targets to jump to end
    state.patchJumps(context.breakTargets || [], endAddress);
  }
};