import * as ts from 'typescript';
import { OpCode, Instruction } from './bytecode.js';
import { parseProgram } from './parser.js';
import { CompilerState, JumpContext } from './compiler-state.js';

export interface CompileResult {
  success: boolean;
  bytecode: Instruction[];
  errors: string[];
}

export function compile(source: string): CompileResult {
  const parseResult = parseProgram(source);
  
  if (parseResult.errors.length > 0) {
    return {
      success: false,
      bytecode: [],
      errors: parseResult.errors
    };
  }

  const state = new CompilerState();
  const sourceFile = ts.createSourceFile('program.ts', source, ts.ScriptTarget.Latest, true);
  
  // Simple compiler - just handle main() for now
  function compileStatement(node: ts.Node): void {
    if (ts.isIfStatement(node)) {
      // Compile condition
      compileExpression(node.expression);
      
      // Emit JUMP_IF_FALSE with placeholder address
      const jumpIfFalseIndex = state.emit(OpCode.JUMP_IF_FALSE, -1);
      
      // Push if context
      const ifContext: JumpContext = {
        type: 'if',
        endTargets: []
      };
      
      // Check if there's an else block
      if (node.elseStatement) {
        ifContext.elseTarget = jumpIfFalseIndex;
      } else {
        ifContext.endTargets.push(jumpIfFalseIndex);
      }
      
      state.pushContext(ifContext);
      
      // Compile then statement
      compileStatement(node.thenStatement);
      
      // Handle else block if present
      if (node.elseStatement) {
        // Emit JUMP to skip else block
        const jumpIndex = state.emit(OpCode.JUMP, -1);
        ifContext.endTargets.push(jumpIndex);
        
        // Patch JUMP_IF_FALSE to jump to else block
        const elseAddress = state.currentAddress();
        state.patchJump(jumpIfFalseIndex, elseAddress);
        
        // Compile else statement
        compileStatement(node.elseStatement);
      }
      
      // Pop context and patch all end jumps
      const context = state.popContext();
      if (context) {
        const endAddress = state.currentAddress();
        state.patchJumps(context.endTargets, endAddress);
      }
    }
    else if (ts.isWhileStatement(node)) {
      // Record loop start position
      const loopStart = state.currentAddress();
      
      // Compile condition
      compileExpression(node.expression);
      
      // Emit JUMP_IF_FALSE with placeholder
      const jumpIfFalseIndex = state.emit(OpCode.JUMP_IF_FALSE, -1);
      
      // Push loop context
      const loopContext: JumpContext = {
        type: 'loop',
        breakTargets: [jumpIfFalseIndex],
        continueTargets: [],
        endTargets: [],
        startAddress: loopStart
      };
      state.pushContext(loopContext);
      
      // Compile loop body
      compileStatement(node.statement);
      
      // Jump back to loop start
      state.emit(OpCode.JUMP, loopStart);
      
      // Pop context and patch break jumps
      const context = state.popContext();
      if (context) {
        const endAddress = state.currentAddress();
        state.patchJumps(context.breakTargets || [], endAddress);
      }
    }
    else if (ts.isBlock(node)) {
      // Compile each statement in the block
      node.statements.forEach(stmt => {
        compileStatement(stmt);
      });
    }
    else if (ts.isExpressionStatement(node)) {
      const expr = node.expression;
      
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
      // Handle assignment expressions (e.g., i = i + 1)
      else if (ts.isBinaryExpression(expr) && 
               expr.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
        // Compile the right-hand side
        compileExpression(expr.right);
        // Store to the variable
        if (ts.isIdentifier(expr.left)) {
          state.emit(OpCode.STORE, expr.left.text);
        }
      }
    }
    else if (ts.isVariableStatement(node)) {
      const decl = node.declarationList.declarations[0];
      if (decl.initializer) {
        compileExpression(decl.initializer);
        state.emit(OpCode.STORE, decl.name.getText());
      }
    }
  }

  function compileExpression(node: ts.Node): void {
    if (ts.isStringLiteral(node)) {
      state.emit(OpCode.PUSH, node.text);
    }
    else if (ts.isNumericLiteral(node)) {
      state.emit(OpCode.PUSH, Number(node.text));
    }
    else if (node.kind === ts.SyntaxKind.TrueKeyword) {
      state.emit(OpCode.PUSH, true);
    }
    else if (node.kind === ts.SyntaxKind.FalseKeyword) {
      state.emit(OpCode.PUSH, false);
    }
    else if (node.kind === ts.SyntaxKind.NullKeyword) {
      state.emit(OpCode.PUSH, null);
    }
    else if (ts.isArrayLiteralExpression(node)) {
      // Create new array
      state.emit(OpCode.ARRAY_NEW);
      // Push each element and add to array
      node.elements.forEach(element => {
        compileExpression(element);
        state.emit(OpCode.ARRAY_PUSH);
      });
    }
    else if (ts.isElementAccessExpression(node)) {
      // Load array
      compileExpression(node.expression);
      // Load index
      if (node.argumentExpression) {
        compileExpression(node.argumentExpression);
      }
      state.emit(OpCode.ARRAY_GET);
    }
    else if (ts.isPropertyAccessExpression(node) && node.name.text === 'length') {
      // Handle array.length
      compileExpression(node.expression);
      state.emit(OpCode.ARRAY_LEN);
    }
    else if (ts.isIdentifier(node)) {
      state.emit(OpCode.LOAD, node.text);
    }
    else if (ts.isCallExpression(node)) {
      // Handle JSON.parse()
      if (ts.isPropertyAccessExpression(node.expression) &&
          ts.isIdentifier(node.expression.expression) &&
          node.expression.expression.text === 'JSON' &&
          node.expression.name.text === 'parse') {
        if (node.arguments.length > 0) {
          compileExpression(node.arguments[0]);
        }
        state.emit(OpCode.JSON_PARSE);
      }
      // Handle CC() calls
      else if (ts.isIdentifier(node.expression) && node.expression.text === 'CC') {
        if (node.arguments.length > 0) {
          compileExpression(node.arguments[0]);
        }
        state.emit(OpCode.CC);
      }
    }
    else if (ts.isParenthesizedExpression(node)) {
      // Simply compile the inner expression
      compileExpression(node.expression);
    }
    else if (ts.isBinaryExpression(node)) {
      const operator = node.operatorToken.kind;
      
      // Compile left and right operands
      compileExpression(node.left);
      compileExpression(node.right);
      
      // Emit appropriate opcode based on operator
      switch (operator) {
        case ts.SyntaxKind.PlusToken:
          // Determine if this is numeric addition or string concatenation
          if (hasStringOperand(node.left, node.right)) {
            // If either operand is a string literal, always use CONCAT
            state.emit(OpCode.CONCAT);
          } else if (isLikelyNumeric(node.left) && isLikelyNumeric(node.right)) {
            // If both are likely numeric, use ADD
            state.emit(OpCode.ADD);
          } else {
            // Default to CONCAT for safety (JavaScript behavior)
            state.emit(OpCode.CONCAT);
          }
          break;
        case ts.SyntaxKind.MinusToken:
          state.emit(OpCode.SUB);
          break;
        case ts.SyntaxKind.AsteriskToken:
          state.emit(OpCode.MUL);
          break;
        case ts.SyntaxKind.SlashToken:
          state.emit(OpCode.DIV);
          break;
        case ts.SyntaxKind.EqualsEqualsToken:
          state.emit(OpCode.EQ);
          break;
        case ts.SyntaxKind.ExclamationEqualsToken:
          state.emit(OpCode.NEQ);
          break;
        case ts.SyntaxKind.LessThanToken:
          state.emit(OpCode.LT);
          break;
        case ts.SyntaxKind.GreaterThanToken:
          state.emit(OpCode.GT);
          break;
        default:
          // Unsupported operator - could add error handling here
          break;
      }
    }
    else if (ts.isTypeOfExpression(node)) {
      compileExpression(node.expression);
      state.emit(OpCode.TYPEOF);
    }
  }

  // Find and compile main function
  sourceFile.forEachChild(node => {
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'main' && node.body) {
      node.body.statements.forEach(stmt => {
        compileStatement(stmt);
      });
    }
  });

  state.emit(OpCode.HALT);

  return {
    success: true,
    bytecode: state.getBytecode(),
    errors: []
  };
}

// Helper to determine if an expression is likely numeric
function isLikelyNumeric(node: ts.Node): boolean {
  if (ts.isNumericLiteral(node)) return true;
  if (ts.isParenthesizedExpression(node)) {
    return isLikelyNumeric(node.expression);
  }
  if (ts.isBinaryExpression(node)) {
    const op = node.operatorToken.kind;
    // Arithmetic operations always produce numbers
    return op === ts.SyntaxKind.MinusToken ||
           op === ts.SyntaxKind.AsteriskToken ||
           op === ts.SyntaxKind.SlashToken ||
           op === ts.SyntaxKind.LessThanToken ||
           op === ts.SyntaxKind.GreaterThanToken;
  }
  if (ts.isCallExpression(node)) {
    // array.length is numeric
    if (ts.isPropertyAccessExpression(node.expression) && 
        node.expression.name.text === 'length') {
      return true;
    }
  }
  if (ts.isPropertyAccessExpression(node) && node.name.text === 'length') {
    return true;
  }
  return false;
}

// Helper to check if either operand is definitely a string
function hasStringOperand(left: ts.Node, right: ts.Node): boolean {
  return ts.isStringLiteral(left) || ts.isStringLiteral(right);
}