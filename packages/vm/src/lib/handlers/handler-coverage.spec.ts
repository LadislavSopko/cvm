import { describe, it, expect } from 'vitest';
import { OpCode } from '@cvm/parser';
import { handlers } from './index.js';

const REMOVED = ["DUP","DUP2","SWAP","CONCAT","ARRAY_LEN","ARRAY_MAP_PROP","ARRAY_FILTER_PROP","STRING_LEN","STRING_REPLACE","JUMP_IF","CALL","GET","SET"];

describe('handler map coverage', () => {
  it('the VM handler map has a handler for every remaining OpCode and none for removed names', () => {
    const missing = Object.values(OpCode).filter(op => !handlers[op as OpCode]);
    const stale = Object.keys(handlers).filter(name => REMOVED.includes(name));
    expect(missing).toEqual([]);
    expect(stale).toEqual([]);
  });
});
