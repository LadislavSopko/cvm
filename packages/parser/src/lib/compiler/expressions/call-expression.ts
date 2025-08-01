import * as ts from 'typescript';
import { OpCode } from '../../bytecode.js';
import { ExpressionVisitor } from '../visitor-types.js';

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
        reportError(node, 'fs.readFile() requires a path argument');
      }
    }
    else if (methodName === 'writeFile') {
      // fs.writeFile(path, content) - expects 2 arguments
      if (node.arguments.length < 2) {
        reportError(node, 'fs.writeFile() requires path and content arguments');
        return; // Don't continue compilation if arguments are missing
      }
      compileExpression(node.arguments[0]); // path
      compileExpression(node.arguments[1]); // content
      state.emit(OpCode.FS_WRITE_FILE);
    }
    else {
      reportError(node, `Unsupported fs method: ${methodName}`);
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
      reportError(node, 'Object.keys() requires exactly one argument');
      return;
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
      // This method exists on both strings and arrays
      // Since we can't determine type at compile time, we need to handle this differently
      // For now, we'll add a separate check after the string methods
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
      } else {
        state.emit(OpCode.PUSH_UNDEFINED);
      }
      
      // For now, emit STRING_SLICE - it will work for strings
      // Arrays will need to use a different approach or runtime type checking
      state.emit(OpCode.STRING_SLICE);
    }
    else if (methodName === 'join') {
      // Array join method
      compileExpression(node.expression.expression);
      if (node.arguments.length > 0) {
        compileExpression(node.arguments[0]);
      } else {
        state.emit(OpCode.PUSH, ',');
      }
      state.emit(OpCode.ARRAY_JOIN);
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
    else if (methodName === 'includes') {
      compileExpression(node.expression.expression);
      if (node.arguments.length > 0) {
        compileExpression(node.arguments[0]);
      } else {
        state.emit(OpCode.PUSH, '');
      }
      state.emit(OpCode.STRING_INCLUDES);
    }
    else if (methodName === 'endsWith') {
      compileExpression(node.expression.expression);
      if (node.arguments.length > 0) {
        compileExpression(node.arguments[0]);
      } else {
        state.emit(OpCode.PUSH, '');
      }
      state.emit(OpCode.STRING_ENDS_WITH);
    }
    else if (methodName === 'startsWith') {
      compileExpression(node.expression.expression);
      if (node.arguments.length > 0) {
        compileExpression(node.arguments[0]);
      } else {
        state.emit(OpCode.PUSH, '');
      }
      state.emit(OpCode.STRING_STARTS_WITH);
    }
    else if (methodName === 'trim') {
      compileExpression(node.expression.expression);
      state.emit(OpCode.STRING_TRIM);
    }
    else if (methodName === 'trimStart') {
      compileExpression(node.expression.expression);
      state.emit(OpCode.STRING_TRIM_START);
    }
    else if (methodName === 'trimEnd') {
      compileExpression(node.expression.expression);
      state.emit(OpCode.STRING_TRIM_END);
    }
    else if (methodName === 'test') {
      // RegExp.test(string) method
      compileExpression(node.expression.expression);
      if (node.arguments.length > 0) {
        compileExpression(node.arguments[0]);
      } else {
        state.emit(OpCode.PUSH, '');
      }
      state.emit(OpCode.REGEX_TEST);
    }
    else if (methodName === 'match') {
      // String.match(regex) method
      compileExpression(node.expression.expression);
      if (node.arguments.length > 0) {
        compileExpression(node.arguments[0]);
      } else {
        reportError(node, 'match() requires a regex argument');
        return;
      }
      state.emit(OpCode.STRING_MATCH);
    }
    else if (methodName === 'replace') {
      compileExpression(node.expression.expression);
      if (node.arguments.length > 0) {
        compileExpression(node.arguments[0]);
      } else {
        state.emit(OpCode.PUSH, '');
      }
      if (node.arguments.length > 1) {
        compileExpression(node.arguments[1]);
      } else {
        state.emit(OpCode.PUSH, '');
      }
      
      // Always emit STRING_REPLACE_REGEX for replace() calls
      // This matches the behavior of match() and test() methods which always assume regex arguments
      // The STRING_REPLACE_REGEX handler will handle both regex objects and string arguments
      state.emit(OpCode.STRING_REPLACE_REGEX);
    }
    else if (methodName === 'replaceAll') {
      compileExpression(node.expression.expression);
      if (node.arguments.length > 0) {
        compileExpression(node.arguments[0]);
      } else {
        state.emit(OpCode.PUSH, '');
      }
      if (node.arguments.length > 1) {
        compileExpression(node.arguments[1]);
      } else {
        state.emit(OpCode.PUSH, '');
      }
      state.emit(OpCode.STRING_REPLACE_ALL);
    }
    else if (methodName === 'lastIndexOf') {
      compileExpression(node.expression.expression);
      if (node.arguments.length > 0) {
        compileExpression(node.arguments[0]);
      } else {
        state.emit(OpCode.PUSH, '');
      }
      state.emit(OpCode.STRING_LAST_INDEX_OF);
    }
    else if (methodName === 'repeat') {
      compileExpression(node.expression.expression);
      if (node.arguments.length > 0) {
        compileExpression(node.arguments[0]);
      } else {
        state.emit(OpCode.PUSH, 0);
      }
      state.emit(OpCode.STRING_REPEAT);
    }
    else if (methodName === 'padStart') {
      compileExpression(node.expression.expression);
      if (node.arguments.length > 0) {
        compileExpression(node.arguments[0]);
      } else {
        state.emit(OpCode.PUSH, 0);
      }
      if (node.arguments.length > 1) {
        compileExpression(node.arguments[1]);
      } else {
        state.emit(OpCode.PUSH, ' ');
      }
      state.emit(OpCode.STRING_PAD_START);
    }
    else if (methodName === 'padEnd') {
      compileExpression(node.expression.expression);
      if (node.arguments.length > 0) {
        compileExpression(node.arguments[0]);
      } else {
        state.emit(OpCode.PUSH, 0);
      }
      if (node.arguments.length > 1) {
        compileExpression(node.arguments[1]);
      } else {
        state.emit(OpCode.PUSH, ' ');
      }
      state.emit(OpCode.STRING_PAD_END);
    }
    // Array methods that share names with string methods need special handling
    else if (methodName === 'push') {
      // Array push method
      compileExpression(node.expression.expression);
      if (node.arguments.length > 0) {
        compileExpression(node.arguments[0]);
      } else {
        state.emit(OpCode.PUSH_UNDEFINED);
      }
      state.emit(OpCode.ARRAY_PUSH);
    }
    else {
      throw new Error(`Method call '${methodName}' is not supported`);
    }
  }
  else {
    throw new Error('Unsupported call expression');
  }
};