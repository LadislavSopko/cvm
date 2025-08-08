import * as ts from 'typescript';
import { OpCode } from '../../bytecode.js';
import { StatementVisitor } from '../visitor-types.js';
import { JumpContext } from '../../compiler-state.js';
import { logger } from '@cvm/types';

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
  
  // Track this instruction for debugging
  logger.trace(`FOR-OF: Created JUMP_IF_FALSE at index ${jumpIfFalseIndex} for var ${variableName}`);
  
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
  
  // Compile loop body with robust error handling
  let compilationError = null;
  try {
    compileStatement(node.statement);
  } catch (error) {
    logger.trace(`FOR-OF: Error compiling loop body for var ${variableName}: ${error}`);
    // Store error but don't re-throw immediately - clean up context first
    compilationError = error;
  }
  
  // Jump back to loop start (ITER_NEXT) - only if no compilation error
  if (!compilationError) {
    state.emit(OpCode.JUMP, loopStart);
  }
  
  // Pop context and patch jumps - ALWAYS do this even if compilation failed
  const context = state.popContext();
  if (context) {
    // Get end address BEFORE emitting ITER_END
    // This ensures JUMP_IF_FALSE points TO ITER_END, not AFTER it
    const endAddress = state.currentAddress();
    
    // Track patching process
    logger.trace(`FOR-OF: Patching breakTargets ${JSON.stringify(context.breakTargets)} to ${endAddress} for var ${variableName}`);
    
    // Clean up iterator state
    state.emit(OpCode.ITER_END);
    
    // Patch break targets (including JUMP_IF_FALSE) to jump to ITER_END
    state.patchJumps(context.breakTargets || [], endAddress);
    
    // Patch continue targets to jump back to ITER_NEXT
    state.patchJumps(context.continueTargets || [], loopStart);
  } else {
    // Track missing context
    logger.trace(`FOR-OF: NO CONTEXT TO PATCH for var ${variableName}!`);
  }
  
  // Re-throw compilation error AFTER context cleanup
  if (compilationError) {
    throw compilationError;
  }
};