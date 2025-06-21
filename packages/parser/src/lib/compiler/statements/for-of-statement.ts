import * as ts from 'typescript';
import { OpCode } from '../../bytecode.js';
import { StatementVisitor } from '../visitor-types.js';
import { JumpContext } from '../../compiler-state.js';

export const compileForOfStatement: StatementVisitor<ts.ForOfStatement> = (
  node,
  state,
  { compileExpression, compileStatement }
) => {
  // Extract variable name and iterable
  const variable = node.initializer;
  const iterable = node.expression;
  
  let variableName: string;
  
  // Handle both const/let declarations and simple identifiers
  if (ts.isVariableDeclarationList(variable)) {
    const decl = variable.declarations[0];
    variableName = decl.name.getText();
  } else if (ts.isIdentifier(variable)) {
    variableName = variable.text;
  } else {
    throw new Error('Unsupported for-of variable declaration');
  }
  
  // Compile the iterable (array to iterate over)
  compileExpression(iterable);
  
  // Start iteration: ITER_START will setup iterator state
  state.emit(OpCode.ITER_START);
  
  // Record loop start position (after ITER_START)
  const loopStart = state.currentAddress();
  
  // Check if iteration should continue
  state.emit(OpCode.ITER_NEXT);
  
  // ITER_NEXT pushes two values: element and hasMore
  // We need to check hasMore (top of stack) to decide if we continue
  const jumpIfFalseIndex = state.emit(OpCode.JUMP_IF_FALSE, -1);
  
  // Store the current element in the loop variable
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
  
  // Jump back to loop start (ITER_NEXT)
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