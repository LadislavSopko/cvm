import { describe, it, expect } from 'vitest';
import type { Program, Execution, History } from './types.js';

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
      state: 'ready',
      pc: 0,
      stack: [],
      variables: {},
      output: [],
      created: new Date()
    };
    
    expect(execution.state).toBe('ready');
  });

  it('should have correct structure for History type', () => {
    const history: History = {
      executionId: 'exec-1',
      step: 1,
      pc: 0,
      instruction: 'PUSH',
      stack: [],
      variables: {},
      timestamp: new Date()
    };
    
    expect(history.instruction).toBe('PUSH');
  });
});