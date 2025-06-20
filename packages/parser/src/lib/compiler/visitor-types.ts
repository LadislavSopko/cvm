import { CompilerState } from '../compiler-state.js';
import * as ts from 'typescript';

export type StatementVisitor<T extends ts.Statement = ts.Statement> = (
  node: T,
  state: CompilerState,
  context: CompilerContext
) => void;

export type ExpressionVisitor<T extends ts.Expression = ts.Expression> = (
  node: T,
  state: CompilerState,
  context: CompilerContext  
) => void;

export interface CompilerContext {
  compileStatement: (node: ts.Node) => void;
  compileExpression: (node: ts.Node) => void;
  reportError: (node: ts.Node, message: string) => never;
}

// Type-safe node type mapping
export interface NodeTypeMap {
  // Statements
  [ts.SyntaxKind.IfStatement]: ts.IfStatement;
  [ts.SyntaxKind.WhileStatement]: ts.WhileStatement;
  [ts.SyntaxKind.ForOfStatement]: ts.ForOfStatement;
  [ts.SyntaxKind.Block]: ts.Block;
  [ts.SyntaxKind.VariableStatement]: ts.VariableStatement;
  [ts.SyntaxKind.ExpressionStatement]: ts.ExpressionStatement;
  [ts.SyntaxKind.ReturnStatement]: ts.ReturnStatement;
  [ts.SyntaxKind.BreakStatement]: ts.BreakStatement;
  [ts.SyntaxKind.ContinueStatement]: ts.ContinueStatement;
  
  // Expressions
  [ts.SyntaxKind.StringLiteral]: ts.StringLiteral;
  [ts.SyntaxKind.NumericLiteral]: ts.NumericLiteral;
  [ts.SyntaxKind.Identifier]: ts.Identifier;
  [ts.SyntaxKind.ArrayLiteralExpression]: ts.ArrayLiteralExpression;
  [ts.SyntaxKind.BinaryExpression]: ts.BinaryExpression;
  [ts.SyntaxKind.PrefixUnaryExpression]: ts.PrefixUnaryExpression;
  [ts.SyntaxKind.PostfixUnaryExpression]: ts.PostfixUnaryExpression;
  [ts.SyntaxKind.CallExpression]: ts.CallExpression;
  [ts.SyntaxKind.PropertyAccessExpression]: ts.PropertyAccessExpression;
  [ts.SyntaxKind.ElementAccessExpression]: ts.ElementAccessExpression;
  [ts.SyntaxKind.ConditionalExpression]: ts.ConditionalExpression;
  [ts.SyntaxKind.TypeOfExpression]: ts.TypeOfExpression;
  [ts.SyntaxKind.ParenthesizedExpression]: ts.ParenthesizedExpression;
  
  // Keywords as expressions
  [ts.SyntaxKind.TrueKeyword]: ts.Node;
  [ts.SyntaxKind.FalseKeyword]: ts.Node;
  [ts.SyntaxKind.NullKeyword]: ts.Node;
}