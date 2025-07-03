import { ForStatement } from '../../ast.js';
import { CompilerContext } from '../context.js';
import { OpCode } from '../../bytecode.js';

export function compileForStatement(node: ForStatement, context: CompilerContext): void {
  // 1. Compile init
  if (node.init) {
    if (node.init.type === 'VariableDeclaration') {
      context.compileStatement(node.init);
    } else {
      context.compileExpression(node.init);
      context.emit({ op: OpCode.POP }); // Discard init expression result
    }
  }
  
  // 2. Mark loop start
  const loopStart = context.bytecode.length;
  const exitJumps: number[] = [];
  
  // 3. Compile test condition
  if (node.test) {
    context.compileExpression(node.test);
    const jumpIndex = context.bytecode.length;
    context.emit({ op: OpCode.JUMP_IF_FALSE, arg: -1 }); // Will patch later
    exitJumps.push(jumpIndex);
  }
  
  // 4. Compile body
  context.pushLoop(loopStart);
  context.compileStatement(node.body);
  
  // 5. Continue target (for continue statements)
  const continueTarget = context.bytecode.length;
  context.loops[context.loops.length - 1].continueTarget = continueTarget;
  
  // 6. Compile update
  if (node.update) {
    context.compileExpression(node.update);
    context.emit({ op: OpCode.POP }); // Discard update expression result
  }
  
  // 7. Jump back to start
  context.emit({ op: OpCode.JUMP, arg: loopStart });
  
  // 8. Patch exit jumps
  const exitPoint = context.bytecode.length;
  exitJumps.forEach(jumpIndex => {
    context.bytecode[jumpIndex].arg = exitPoint;
  });
  
  // Patch break jumps
  const loop = context.popLoop();
  loop.breakJumps.forEach(jumpIndex => {
    context.bytecode[jumpIndex].arg = exitPoint;
  });
}