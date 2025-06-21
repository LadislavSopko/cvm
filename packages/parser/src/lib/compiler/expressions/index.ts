import * as ts from 'typescript';
import { ExpressionVisitor } from '../visitor-types.js';
import { 
  compileStringLiteral, 
  compileNumericLiteral, 
  compileTrue, 
  compileFalse, 
  compileNull 
} from './literals.js';
import { compileIdentifier } from './identifier.js';
import { compileArrayLiteral } from './array-literal.js';
import { compileParenthesizedExpression } from './parenthesized.js';
import { compilePropertyAccessExpression } from './property-access.js';
import { compileElementAccessExpression } from './element-access.js';
import { compilePrefixUnaryExpression, compilePostfixUnaryExpression } from './unary-expressions.js';
import { compileBinaryExpression } from './binary-expression.js';
import { compileConditionalExpression } from './conditional-expression.js';
import { compileTypeOfExpression } from './typeof-expression.js';
import { compileCallExpression } from './call-expression.js';
import { compileObjectLiteral } from './object-literal.js';

// Registry populated as we extract visitors
export const expressionVisitors: Partial<Record<ts.SyntaxKind, ExpressionVisitor<any>>> = {
  [ts.SyntaxKind.StringLiteral]: compileStringLiteral,
  [ts.SyntaxKind.NumericLiteral]: compileNumericLiteral,
  [ts.SyntaxKind.TrueKeyword]: compileTrue,
  [ts.SyntaxKind.FalseKeyword]: compileFalse,
  [ts.SyntaxKind.NullKeyword]: compileNull,
  [ts.SyntaxKind.Identifier]: compileIdentifier,
  [ts.SyntaxKind.ArrayLiteralExpression]: compileArrayLiteral,
  [ts.SyntaxKind.BinaryExpression]: compileBinaryExpression,
  [ts.SyntaxKind.PrefixUnaryExpression]: compilePrefixUnaryExpression,
  [ts.SyntaxKind.PostfixUnaryExpression]: compilePostfixUnaryExpression,
  [ts.SyntaxKind.CallExpression]: compileCallExpression,
  [ts.SyntaxKind.PropertyAccessExpression]: compilePropertyAccessExpression,
  [ts.SyntaxKind.ElementAccessExpression]: compileElementAccessExpression,
  [ts.SyntaxKind.ConditionalExpression]: compileConditionalExpression,
  [ts.SyntaxKind.TypeOfExpression]: compileTypeOfExpression,
  [ts.SyntaxKind.ParenthesizedExpression]: compileParenthesizedExpression,
  [ts.SyntaxKind.ObjectLiteralExpression]: compileObjectLiteral,
};