import { describe, it, expect } from 'vitest';
import type { Program, Execution } from './types.js';

describe('types', () => {
  it('should export type definitions', () => {
    // Types are compile-time only, so we just verify the module can be imported
    expect(true).toBe(true);
  });

  it('should have correct structure for Program type', () => {
    const program: Program = {
      id: 'test',
      name: 'Test Program',
      source: 'test source',
      bytecode: [],
      created: new Date()
    };
    
    expect(program.id).toBe('test');
  });

  it('should have correct structure for Execution type', () => {
    const execution: Execution = {
      id: 'exec-1',
      programId: 'test',
      state: 'READY',
      pc: 0,
      stack: [],
      variables: {},
      created: new Date()
    };
    
    expect(execution.state).toBe('READY');
  });

});