import * as ts from 'typescript';
import { OpCode } from '../../bytecode.js';
import { StatementVisitor } from '../visitor-types.js';

export const compileExpressionStatement: StatementVisitor<ts.ExpressionStatement> = (
  node,
  state,
  { compileExpression }
) => {
  const expr = node.expression;
  
  // Handle compound assignment expressions FIRST (e.g., i += 1, i *= 2)
  if (ts.isBinaryExpression(expr)) {
    const opToken = expr.operatorToken.kind;
    
    // Check for compound assignments first
    if (opToken === ts.SyntaxKind.PlusEqualsToken ||
        opToken === ts.SyntaxKind.MinusEqualsToken ||
        opToken === ts.SyntaxKind.AsteriskEqualsToken ||
        opToken === ts.SyntaxKind.SlashEqualsToken ||
        opToken === ts.SyntaxKind.PercentEqualsToken) {
      
      // For compound assignment, we need to:
      // 1. Load current value of left side
      // 2. Compile right side expression
      // 3. Apply the operation
      // 4. Store back to left side
      
      if (ts.isIdentifier(expr.left)) {
        // Simple variable compound assignment (e.g., i += 1)
        state.emit(OpCode.LOAD, expr.left.text);
        
        // Compile right side
        compileExpression(expr.right);
        
        // Apply the appropriate operation
        switch (opToken) {
          case ts.SyntaxKind.PlusEqualsToken:
            // Always emit ADD - let VM decide at runtime
            state.emit(OpCode.ADD);
            break;
          case ts.SyntaxKind.MinusEqualsToken:
            state.emit(OpCode.SUB);
            break;
          case ts.SyntaxKind.AsteriskEqualsToken:
            state.emit(OpCode.MUL);
            break;
          case ts.SyntaxKind.SlashEqualsToken:
            state.emit(OpCode.DIV);
            break;
          case ts.SyntaxKind.PercentEqualsToken:
            state.emit(OpCode.MOD);
            break;
        }
        
        state.emit(OpCode.STORE, expr.left.text);
      } else if (ts.isElementAccessExpression(expr.left)) {
        // Array element compound assignment (e.g., arr[i] += 1)
        // This is more complex, need to handle carefully
        // For now, throw an error as it's not in our test cases
        throw new Error('Compound assignment to array elements not yet supported');
      }
      return; // Important: return early to avoid falling through
    }
    // Handle simple assignment (=)
    else if (opToken === ts.SyntaxKind.EqualsToken) {
      // Compile the right-hand side
      compileExpression(expr.right);
      // Store to the variable or array element
      if (ts.isIdentifier(expr.left)) {
        state.emit(OpCode.STORE, expr.left.text);
      } else if (ts.isElementAccessExpression(expr.left)) {
        // For array[index] = value or obj[key] = value
        // Value is already on stack from right-hand side
        // We need stack order: array/obj, index/key, value
        // Use a temp variable to reorder
        const tempVar = `__temp_${state.getBytecode().length}`;
        state.emit(OpCode.STORE, tempVar); // Store value temporarily
        compileExpression(expr.left.expression); // Push array/object
        compileExpression(expr.left.argumentExpression); // Push index/key
        state.emit(OpCode.LOAD, tempVar); // Load value back on top
        
        // Use ARRAY_SET for compatibility (unified SET opcode is now available)
        state.emit(OpCode.ARRAY_SET);
        state.emit(OpCode.POP); // Discard the result (undefined)
      } else if (ts.isPropertyAccessExpression(expr.left)) {
        // For obj.prop = value
        // Value is already on stack from right-hand side
        // We need stack order: obj, key, value
        const tempVar = `__temp_${state.getBytecode().length}`;
        state.emit(OpCode.STORE, tempVar); // Store value temporarily
        compileExpression(expr.left.expression); // Push object
        state.emit(OpCode.PUSH, expr.left.name.text); // Push property name
        state.emit(OpCode.LOAD, tempVar); // Load value back on top
        state.emit(OpCode.PROPERTY_SET);
        state.emit(OpCode.POP); // Discard the result (undefined)
      }
      return; // Important: return early
    }
  }
  
  // Handle console.log()
  if (ts.isCallExpression(expr) && 
      ts.isPropertyAccessExpression(expr.expression) &&
      expr.expression.expression.getText() === 'console' &&
      expr.expression.name.getText() === 'log') {
    
    // Compile arguments
    expr.arguments.forEach(arg => {
      compileExpression(arg);
    });
    state.emit(OpCode.PRINT);
  }
  // Handle CC() calls at statement level
  else if (ts.isCallExpression(expr) && 
           ts.isIdentifier(expr.expression) && 
           expr.expression.text === 'CC') {
    if (expr.arguments.length > 0) {
      compileExpression(expr.arguments[0]);
    }
    state.emit(OpCode.CC);
    state.emit(OpCode.POP); // Discard result if not used
  }
  // Handle array.push()
  else if (ts.isCallExpression(expr) && 
           ts.isPropertyAccessExpression(expr.expression) &&
           expr.expression.name.getText() === 'push') {
    // Load the array
    compileExpression(expr.expression.expression);
    // Compile the argument to push
    if (expr.arguments.length > 0) {
      compileExpression(expr.arguments[0]);
    }
    state.emit(OpCode.ARRAY_PUSH);
  }
  // Handle increment/decrement statements (e.g., i++ or ++i)
  else if (ts.isPostfixUnaryExpression(expr) || ts.isPrefixUnaryExpression(expr)) {
    compileExpression(expr);
    // Pop the result since it's not being used
    state.emit(OpCode.POP);
  }
  // Handle any other expression (including fs method calls)
  else {
    compileExpression(expr);
    // Pop the result since it's not being used in this statement
    state.emit(OpCode.POP);
  }
};