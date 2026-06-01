// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025-2026 Ladislav Sopko

import * as ts from 'typescript';
import { OpCode } from '../../bytecode.js';
import { ExpressionVisitor } from '../visitor-types.js';

export const compileTypeOfExpression: ExpressionVisitor<ts.TypeOfExpression> = (
  node,
  state,
  { compileExpression }
) => {
  // Compile the expression to check
  compileExpression(node.expression);
  // Then emit typeof opcode
  state.emit(OpCode.TYPEOF);
};