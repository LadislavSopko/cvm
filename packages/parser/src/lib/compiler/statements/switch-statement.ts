import * as ts from 'typescript';
import { OpCode } from '../../bytecode.js';
import { StatementVisitor } from '../visitor-types.js';

export const compileSwitchStatement: StatementVisitor<ts.SwitchStatement> = (
  node,
  state,
  { compileExpression, compileStatement }
) => {
  // Store switch discriminant in temporary variable
  const tempVar = state.generateTempVar();
  
  // Evaluate discriminant once
  compileExpression(node.expression);
  state.emit(OpCode.STORE, tempVar);
  
  const exitJumps: number[] = [];
  const caseJumps: number[] = [];
  let defaultJump: number | null = null;
  
  // First pass: Generate comparisons and collect jump addresses
  node.caseBlock.clauses.forEach((clause, index) => {
    if (ts.isCaseClause(clause)) {
      // case value:
      state.emit(OpCode.LOAD, tempVar);
      compileExpression(clause.expression);
      state.emit(OpCode.EQ_STRICT);
      
      const jumpIndex = state.emit(OpCode.JUMP_IF_TRUE, -1); // Will patch to case body
      caseJumps.push(jumpIndex);
    } else if (ts.isDefaultClause(clause)) {
      // Mark default case position  
      defaultJump = state.emit(OpCode.JUMP, -1); // Will patch to default body
    }
  });
  
  // If no match found, jump to default or exit
  if (defaultJump !== null) {
    // Will patch later with default position
  } else {
    // Jump to exit if no default
    const exitIndex = state.emit(OpCode.JUMP, -1);
    exitJumps.push(exitIndex);
  }
  
  // Second pass: Generate case bodies
  let caseIndex = 0;
  node.caseBlock.clauses.forEach((clause, index) => {
    if (ts.isCaseClause(clause)) {
      // Patch jump to this case body
      const caseStart = state.currentAddress();
      state.patchJumps([caseJumps[caseIndex]], caseStart);
      caseIndex++;
      
      // Execute case statements
      clause.statements.forEach(stmt => {
        if (ts.isBreakStatement(stmt)) {
          const breakIndex = state.emit(OpCode.JUMP, -1);
          exitJumps.push(breakIndex);
        } else {
          compileStatement(stmt);
        }
      });
      
      // If no break, fall through to next case (implicit)
      
    } else if (ts.isDefaultClause(clause)) {
      // Patch jump to default case
      const defaultStart = state.currentAddress();
      if (defaultJump !== null) {
        state.patchJumps([defaultJump], defaultStart);
      }
      
      // Execute default statements
      clause.statements.forEach(stmt => {
        if (ts.isBreakStatement(stmt)) {
          const breakIndex = state.emit(OpCode.JUMP, -1);
          exitJumps.push(breakIndex);
        } else {
          compileStatement(stmt);
        }
      });
    }
  });
  
  // Patch all exit jumps
  const exitPoint = state.currentAddress();
  state.patchJumps(exitJumps, exitPoint);
};