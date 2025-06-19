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
      // Handle increment/decrement statements (e.g., i++ or ++i)
      else if (ts.isPostfixUnaryExpression(expr) || ts.isPrefixUnaryExpression(expr)) {
        compileExpression(expr);
        // Pop the result since it's not being used
        state.emit(OpCode.POP);
      }
      // Handle assignment expressions (e.g., i = i + 1)
      else if (ts.isBinaryExpression(expr) && 
               expr.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
        // Compile the right-hand side
        compileExpression(expr.right);
        // Store to the variable or array element
        if (ts.isIdentifier(expr.left)) {
          state.emit(OpCode.STORE, expr.left.text);
        } else if (ts.isElementAccessExpression(expr.left)) {
          // For array[index] = value
          // Value is already on stack from right-hand side
          // We need stack order: array, index, value
          // Use a temp variable to reorder
          const tempVar = `__temp_${state.getBytecode().length}`;
          state.emit(OpCode.STORE, tempVar); // Store value temporarily
          compileExpression(expr.left.expression); // Push array
          compileExpression(expr.left.argumentExpression); // Push index
          state.emit(OpCode.LOAD, tempVar); // Load value back on top
          state.emit(OpCode.ARRAY_SET);
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
    else if (ts.isReturnStatement(node)) {
      if (node.expression) {
        // Return with value: compile expression (result goes on stack)
        compileExpression(node.expression);
      } else {
        // Return without value: push null
        state.emit(OpCode.PUSH, null);
      }
      state.emit(OpCode.RETURN);
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
      // Handle .length for both arrays and strings
      compileExpression(node.expression);
      state.emit(OpCode.LENGTH);
    }
    else if (ts.isIdentifier(node)) {
      if (node.text === 'undefined') {
        state.emit(OpCode.PUSH_UNDEFINED);
      } else {
        state.emit(OpCode.LOAD, node.text);
      }
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
          } else {
            // For all other cases, use ADD
            // The VM will handle type conversion with cvmToNumber
            state.emit(OpCode.ADD);
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
        case ts.SyntaxKind.PercentToken:
          state.emit(OpCode.MOD);
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
        case ts.SyntaxKind.LessThanEqualsToken:
          state.emit(OpCode.LTE);
          break;
        case ts.SyntaxKind.GreaterThanEqualsToken:
          state.emit(OpCode.GTE);
          break;
        case ts.SyntaxKind.EqualsEqualsEqualsToken:
          state.emit(OpCode.EQ_STRICT);
          break;
        case ts.SyntaxKind.ExclamationEqualsEqualsToken:
          state.emit(OpCode.NEQ_STRICT);
          break;
        case ts.SyntaxKind.AmpersandAmpersandToken:
          state.emit(OpCode.AND);
          break;
        case ts.SyntaxKind.BarBarToken:
          state.emit(OpCode.OR);
          break;
        default:
          // Unsupported operator - could add error handling here
          break;
      }
    }
    else if (ts.isPrefixUnaryExpression(node)) {
      // Handle unary operators like !, -, +, ++, --
      switch (node.operator) {
        case ts.SyntaxKind.ExclamationToken:
          // Compile the operand first
          compileExpression(node.operand);
          // Then apply NOT
          state.emit(OpCode.NOT);
          break;
        case ts.SyntaxKind.MinusToken:
          // Unary minus
          compileExpression(node.operand);
          state.emit(OpCode.UNARY_MINUS);
          break;
        case ts.SyntaxKind.PlusToken:
          // Unary plus
          compileExpression(node.operand);
          state.emit(OpCode.UNARY_PLUS);
          break;
        case ts.SyntaxKind.PlusPlusToken:
          // Pre-increment: ++x
          if (ts.isIdentifier(node.operand)) {
            state.emit(OpCode.PUSH, node.operand.text);
            state.emit(OpCode.INC, false); // false = pre-increment
          }
          break;
        case ts.SyntaxKind.MinusMinusToken:
          // Pre-decrement: --x
          if (ts.isIdentifier(node.operand)) {
            state.emit(OpCode.PUSH, node.operand.text);
            state.emit(OpCode.DEC, false); // false = pre-decrement
          }
          break;
        default:
          // Other unary operators not yet implemented
          break;
      }
    }
    else if (ts.isPostfixUnaryExpression(node)) {
      // Handle post-increment and post-decrement: x++, x--
      switch (node.operator) {
        case ts.SyntaxKind.PlusPlusToken:
          // Post-increment: x++
          if (ts.isIdentifier(node.operand)) {
            state.emit(OpCode.PUSH, node.operand.text);
            state.emit(OpCode.INC, true); // true = post-increment
          }
          break;
        case ts.SyntaxKind.MinusMinusToken:
          // Post-decrement: x--
          if (ts.isIdentifier(node.operand)) {
            state.emit(OpCode.PUSH, node.operand.text);
            state.emit(OpCode.DEC, true); // true = post-decrement
          }
          break;
      }
    }
    else if (ts.isTypeOfExpression(node)) {
      compileExpression(node.expression);
      state.emit(OpCode.TYPEOF);
    }
    else if (ts.isConditionalExpression(node)) {
      // Ternary operator: condition ? whenTrue : whenFalse
      
      // Compile condition
      compileExpression(node.condition);
      
      // Emit jump to false branch (will patch address later)
      const jumpToFalseIndex = state.emit(OpCode.JUMP_IF_FALSE, -1);
      
      // True branch
      compileExpression(node.whenTrue);
      
      // Jump over false branch
      const jumpToEndIndex = state.emit(OpCode.JUMP, -1);
      
      // False branch starts here
      const falseBranchAddress = state.currentAddress();
      state.patchJump(jumpToFalseIndex, falseBranchAddress);
      
      compileExpression(node.whenFalse);
      
      // End of ternary
      const endAddress = state.currentAddress();
      state.patchJump(jumpToEndIndex, endAddress);
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


// Helper to check if either operand contains a string literal
function hasStringOperand(left: ts.Node, right: ts.Node): boolean {
  // Check if either operand is a string literal
  if (ts.isStringLiteral(left) || ts.isStringLiteral(right)) {
    return true;
  }
  
  // For binary expressions with +, check recursively
  if (ts.isBinaryExpression(left) && left.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    if (hasStringOperand(left.left, left.right)) return true;
  }
  if (ts.isBinaryExpression(right) && right.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    if (hasStringOperand(right.left, right.right)) return true;
  }
  
  return false;
}