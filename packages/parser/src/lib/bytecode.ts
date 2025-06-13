export enum OpCode {
  // Stack operations
  PUSH = 'PUSH',
  POP = 'POP',
  
  // Variables
  LOAD = 'LOAD',
  STORE = 'STORE',
  
  // Operations
  CONCAT = 'CONCAT',
  
  // Control flow
  JUMP = 'JUMP',
  JUMP_IF = 'JUMP_IF',
  CALL = 'CALL',
  RETURN = 'RETURN',
  
  // Cognitive
  CC = 'CC',
  
  // I/O
  PRINT = 'PRINT',
  
  // System
  HALT = 'HALT'
}

export interface Instruction {
  op: OpCode;
  arg?: any;
  line?: number;
}