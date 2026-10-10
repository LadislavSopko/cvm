import { describe, it, expect } from 'vitest';
import { OpCode } from './types.js';

const REMOVED = ["DUP","DUP2","SWAP","CONCAT","ARRAY_LEN","ARRAY_MAP_PROP","ARRAY_FILTER_PROP","STRING_LEN","STRING_REPLACE","JUMP_IF","CALL","GET","SET"];

describe('OpCode set', () => {
  it('the OpCode enum no longer contains the 13 removed members', () => {
    expect(Object.keys(OpCode).filter(name => REMOVED.includes(name))).toEqual([]);
  });
});
