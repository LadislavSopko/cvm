import * as ts from 'typescript';
import { OpCode } from '../../bytecode.js';
import { StatementVisitor } from '../visitor-types.js';

export const compileBreakStatement: StatementVisitor<ts.BreakStatement> = (
  node,
  state,
  context
) => {
  // Find the nearest loop context
  const loopContext = state.findLoopContext();
  if (loopContext) {
    // For foreach loops, we need to clean up the iterator first
    if (loopContext.type === 'foreach') {
      state.emit(OpCode.ITER_END);
    }
    
    // Emit BREAK instruction
    const breakIndex = state.emit(OpCode.BREAK, -1);
    loopContext.breakTargets = loopContext.breakTargets || [];
    loopContext.breakTargets.push(breakIndex);
  } else {
    throw new Error('break statement not in loop');
  }
};