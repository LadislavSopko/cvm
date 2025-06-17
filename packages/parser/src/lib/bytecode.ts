export enum OpCode {
  // Stack operations
  PUSH = 'PUSH',
  POP = 'POP',
  
  // Variables
  LOAD = 'LOAD',
  STORE = 'STORE',
  
  // Operations
  CONCAT = 'CONCAT',
  
  // Array operations
  ARRAY_NEW = 'ARRAY_NEW',
  ARRAY_PUSH = 'ARRAY_PUSH',
  ARRAY_GET = 'ARRAY_GET',
  ARRAY_LEN = 'ARRAY_LEN',
  
  // Type operations
  JSON_PARSE = 'JSON_PARSE',
  TYPEOF = 'TYPEOF',
  
  // Arithmetic
  ADD = 'ADD',
  SUB = 'SUB',
  
  // Comparison
  EQ = 'EQ',
  NEQ = 'NEQ',
  LT = 'LT',
  GT = 'GT',
  
  // Control flow
  JUMP = 'JUMP',
  JUMP_IF = 'JUMP_IF',
  JUMP_IF_FALSE = 'JUMP_IF_FALSE',
  JUMP_IF_TRUE = 'JUMP_IF_TRUE',
  CALL = 'CALL',
  RETURN = 'RETURN',
  
  // Logical
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
  
  // Iteration
  ITER_START = 'ITER_START',
  ITER_NEXT = 'ITER_NEXT',
  ITER_END = 'ITER_END',
  
  // File operations
  FS_LIST_FILES = 'FS_LIST_FILES',
  
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