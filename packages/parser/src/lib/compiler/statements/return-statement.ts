// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025-2026 Ladislav Sopko

import * as ts from 'typescript';
import { OpCode } from '../../bytecode.js';
import { StatementVisitor } from '../visitor-types.js';

export const compileReturnStatement: StatementVisitor<ts.ReturnStatement> = (
  node,
  state,
  { compileExpression }
) => {
  if (node.expression) {
    // Return with value: compile expression (result goes on stack)
    compileExpression(node.expression);
  } else {
    // Return without value: push null
    state.emit(OpCode.PUSH, null);
  }
  state.emit(OpCode.RETURN);
};