import * as ts from 'typescript';
import { OpCode } from '../../bytecode.js';
import { StatementVisitor } from '../visitor-types.js';

export const compileVariableStatement: StatementVisitor<ts.VariableStatement> = (
  node,
  state,
  { compileExpression }
) => {
  const decl = node.declarationList.declarations[0];
  if (decl.initializer) {
    compileExpression(decl.initializer);
    state.emit(OpCode.STORE, decl.name.getText());
  }
};