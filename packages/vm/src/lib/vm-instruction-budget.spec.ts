import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VMManager } from './vm-manager.js';
import { compile } from '@cvm/parser';
import { VM } from './vm.js';

vi.mock('@cvm/storage', () => {
  const mockPrograms = new Map();
  const mockExecutions = new Map();
  const mockOutputs = new Map();

  const mockAdapter = {
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    isConnected: vi.fn().mockReturnValue(true),
    saveProgram: vi.fn().mockImplementation(async (program) => {
      mockPrograms.set(program.id, program);
    }),
    getProgram: vi.fn().mockImplementation(async (id) => {
      return mockPrograms.get(id);
    }),
    saveExecution: vi.fn().mockImplementation(async (execution) => {
      mockExecutions.set(execution.id, execution);
    }),
    getExecution: vi.fn().mockImplementation(async (id) => {
      return mockExecutions.get(id);
    }),
    appendOutput: vi.fn().mockImplementation(async (executionId, lines) => {
      const existing = mockOutputs.get(executionId) || [];
      mockOutputs.set(executionId, [...existing, ...lines]);
    }),
    getOutput: vi.fn().mockImplementation(async (executionId) => {
      return mockOutputs.get(executionId) || [];
    }),
    deleteExecution: vi.fn().mockImplementation(async (executionId) => {
      mockExecutions.delete(executionId);
    })
  };

  return {
    StorageFactory: {
      create: vi.fn().mockReturnValue(mockAdapter)
    }
  };
});

const BUDGET_MESSAGE = 'Instruction budget exceeded: more than 50 instructions without reaching CC() (possible infinite loop)';

function compiled(body: string) {
  const result = compile(`function main() {\n${body}\n}`);
  expect(result.errors).toHaveLength(0);
  return result.bytecode;
}

describe('instruction budget between two CC() calls', () => {
  beforeEach(() => vi.clearAllMocks());

  it('a loop without CC that exceeds maxInstructions stops with status error and the budget message', () => {
    const state = new VM({ maxInstructions: 50 }).execute(compiled('let i = 0;\nwhile (i < 1000) { i = i + 1; }'));
    expect(state.status).toBe('error');
    expect(state.error).toBe(BUDGET_MESSAGE);
  });

  it('a loop with a CC inside each iteration runs past maxInstructions in total because the budget resets at every CC', async () => {
    const manager = new VMManager(undefined, undefined, { maxInstructions: 100 });
    await manager.initialize();
    await manager.loadProgram('budget-cc', 'function main() { let i = 0; while (i < 50) { CC("x"); i = i + 1; } return i; }');
    await manager.startExecution('budget-cc', 'budget-cc-1');
    let next = await manager.getNext('budget-cc-1');
    let rounds = 0;
    while (next.type === 'waiting') {
      next = await manager.reportCCResult('budget-cc-1', 'ok');
      rounds++;
    }
    expect(rounds).toBe(50);
    expect(next).toEqual({ type: 'completed', message: 'Execution completed', result: 50 });
  });

  it('maxInstructions 0 disables the budget', () => {
    const state = new VM({ maxInstructions: 0 }).execute(compiled('let i = 0;\nwhile (i < 1000) { i = i + 1; }\nreturn i;'));
    expect(state.status).toBe('complete');
    expect(state.returnValue).toBe(1000);
  });

  it('VMManager passes maxInstructions to every VM it creates', async () => {
    const manager = new VMManager(undefined, undefined, { maxInstructions: 50 });
    await manager.initialize();
    await manager.loadProgram('budget-loop', 'function main() { let i = 0; while (i < 1000) { i = i + 1; } }');
    await manager.startExecution('budget-loop', 'budget-loop-1');
    expect(await manager.getNext('budget-loop-1')).toEqual({ type: 'error', error: BUDGET_MESSAGE });

    await manager.loadProgram('budget-resume', 'function main() { CC("go"); let i = 0; while (i < 1000) { i = i + 1; } }');
    await manager.startExecution('budget-resume', 'budget-resume-1');
    expect((await manager.getNext('budget-resume-1')).type).toBe('waiting');
    (manager as any).vms.clear();
    expect(await manager.reportCCResult('budget-resume-1', 'ok')).toEqual({ type: 'error', error: BUDGET_MESSAGE });
  });
});
