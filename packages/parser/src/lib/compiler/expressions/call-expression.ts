// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025-2026 Ladislav Sopko

import * as ts from 'typescript';
import { OpCode } from '../../bytecode.js';
import { ExpressionVisitor } from '../visitor-types.js';
import { METHODS } from './method-table.js';

export const compileCallExpression: ExpressionVisitor<ts.CallExpression> = (
  node,
  state,
  { compileExpression, reportError }
) => {
  // Handle fs operations
  if (ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === 'fs') {
    const methodName = node.expression.name.text;
    
    if (methodName === 'listFiles') {
      // Compile path argument
      if (node.arguments.length > 0) {
        compileExpression(node.arguments[0]);
      } else {
        state.emit(OpCode.PUSH, '.');  // Default to current directory
      }
      
      // Compile options argument if provided
      if (node.arguments.length > 1) {
        compileExpression(node.arguments[1]);
      }
      
      state.emit(OpCode.FS_LIST_FILES);
    }
    else if (methodName === 'readFile') {
      // fs.readFile(path) - expects 1 argument
      if (node.arguments.length > 0) {
        compileExpression(node.arguments[0]);
        state.emit(OpCode.FS_READ_FILE);
      } else {
        return reportError(node, 'fs.readFile() requires a path argument');
      }
    }
    else if (methodName === 'writeFile') {
      // fs.writeFile(path, content) - expects 2 arguments
      if (node.arguments.length < 2) {
        return reportError(node, 'fs.writeFile() requires path and content arguments');
      }
      compileExpression(node.arguments[0]); // path
      compileExpression(node.arguments[1]); // content
      state.emit(OpCode.FS_WRITE_FILE);
    }
    else {
      return reportError(node, `Unsupported fs method: ${methodName}`);
    }
  }
  // Handle JSON.parse()
  else if (ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === 'JSON' &&
      node.expression.name.text === 'parse') {
    if (node.arguments.length > 0) {
      compileExpression(node.arguments[0]);
    }
    state.emit(OpCode.JSON_PARSE);
  }
  // Handle JSON.stringify()
  else if (ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === 'JSON' &&
      node.expression.name.text === 'stringify') {
    if (node.arguments.length > 0) {
      compileExpression(node.arguments[0]);
    } else {
      state.emit(OpCode.PUSH_UNDEFINED);
    }
    state.emit(OpCode.JSON_STRINGIFY);
  }
  // Handle Object.keys()
  else if (ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === 'Object' &&
      node.expression.name.text === 'keys') {
    
    if (node.arguments.length !== 1) {
      return reportError(node, 'Object.keys() requires exactly one argument');
    }
    
    compileExpression(node.arguments[0]);
    state.emit(OpCode.OBJECT_KEYS);
  }
  // Handle CC() calls
  else if (ts.isIdentifier(node.expression) && node.expression.text === 'CC') {
    if (node.arguments.length > 0) {
      compileExpression(node.arguments[0]);
    }
    state.emit(OpCode.CC);
  }
  else if (ts.isPropertyAccessExpression(node.expression)) {
    const methodName = node.expression.name.text;
    const spec = Object.hasOwn(METHODS, methodName) ? METHODS[methodName] : undefined;
    if (!spec) {
      return reportError(node, `Method call '${methodName}' is not supported`);
    }
    if (spec.required && node.arguments.length < spec.required) {
      return reportError(node, spec.requiredMessage ?? `${methodName}() requires ${spec.required} argument(s)`);
    }
    compileExpression(node.expression.expression);
    spec.args.forEach((def, i) => {
      if (node.arguments[i]) {
        compileExpression(node.arguments[i]);
      } else if (def === 'undefined') {
        state.emit(OpCode.PUSH_UNDEFINED);
      } else {
        state.emit(OpCode.PUSH, def.push);
      }
    });
    state.emit(spec.op);
  }
  else {
    return reportError(node, 'Unsupported call expression');
  }
};