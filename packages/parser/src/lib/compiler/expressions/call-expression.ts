import * as ts from 'typescript';
import { OpCode } from '../../bytecode.js';
import { ExpressionVisitor } from '../visitor-types.js';

export const compileCallExpression: ExpressionVisitor<ts.CallExpression> = (
  node,
  state,
  { compileExpression }
) => {
  // Handle fs.listFiles()
  if (ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === 'fs' &&
      node.expression.name.text === 'listFiles') {
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
  // Handle CC() calls
  else if (ts.isIdentifier(node.expression) && node.expression.text === 'CC') {
    if (node.arguments.length > 0) {
      compileExpression(node.arguments[0]);
    }
    state.emit(OpCode.CC);
  }
  // Handle string methods
  else if (ts.isPropertyAccessExpression(node.expression)) {
    const methodName = node.expression.name.text;
    
    if (methodName === 'substring') {
      // Compile the string expression
      compileExpression(node.expression.expression);
      
      // Compile start argument
      if (node.arguments.length > 0) {
        compileExpression(node.arguments[0]);
      } else {
        state.emit(OpCode.PUSH, 0);
      }
      
      // Compile end argument if provided
      if (node.arguments.length > 1) {
        compileExpression(node.arguments[1]);
      }
      
      state.emit(OpCode.STRING_SUBSTRING);
    }
    else if (methodName === 'indexOf') {
      // Compile the string expression
      compileExpression(node.expression.expression);
      
      // Compile search string
      if (node.arguments.length > 0) {
        compileExpression(node.arguments[0]);
      } else {
        state.emit(OpCode.PUSH, '');
      }
      
      state.emit(OpCode.STRING_INDEXOF);
    }
    else if (methodName === 'split') {
      // Compile the string expression
      compileExpression(node.expression.expression);
      
      // Compile delimiter
      if (node.arguments.length > 0) {
        compileExpression(node.arguments[0]);
      } else {
        state.emit(OpCode.PUSH, '');
      }
      
      state.emit(OpCode.STRING_SPLIT);
    }
    else if (methodName === 'slice') {
      // Compile the string expression
      compileExpression(node.expression.expression);
      
      // Compile start argument
      if (node.arguments.length > 0) {
        compileExpression(node.arguments[0]);
      } else {
        state.emit(OpCode.PUSH, 0);
      }
      
      // Compile end argument if provided
      if (node.arguments.length > 1) {
        compileExpression(node.arguments[1]);
      }
      
      state.emit(OpCode.STRING_SLICE);
    }
    else if (methodName === 'charAt') {
      // Compile the string expression
      compileExpression(node.expression.expression);
      
      // Compile index argument
      if (node.arguments.length > 0) {
        compileExpression(node.arguments[0]);
      } else {
        state.emit(OpCode.PUSH, 0);
      }
      
      state.emit(OpCode.STRING_CHARAT);
    }
    else if (methodName === 'toUpperCase') {
      // Compile the string expression
      compileExpression(node.expression.expression);
      
      state.emit(OpCode.STRING_TOUPPERCASE);
    }
    else if (methodName === 'toLowerCase') {
      // Compile the string expression
      compileExpression(node.expression.expression);
      
      state.emit(OpCode.STRING_TOLOWERCASE);
    }
    else if (methodName === 'toString') {
      // toString() takes no arguments
      compileExpression(node.expression.expression);
      state.emit(OpCode.TO_STRING);
    }
    else {
      throw new Error(`Method call '${methodName}' is not supported`);
    }
  }
  else {
    throw new Error('Unsupported call expression');
  }
};