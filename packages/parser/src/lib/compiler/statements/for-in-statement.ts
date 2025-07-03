import * as ts from 'typescript';
import { OpCode } from '../../bytecode.js';
import { StatementVisitor } from '../visitor-types.js';
import { JumpContext } from '../../compiler-state.js';

export const compileForInStatement: StatementVisitor<ts.ForInStatement> = (
  node,
  state,
  { compileExpression, compileStatement }
) => {
  // Extract variable name and object
  const variable = node.initializer;
  const object = node.expression;
  
  let variableName: string;
  
  // Handle both const/let declarations and simple identifiers
  if (ts.isVariableDeclarationList(variable)) {
    const decl = variable.declarations[0];
    variableName = decl.name.getText();
  } else if (ts.isIdentifier(variable)) {
    variableName = variable.text;
  } else {
    throw new Error('Unsupported for-in variable declaration');
  }
  
  // Compile the object (object to iterate over)
  compileExpression(object);
  
  // Start object iteration: OBJECT_ITER_START will setup iterator state
  state.emit(OpCode.OBJECT_ITER_START);
  
  // Record loop start position (after OBJECT_ITER_START)
  const loopStart = state.currentAddress();
  
  // Check if iteration should continue
  state.emit(OpCode.OBJECT_ITER_NEXT);
  
  // OBJECT_ITER_NEXT pushes two values: key and hasMore
  // We need to check hasMore (top of stack) to decide if we continue
  const jumpIfFalseIndex = state.emit(OpCode.JUMP_IF_FALSE, -1);
  
  // Store the current key in the loop variable
  state.emit(OpCode.STORE, variableName);
  
  // Push foreach context
  const foreachContext: JumpContext = {
    type: 'foreach',
    breakTargets: [jumpIfFalseIndex],
    continueTargets: [],
    endTargets: [],
    startAddress: loopStart,
    iterVariable: variableName
  };
  state.pushContext(foreachContext);
  
  // Compile loop body
  compileStatement(node.statement);
  
  // Jump back to loop start (OBJECT_ITER_NEXT)
  state.emit(OpCode.JUMP, loopStart);
  
  // Pop context and patch break jumps
  const context = state.popContext();
  if (context) {
    const endAddress = state.currentAddress();
    state.patchJumps(context.breakTargets || [], endAddress);
    
    // Clean up iterator state
    state.emit(OpCode.ITER_END);
  }
};