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
   */
  async getNext(executionId: string): Promise<ExecutionResult> {
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

    // Update state to running if ready
    if (execution.state === 'ready') {
      execution.state = 'running';
      await this.db.saveExecution(execution);
    }

    // Execute with current state
    const initialState: Partial<VMState> = {
      pc: execution.pc,
      stack: execution.stack,
      variables: new Map(Object.entries(execution.variables)),
      output: execution.output
    };

    const state = vm.execute(program.bytecode, initialState);

    // Save updated state
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
      await this.db.saveExecution(execution);
      
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

    throw new Error('Unexpected execution state');
  }

  /**
   * Report result from cognitive operation
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

    // Create current state
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

    // Resume execution
    const newState = vm.resume(currentState, result, program.bytecode);
    
    // Update execution state
    execution.pc = newState.pc;
    execution.stack = newState.stack;
    execution.variables = Object.fromEntries(newState.variables);
    execution.output = newState.output;
    execution.state = newState.status === 'complete' ? 'completed' : 
                     newState.status === 'error' ? 'error' : 'running';
    
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