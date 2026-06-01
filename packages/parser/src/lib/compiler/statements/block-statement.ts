// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025-2026 Ladislav Sopko

import * as ts from 'typescript';
import { StatementVisitor } from '../visitor-types.js';

export const compileBlockStatement: StatementVisitor<ts.Block> = (
  node,
  state,
  { compileStatement }
) => {
  node.statements.forEach(stmt => {
    compileStatement(stmt);
  });
};