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
    // Emit CONTINUE with placeholder that will be patched later
    // For for-loops: will be patched to jump to update expression
    // For while/for-of loops: will be patched to jump to loop start
    const continueIndex = state.emit(OpCode.CONTINUE, -1);
    loopContext.continueTargets = loopContext.continueTargets || [];
    loopContext.continueTargets.push(continueIndex);
  } else {
    context.reportError(node, 'continue statement not in loop');
  }
};