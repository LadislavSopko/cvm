import { describe, it, expect } from 'vitest';
import { compile } from '@cvm/parser';
import { VM } from '@cvm/vm';

describe('TypeScript to Result Pipeline', () => {
  const vm = new VM();

  it('should compile and execute object property access', () => {
    const source = `
      function main() {
        const obj = { "key": "value" };
        return obj["key"];
      }
    `;
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const result = vm.execute(compileResult.bytecode);
    expect(result.status).toBe('complete');
    expect(result.returnValue).toBe("value");
  });
  
  it('should handle complex nested accessors', () => {
    const source = `
      function main() {
        const data = { "users": [{ "name": "Alice" }] };
        return data["users"][0]["name"];
      }
    `;
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const result = vm.execute(compileResult.bytecode);
    expect(result.status).toBe('complete');
    expect(result.returnValue).toBe("Alice");
  });
});