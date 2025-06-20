import * as ts from 'typescript';
import { StatementVisitor } from '../visitor-types.js';

// Empty registry for now - will be populated as we extract visitors
export const statementVisitors: Partial<Record<ts.SyntaxKind, StatementVisitor>> = {
  // Will be populated with:
  // [ts.SyntaxKind.IfStatement]: compileIfStatement,
  // [ts.SyntaxKind.WhileStatement]: compileWhileStatement,
  // [ts.SyntaxKind.ForOfStatement]: compileForOfStatement,
  // [ts.SyntaxKind.Block]: compileBlockStatement,
  // [ts.SyntaxKind.VariableStatement]: compileVariableStatement,
  // [ts.SyntaxKind.ExpressionStatement]: compileExpressionStatement,
  // [ts.SyntaxKind.ReturnStatement]: compileReturnStatement,
  // [ts.SyntaxKind.BreakStatement]: compileBreakStatement,
  // [ts.SyntaxKind.ContinueStatement]: compileContinueStatement,
};