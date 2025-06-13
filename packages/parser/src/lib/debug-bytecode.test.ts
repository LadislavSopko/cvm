import { describe, it } from 'vitest';
import { Parser } from './parser.js';

describe('Debug Bytecode Generation', () => {
  it('should show bytecode for multiple CC calls', () => {
    const parser = new Parser();
    
    const source = `
function main() {
  const first = CC("First prompt");
  console.log("Got: " + first);
  const second = CC("Second prompt");
  console.log("Got: " + second);
}
`;

    const bytecode = parser.parse(source);
    
    console.log('\n=== Bytecode for multiple CC calls ===');
    bytecode.forEach((inst, index) => {
      console.log(`${index}: ${inst.op}${inst.arg !== undefined ? ` "${inst.arg}"` : ''}`);
    });
  });
});