import * as ts from 'typescript';
import { StatementVisitor } from '../visitor-types.js';
import { compileIfStatement } from './if-statement.js';
import { compileWhileStatement } from './while-statement.js';
import { compileForOfStatement } from './for-of-statement.js';
import { compileBlockStatement } from './block-statement.js';
import { compileVariableStatement } from './variable-statement.js';
import { compileExpressionStatement } from './expression-statement.js';
import { compileReturnStatement } from './return-statement.js';
import { compileBreakStatement } from './break-statement.js';
import { compileContinueStatement } from './continue-statement.js';

// Registry with all statement visitors
export const statementVisitors: Partial<Record<ts.SyntaxKind, StatementVisitor<any>>> = {
  [ts.SyntaxKind.IfStatement]: compileIfStatement,
  [ts.SyntaxKind.WhileStatement]: compileWhileStatement,
  [ts.SyntaxKind.ForOfStatement]: compileForOfStatement,
  [ts.SyntaxKind.Block]: compileBlockStatement,
  [ts.SyntaxKind.VariableStatement]: compileVariableStatement,
  [ts.SyntaxKind.ExpressionStatement]: compileExpressionStatement,
  [ts.SyntaxKind.ReturnStatement]: compileReturnStatement,
  [ts.SyntaxKind.BreakStatement]: compileBreakStatement,
  [ts.SyntaxKind.ContinueStatement]: compileContinueStatement,
};