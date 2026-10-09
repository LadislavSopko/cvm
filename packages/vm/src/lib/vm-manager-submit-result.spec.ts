import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VMManager } from './vm-manager.js';

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

const TWO_CC_SOURCE = `
  function main() {
    var a = CC("first");
    var b = CC("second " + a);
    return b;
  }
`;

const NO_RETURN_SOURCE = `
  function main() {
    CC("only");
  }
`;

const FAIL_AFTER_SUBMIT_SOURCE = `
  function main() {
    var r = CC("q");
    var n = +r;
    var o = JSON.parse(n);
    return o;
  }
`;

describe('reportCCResult returns the next state', () => {
  let vmManager: VMManager;

  beforeEach(async () => {
    vi.clearAllMocks();
    vmManager = new VMManager();
    await vmManager.initialize();
  });

  async function startAndPause(progId: string, source: string): Promise<string> {
    const execId = 'exec-' + progId;
    await vmManager.loadProgram(progId, source);
    await vmManager.startExecution(progId, execId);
    const first = await vmManager.getNext(execId);
    expect(first.type).toBe('waiting');
    return execId;
  }

  it('returns type waiting with the next CC prompt when the program hits another CC', async () => {
    const execId = await startAndPause('sr-next', TWO_CC_SOURCE);
    const next = await vmManager.reportCCResult(execId, 'x');
    expect(next).toEqual({ type: 'waiting', message: 'second x' });
  });

  it('returns type completed with the program return value when the program finishes', async () => {
    const execId = await startAndPause('sr-done', TWO_CC_SOURCE);
    await vmManager.reportCCResult(execId, 'x');
    const done = await vmManager.reportCCResult(execId, 'end');
    expect(done.type).toBe('completed');
    expect(done.result).toBe('end');
  });

  it('returns type completed without result when main returns nothing', async () => {
    const execId = await startAndPause('sr-noret', NO_RETURN_SOURCE);
    const done = await vmManager.reportCCResult(execId, 'ok');
    expect(done.type).toBe('completed');
    expect(done.result).toBeUndefined();
  });

  it('returns type error with the error message when the program fails after the submit', async () => {
    const execId = await startAndPause('sr-err', FAIL_AFTER_SUBMIT_SOURCE);
    const res = await vmManager.reportCCResult(execId, '5');
    expect(res.type).toBe('error');
    expect(res.error).toContain('JSON_PARSE requires a string');
  });

  it('getNext after completion inside reportCCResult returns the program return value', async () => {
    const execId = await startAndPause('sr-keep', TWO_CC_SOURCE);
    await vmManager.reportCCResult(execId, 'x');
    await vmManager.reportCCResult(execId, 'end');
    const again = await vmManager.getNext(execId);
    expect(again).toEqual({ type: 'completed', message: 'Execution completed', result: 'end' });
  });

  it('getNext on a completed execution without return value returns completed and undefined result', async () => {
    const execId = await startAndPause('sr-keep-noret', NO_RETURN_SOURCE);
    await vmManager.reportCCResult(execId, 'ok');
    const again = await vmManager.getNext(execId);
    expect(again.type).toBe('completed');
    expect(again.result).toBeUndefined();
  });
});
