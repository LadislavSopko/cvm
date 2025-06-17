import { VM, VMState } from './vm.js';
import { compile } from '@cvm/parser';
import { StorageAdapter, StorageFactory } from '@cvm/storage';
import { Program, Execution, CVMValue } from '@cvm/types';

export interface ExecutionResult {
  type: 'completed' | 'waiting' | 'error';
  message?: string;
  error?: string;
}

export interface ExecutionStatus {
  id: string;
  state: 'READY' | 'RUNNING' | 'AWAITING_COGNITIVE_RESULT' | 'COMPLETED' | 'ERROR';
  pc: number;
  stack: CVMValue[];
  variables: Record<string, CVMValue>;
}

/**
 * High-level VM manager that encapsulates all execution details
 * This is the public API that other packages (like MCP server) should use
 */
export class VMManager {
  private vms: Map<string, VM> = new Map();
  private storage: StorageAdapter;
  
  constructor(storageAdapter?: StorageAdapter) {
    if (storageAdapter) {
      this.storage = storageAdapter;
    } else {
      // Create default storage from environment for backward compatibility
      this.storage = StorageFactory.create();
    }
  }
  
  /**
   * Initialize the VMManager (connect to database)
   */
  async initialize(): Promise<void> {
    await this.storage.connect();
  }
  
  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    await this.storage.disconnect();
    this.vms.clear();
  }

  /**
   * Load and compile a program from source code
   */
  async loadProgram(programId: string, source: string): Promise<void> {
    const compileResult = compile(source);
    
    if (!compileResult.success) {
      throw new Error(`Compilation failed: ${compileResult.errors.join(', ')}`);
    }

    const program: Program = {
      id: programId,
      name: programId,
      source,
      bytecode: compileResult.bytecode, // VM decides internal format
      created: new Date()
    };

    await this.storage.saveProgram(program);
  }

  /**
   * Start execution of a loaded program
   */
  async startExecution(programId: string, executionId: string): Promise<void> {
    const program = await this.storage.getProgram(programId);
    if (!program) {
      throw new Error(`Program not found: ${programId}`);
    }

    const execution: Execution = {
      id: executionId,
      programId,
      state: 'READY',
      pc: 0,
      stack: [],
      variables: {},
      created: new Date()
    };

    await this.storage.saveExecution(execution);
    
    // Create VM instance for this execution
    const vm = new VM();
    this.vms.set(executionId, vm);
  }

  /**
   * Get next action from execution (Claude polls this)
   * This is READ-ONLY - just returns current state
   */
  async getNext(executionId: string): Promise<ExecutionResult> {
    const execution = await this.storage.getExecution(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    // Check if we need to initialize execution
    if (execution.state === 'READY') {
      // First time - need to start execution
      const program = await this.storage.getProgram(execution.programId);
      if (!program) {
        throw new Error(`Program not found: ${execution.programId}`);
      }

      let vm = this.vms.get(executionId);
      if (!vm) {
        vm = new VM();
        this.vms.set(executionId, vm);
      }

      // Start execution
      const initialState: Partial<VMState> = {
        pc: 0,
        stack: [],
        variables: new Map(),
        output: []
      };

      const state = vm.execute(program.bytecode, initialState);

      // Extract and save output separately
      if (state.output.length > 0) {
        await this.storage.appendOutput(executionId, state.output);
      }

      // Save state (without output)
      execution.pc = state.pc;
      execution.stack = state.stack;
      execution.variables = Object.fromEntries(state.variables);

      if (state.status === 'complete') {
        execution.state = 'COMPLETED';
        await this.storage.saveExecution(execution);
        this.vms.delete(executionId);
        
        return {
          type: 'completed',
          message: 'Execution completed'
        };
      } else if (state.status === 'waiting_cc') {
        execution.state = 'AWAITING_COGNITIVE_RESULT';
        execution.ccPrompt = state.ccPrompt;
        await this.storage.saveExecution(execution);
        
        return {
          type: 'waiting',
          message: state.ccPrompt || 'Waiting for input'
        };
      } else if (state.status === 'error') {
        execution.state = 'ERROR';
        execution.error = state.error;
        await this.storage.saveExecution(execution);
        this.vms.delete(executionId);
        
        return {
          type: 'error',
          error: state.error
        };
      }
    }

    // Not ready state - check current execution state
    if (execution.state === 'COMPLETED') {
      return {
        type: 'completed',
        message: 'Execution completed'
      };
    } else if (execution.state === 'ERROR') {
      return {
        type: 'error',
        error: execution.error || 'Unknown error'
      };
    } else if (execution.state === 'AWAITING_COGNITIVE_RESULT') {
      return {
        type: 'waiting',
        message: execution.ccPrompt || 'Waiting for input'
      };
    }

    throw new Error(`Unexpected execution state: ${execution.state}`);
  }

  /**
   * Report result from cognitive operation and continue execution
   */
  async reportCCResult(executionId: string, result: string): Promise<void> {
    const execution = await this.storage.getExecution(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    const program = await this.storage.getProgram(execution.programId);
    if (!program) {
      throw new Error(`Program not found: ${execution.programId}`);
    }

    let vm = this.vms.get(executionId);
    if (!vm) {
      vm = new VM();
      this.vms.set(executionId, vm);
    }

    // Create current state from saved execution
    const currentState: VMState = {
      pc: execution.pc,
      stack: execution.stack,
      variables: new Map(Object.entries(execution.variables)),
      status: 'waiting_cc' as const,
      output: [], // Start with empty output for resumed execution
      ccPrompt: undefined,
      iterators: [] // TODO: persist iterators in future
    };

    // Resume execution - this pushes result to stack and continues
    const newState = vm.resume(currentState, result, program.bytecode);
    
    // Extract and save any new output
    if (newState.output.length > 0) {
      await this.storage.appendOutput(executionId, newState.output);
    }
    
    // Update execution state (without output)
    execution.pc = newState.pc;
    execution.stack = newState.stack;
    execution.variables = Object.fromEntries(newState.variables);
    
    if (newState.status === 'complete') {
      execution.state = 'COMPLETED';
      this.vms.delete(executionId);
    } else if (newState.status === 'error') {
      execution.state = 'ERROR';
      execution.error = newState.error;
      this.vms.delete(executionId);
    } else if (newState.status === 'waiting_cc') {
      // Hit another CC immediately
      execution.state = 'AWAITING_COGNITIVE_RESULT';
      execution.ccPrompt = newState.ccPrompt;
    } else {
      execution.state = 'RUNNING';
    }
    
    await this.storage.saveExecution(execution);
  }

  /**
   * Get current execution status
   */
  async getExecutionStatus(executionId: string): Promise<ExecutionStatus> {
    const execution = await this.storage.getExecution(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    return {
      id: execution.id,
      state: execution.state,
      pc: execution.pc,
      stack: execution.stack,
      variables: execution.variables
    };
  }

  /**
   * Get output for an execution
   */
  async getExecutionOutput(executionId: string): Promise<string[]> {
    return await this.storage.getOutput(executionId);
  }
}