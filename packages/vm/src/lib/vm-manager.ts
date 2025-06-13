import { VM, VMState } from './vm.js';
import { compile } from '@cvm/parser';
import { MongoDBAdapter } from '@cvm/mongodb';
import { Program, Execution } from '@cvm/types';

export interface ExecutionResult {
  type: 'completed' | 'waiting' | 'error';
  message?: string;
  error?: string;
}

export interface ExecutionStatus {
  id: string;
  state: 'ready' | 'running' | 'completed' | 'error';
  pc: number;
  stack: any[];
  variables: Record<string, any>;
  output: string[];
  history: any[];
}

/**
 * High-level VM manager that encapsulates all execution details
 * This is the public API that other packages (like MCP server) should use
 */
export class VMManager {
  private vms: Map<string, VM> = new Map();
  private db: MongoDBAdapter;
  
  constructor() {
    // VMManager manages its own persistence based on environment
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cvm';
    this.db = new MongoDBAdapter(mongoUri);
  }
  
  /**
   * Initialize the VMManager (connect to database)
   */
  async initialize(): Promise<void> {
    await this.db.connect();
  }
  
  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    await this.db.disconnect();
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

    await this.db.saveProgram(program);
  }

  /**
   * Start execution of a loaded program
   */
  async startExecution(programId: string, executionId: string): Promise<void> {
    const program = await this.db.getProgram(programId);
    if (!program) {
      throw new Error(`Program not found: ${programId}`);
    }

    const execution: Execution = {
      id: executionId,
      programId,
      state: 'ready',
      pc: 0,
      stack: [],
      variables: {},
      output: [],
      created: new Date()
    };

    await this.db.saveExecution(execution);
    
    // Create VM instance for this execution
    const vm = new VM();
    this.vms.set(executionId, vm);
  }

  /**
   * Get next action from execution (Claude polls this)
   * This is READ-ONLY - just returns current state
   */
  async getNext(executionId: string): Promise<ExecutionResult> {
    const execution = await this.db.getExecution(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    // Check if we need to initialize execution
    if (execution.state === 'ready') {
      // First time - need to start execution
      const program = await this.db.getProgram(execution.programId);
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

      // Save state
      execution.pc = state.pc;
      execution.stack = state.stack;
      execution.variables = Object.fromEntries(state.variables);
      execution.output = state.output;

      if (state.status === 'complete') {
        execution.state = 'completed';
        await this.db.saveExecution(execution);
        this.vms.delete(executionId);
        
        return {
          type: 'completed',
          message: 'Execution completed'
        };
      } else if (state.status === 'waiting_cc') {
        execution.state = 'running'; // Running but waiting for CC input
        await this.db.saveExecution(execution);
        
        // Store CC prompt in memory
        const vmState = {
          status: state.status,
          ccPrompt: state.ccPrompt
        };
        this.vms.set(executionId + '_state', vmState as any);
        
        return {
          type: 'waiting',
          message: state.ccPrompt || 'Waiting for input'
        };
      } else if (state.status === 'error') {
        execution.state = 'error';
        execution.error = state.error;
        await this.db.saveExecution(execution);
        this.vms.delete(executionId);
        
        return {
          type: 'error',
          error: state.error
        };
      }
    }

    // Not ready state - check current execution state
    if (execution.state === 'completed') {
      return {
        type: 'completed',
        message: 'Execution completed'
      };
    } else if (execution.state === 'error') {
      return {
        type: 'error',
        error: execution.error || 'Unknown error'
      };
    } else if (execution.state === 'running') {
      // Check if we have a stored CC prompt
      const vmState = this.vms.get(executionId + '_state') as any;
      if (vmState && vmState.status === 'waiting_cc') {
        return {
          type: 'waiting',
          message: vmState.ccPrompt || 'Waiting for input'
        };
      }
      
      // Otherwise, execution is in progress (shouldn't happen in normal flow)
      return {
        type: 'waiting',
        message: 'Execution in progress'
      };
    }

    throw new Error(`Unexpected execution state: ${execution.state}`);
  }

  /**
   * Report result from cognitive operation and continue execution
   */
  async reportCCResult(executionId: string, result: string): Promise<void> {
    const execution = await this.db.getExecution(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    const program = await this.db.getProgram(execution.programId);
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
      output: execution.output,
      ccPrompt: undefined
    };

    // Save history
    await this.db.saveHistory({
      executionId,
      step: -1,
      pc: execution.pc,
      instruction: 'CC_RESULT',
      stack: [...execution.stack, result],
      variables: execution.variables,
      timestamp: new Date()
    });

    // Resume execution - this pushes result to stack and continues
    const newState = vm.resume(currentState, result, program.bytecode);
    
    // Update execution state
    execution.pc = newState.pc;
    execution.stack = newState.stack;
    execution.variables = Object.fromEntries(newState.variables);
    execution.output = newState.output;
    
    if (newState.status === 'complete') {
      execution.state = 'completed';
      this.vms.delete(executionId);
      this.vms.delete(executionId + '_state');
    } else if (newState.status === 'error') {
      execution.state = 'error';
      execution.error = newState.error;
      this.vms.delete(executionId);
      this.vms.delete(executionId + '_state');
    } else if (newState.status === 'waiting_cc') {
      // Hit another CC immediately
      execution.state = 'running';
      // Store the CC prompt in memory
      const vmState = {
        status: newState.status,
        ccPrompt: newState.ccPrompt
      };
      this.vms.set(executionId + '_state', vmState as any);
    } else {
      execution.state = 'running';
      // Clear any stored state
      this.vms.delete(executionId + '_state');
    }
    
    await this.db.saveExecution(execution);
  }

  /**
   * Get current execution status
   */
  async getExecutionStatus(executionId: string): Promise<ExecutionStatus> {
    const execution = await this.db.getExecution(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    const history = await this.db.getHistory(executionId);

    return {
      id: execution.id,
      state: execution.state,
      pc: execution.pc,
      stack: execution.stack,
      variables: execution.variables,
      output: execution.output,
      history: history.map(h => ({
        step: h.step,
        pc: h.pc,
        instruction: h.instruction,
        stack: h.stack,
        variables: h.variables,
        timestamp: h.timestamp
      }))
    };
  }
}