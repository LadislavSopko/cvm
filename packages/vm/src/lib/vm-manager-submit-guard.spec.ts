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

const CC_SOURCE = `
  function main() {
    const answer = CC("prompt");
    console.log(answer);
  }
  main();
`;

describe('reportCCResult state guard', () => {
  let vmManager: VMManager;

  beforeEach(async () => {
    vi.clearAllMocks();
    vmManager = new VMManager();
    await vmManager.initialize();
  });

  async function setupExecution(targetState: string): Promise<string> {
    const progId = `prog-${targetState}`;
    const execId = `exec-${targetState}`;

    await vmManager.loadProgram(progId, CC_SOURCE);
    await vmManager.startExecution(progId, execId);

    if (targetState === 'READY') {
      const { StorageFactory } = await import('@cvm/storage');
      const storage = StorageFactory.create();
      const execution = await storage.getExecution(execId);
      execution.state = 'READY';
      await storage.saveExecution(execution);
      return execId;
    }

    if (targetState === 'RUNNING') {
      const { StorageFactory } = await import('@cvm/storage');
      const storage = StorageFactory.create();
      const execution = await storage.getExecution(execId);
      execution.state = 'RUNNING';
      await storage.saveExecution(execution);
      return execId;
    }

    const result = await vmManager.getNext(execId);
    expect(result.type).toBe('waiting');

    if (targetState === 'AWAITING_COGNITIVE_RESULT') {
      return execId;
    }

    if (targetState === 'COMPLETED') {
      await vmManager.reportCCResult(execId, 'answer');
      const next = await vmManager.getNext(execId);
      expect(next.type).toBe('completed');
      return execId;
    }

    if (targetState === 'ERROR') {
      const { StorageFactory } = await import('@cvm/storage');
      const storage = StorageFactory.create();
      const execution = await storage.getExecution(execId);
      execution.state = 'ERROR';
      execution.error = 'simulated error';
      await storage.saveExecution(execution);
      return execId;
    }

    throw new Error(`Unknown target state: ${targetState}`);
  }

  it('rejects with error containing AWAITING_COGNITIVE_RESULT when execution state is COMPLETED', async () => {
    const execId = await setupExecution('COMPLETED');
    await expect(vmManager.reportCCResult(execId, 'late-submit'))
      .rejects.toThrow('AWAITING_COGNITIVE_RESULT');
  });

  it('rejects with error containing AWAITING_COGNITIVE_RESULT when execution state is READY', async () => {
    const execId = await setupExecution('READY');
    await expect(vmManager.reportCCResult(execId, 'early-submit'))
      .rejects.toThrow('AWAITING_COGNITIVE_RESULT');
  });

  it('rejects with error containing AWAITING_COGNITIVE_RESULT when execution state is ERROR', async () => {
    const execId = await setupExecution('ERROR');
    await expect(vmManager.reportCCResult(execId, 'error-submit'))
      .rejects.toThrow('AWAITING_COGNITIVE_RESULT');
  });

  it('rejects with error containing AWAITING_COGNITIVE_RESULT when execution state is RUNNING', async () => {
    const execId = await setupExecution('RUNNING');
    await expect(vmManager.reportCCResult(execId, 'running-submit'))
      .rejects.toThrow('AWAITING_COGNITIVE_RESULT');
  });

  it('resolves successfully when execution state is AWAITING_COGNITIVE_RESULT', async () => {
    const execId = await setupExecution('AWAITING_COGNITIVE_RESULT');
    await expect(vmManager.reportCCResult(execId, 'valid-submit'))
      .resolves.not.toThrow();
  });
});
