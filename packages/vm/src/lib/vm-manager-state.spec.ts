import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VMManager } from './vm-manager.js';
import { VM, VMState } from './vm.js';
import { OpCode } from '@cvm/parser';

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

describe('stored programs across opcode removals', () => {
  it('stored bytecode runs by opcode name, so removing enum members needs no recompilation', async () => {
    const vmManager = new VMManager();
    await vmManager.initialize();
    const manager = vmManager as any;
    await manager.storage.saveProgram({
      id: 'legacy',
      name: 'legacy',
      source: 'function main() { return 0; }',
      bytecode: JSON.parse('[{"op":"PUSH","arg":"from stored bytecode"},{"op":"RETURN"},{"op":"HALT"}]'),
      created: new Date()
    });
    await vmManager.startExecution('legacy', 'legacy-exec');
    const result = await vmManager.getNext('legacy-exec');
    expect(result).toEqual({ type: 'completed', message: 'Execution completed', result: 'from stored bytecode' });
    expect(Object.entries(OpCode).every(([name, value]) => name === value)).toBe(true);
  });
});

describe('applyVMState maps a VM state onto the execution', () => {
  let vmManager: VMManager;
  let manager: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vmManager = new VMManager();
    manager = vmManager as any;
    await vmManager.initialize();
  });

  async function freshExecution(id: string) {
    await vmManager.loadProgram('prog-' + id, 'function main() { CC("q"); }');
    await vmManager.startExecution('prog-' + id, id);
    manager.vms.set(id, new VM());
    return manager.storage.getExecution(id);
  }

  function vmState(partial: Partial<VMState>): VMState {
    return { ...new VM().createInitialState(), ...partial };
  }

  it('applyVMState maps complete to COMPLETED with the return value and drops the cached VM', async () => {
    const execution = await freshExecution('apply-complete');
    const result = await manager.applyVMState('apply-complete', execution, vmState({ status: 'complete', returnValue: 'done' }));
    expect(result).toEqual({ type: 'completed', message: 'Execution completed', result: 'done' });
    expect(execution.state).toBe('COMPLETED');
    expect(execution.returnValue).toBe('done');
    expect(manager.vms.has('apply-complete')).toBe(false);
  });

  it('applyVMState maps error to ERROR with the message', async () => {
    const execution = await freshExecution('apply-error');
    const result = await manager.applyVMState('apply-error', execution, vmState({ status: 'error', error: 'boom' }));
    expect(result).toEqual({ type: 'error', error: 'boom' });
    expect(execution.state).toBe('ERROR');
    expect(execution.error).toBe('boom');
    expect(manager.vms.has('apply-error')).toBe(false);
  });

  it('applyVMState maps waiting_cc to AWAITING_COGNITIVE_RESULT with the prompt', async () => {
    const execution = await freshExecution('apply-wait');
    const result = await manager.applyVMState('apply-wait', execution, vmState({ status: 'waiting_cc', ccPrompt: 'next?' }));
    expect(result).toEqual({ type: 'waiting', message: 'next?' });
    expect(execution.state).toBe('AWAITING_COGNITIVE_RESULT');
    expect(execution.ccPrompt).toBe('next?');
    expect(manager.vms.has('apply-wait')).toBe(true);
  });
});
