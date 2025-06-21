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