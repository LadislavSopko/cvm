// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025-2026 Ladislav Sopko

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
    // Foreach loops: BREAK lands on the loop's own ITER_END, which releases the iterator once
    // Emit BREAK instruction
    const breakIndex = state.emit(OpCode.BREAK, -1);
    loopContext.breakTargets = loopContext.breakTargets || [];
    loopContext.breakTargets.push(breakIndex);
  } else {
    context.reportError(node, 'break statement not in loop');
  }
};