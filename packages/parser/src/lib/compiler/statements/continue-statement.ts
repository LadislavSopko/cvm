import * as ts from 'typescript';
import { OpCode } from '../../bytecode.js';
import { StatementVisitor } from '../visitor-types.js';

export const compileContinueStatement: StatementVisitor<ts.ContinueStatement> = (
  node,
  state,
  context
) => {
  // Find the nearest loop context
  const loopContext = state.findLoopContext();
  if (loopContext && loopContext.startAddress !== undefined) {
    // For foreach loops, jump back to ITER_NEXT
    // For regular loops, jump back to loop start
    const continueIndex = state.emit(OpCode.CONTINUE, loopContext.startAddress);
    loopContext.continueTargets = loopContext.continueTargets || [];
    loopContext.continueTargets.push(continueIndex);
  } else {
    throw new Error('continue statement not in loop');
  }
};