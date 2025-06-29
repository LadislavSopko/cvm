export enum OpCode {
  // Stack operations
  PUSH = 'PUSH',
  PUSH_UNDEFINED = 'PUSH_UNDEFINED',
  POP = 'POP',
  DUP = 'DUP',
  DUP2 = 'DUP2',
  SWAP = 'SWAP',
  
  // Variables
  LOAD = 'LOAD',
  STORE = 'STORE',
  
  // Operations
  CONCAT = 'CONCAT',
  
  // Array operations
  ARRAY_NEW = 'ARRAY_NEW',
  ARRAY_PUSH = 'ARRAY_PUSH',
  ARRAY_GET = 'ARRAY_GET',
  ARRAY_SET = 'ARRAY_SET',
  ARRAY_LEN = 'ARRAY_LEN',
  ARRAY_MAP_PROP = 'ARRAY_MAP_PROP',
  ARRAY_FILTER_PROP = 'ARRAY_FILTER_PROP',
  
  // String operations
  STRING_LEN = 'STRING_LEN',
  STRING_SUBSTRING = 'STRING_SUBSTRING',
  STRING_INDEXOF = 'STRING_INDEXOF',
  STRING_SPLIT = 'STRING_SPLIT',
  STRING_SLICE = 'STRING_SLICE',
  STRING_CHARAT = 'STRING_CHARAT',
  STRING_TOUPPERCASE = 'STRING_TOUPPERCASE',
  STRING_TOLOWERCASE = 'STRING_TOLOWERCASE',
  
  // Universal operations
  LENGTH = 'LENGTH',
  TO_STRING = 'TO_STRING',
  
  // Type operations
  JSON_PARSE = 'JSON_PARSE',
  TYPEOF = 'TYPEOF',
  
  // Arithmetic
  ADD = 'ADD',
  SUB = 'SUB',
  MUL = 'MUL',
  DIV = 'DIV',
  MOD = 'MOD',
  
  // Unary operations
  UNARY_MINUS = 'UNARY_MINUS',
  UNARY_PLUS = 'UNARY_PLUS',
  INC = 'INC',  // Increment (++)
  DEC = 'DEC',  // Decrement (--)
  
  // Comparison
  EQ = 'EQ',
  NEQ = 'NEQ',
  LT = 'LT',
  GT = 'GT',
  LTE = 'LTE',
  GTE = 'GTE',
  EQ_STRICT = 'EQ_STRICT',
  NEQ_STRICT = 'NEQ_STRICT',
  
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
  
  // Loop control
  BREAK = 'BREAK',
  CONTINUE = 'CONTINUE',
  
  // Iteration
  ITER_START = 'ITER_START',
  ITER_NEXT = 'ITER_NEXT',
  ITER_END = 'ITER_END',
  
  // File operations
  FS_LIST_FILES = 'FS_LIST_FILES',
  FS_READ_FILE = 'FS_READ_FILE',
  FS_WRITE_FILE = 'FS_WRITE_FILE',
  
  // Object operations
  OBJECT_CREATE = 'OBJECT_CREATE',
  PROPERTY_GET = 'PROPERTY_GET',
  PROPERTY_SET = 'PROPERTY_SET',
  JSON_STRINGIFY = 'JSON_STRINGIFY',
  
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