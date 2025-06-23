import { VM, VMState } from './vm.js';
import { compile } from '@cvm/parser';
import { StorageAdapter, StorageFactory } from '@cvm/storage';
import { Program, Execution, CVMValue } from '@cvm/types';
import { FileSystemService, SandboxedFileSystem } from './file-system.js';

export interface ExecutionResult {
  type: 'completed' | 'waiting' | 'error';
  message?: string;
  error?: string;
  result?: CVMValue;
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
  private fileSystem: FileSystemService;
  
  constructor(storageAdapter?: StorageAdapter, fileSystem?: FileSystemService) {
    if (storageAdapter) {
      this.storage = storageAdapter;
    } else {
      // Create default storage from environment for backward compatibility
      this.storage = StorageFactory.create();
    }
    this.fileSystem = fileSystem || new SandboxedFileSystem();
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
      execution.iterators = state.iterators;

      if (state.status === 'complete') {
        execution.state = 'COMPLETED';
        
        // Save return value if present
        if (state.returnValue !== undefined) {
          execution.returnValue = state.returnValue;
        }
        
        await this.storage.saveExecution(execution);
        this.vms.delete(executionId);
        
        return {
          type: 'completed',
          message: 'Execution completed',
          result: state.returnValue
        };
      } else if (state.status === 'waiting_cc') {
        execution.state = 'AWAITING_COGNITIVE_RESULT';
        execution.ccPrompt = state.ccPrompt;
        await this.storage.saveExecution(execution);
        
        return {
          type: 'waiting',
          message: state.ccPrompt || 'Waiting for input'
        };
      } else if (state.status === 'waiting_fs') {
        // Handle file system operation synchronously
        if (state.fsOperation) {
          const fsResult = this.fileSystem.listFiles(state.fsOperation.path, state.fsOperation.options);
          
          // Resume VM with the result
          const resumedState = vm.resumeWithFsResult(state, fsResult, program.bytecode);
          
          // Extract and save output
          if (resumedState.output.length > 0) {
            await this.storage.appendOutput(executionId, resumedState.output);
          }
          
          // Update execution state
          execution.pc = resumedState.pc;
          execution.stack = resumedState.stack;
          execution.variables = Object.fromEntries(resumedState.variables);
          execution.iterators = resumedState.iterators;
          
          // Check final status after resume
          if (resumedState.status === 'complete') {
            execution.state = 'COMPLETED';
            if (resumedState.returnValue !== undefined) {
              execution.returnValue = resumedState.returnValue;
            }
            await this.storage.saveExecution(execution);
            this.vms.delete(executionId);
            
            return {
              type: 'completed',
              message: 'Execution completed',
              result: resumedState.returnValue
            };
          } else if (resumedState.status === 'error') {
            execution.state = 'ERROR';
            execution.error = resumedState.error;
            await this.storage.saveExecution(execution);
            this.vms.delete(executionId);
            
            return {
              type: 'error',
              error: resumedState.error
            };
          } else if (resumedState.status === 'waiting_cc') {
            execution.state = 'AWAITING_COGNITIVE_RESULT';
            execution.ccPrompt = resumedState.ccPrompt;
            await this.storage.saveExecution(execution);
            
            return {
              type: 'waiting',
              message: resumedState.ccPrompt || 'Waiting for input'
            };
          }
          // If still running or waiting_fs again, we need to handle it
          // For now, save state and return to process next iteration
          execution.state = 'RUNNING';
          await this.storage.saveExecution(execution);
          
          // Recursively call getNext to continue processing
          return this.getNext(executionId);
        }
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
      iterators: execution.iterators || []
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
    execution.iterators = newState.iterators;
    
    if (newState.status === 'complete') {
      execution.state = 'COMPLETED';
      
      // Save return value if present
      if (newState.returnValue !== undefined) {
        execution.returnValue = newState.returnValue;
      }
      
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

  /**
   * List all executions
   */
  async listExecutions(): Promise<Execution[]> {
    return await this.storage.listExecutions();
  }

  /**
   * Get current execution ID
   */
  async getCurrentExecutionId(): Promise<string | null> {
    return await this.storage.getCurrentExecutionId();
  }

  /**
   * Set current execution ID
   */
  async setCurrentExecutionId(executionId: string | null): Promise<void> {
    return await this.storage.setCurrentExecutionId(executionId);
  }

  /**
   * Delete an execution
   */
  async deleteExecution(executionId: string): Promise<void> {
    return await this.storage.deleteExecution(executionId);
  }

  /**
   * Get execution with attempt tracking
   */
  async getExecutionWithAttempts(executionId: string): Promise<Execution & { attempts?: number; firstAttemptAt?: Date; lastAttemptAt?: Date }> {
    const execution = await this.storage.getExecution(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    // For now, return execution as-is. In future, we can track attempts
    return execution;
  }

  /**
   * List all programs
   */
  async listPrograms(): Promise<Program[]> {
    return await this.storage.listPrograms();
  }

  /**
   * Delete a program
   */
  async deleteProgram(programId: string): Promise<void> {
    return await this.storage.deleteProgram(programId);
  }

  /**
   * Restart a program (create new execution and set as current)
   */
  async restartExecution(programId: string, executionId?: string): Promise<string> {
    // Generate execution ID if not provided
    const execId = executionId || `${programId}-${Date.now()}`;
    
    // Start the execution
    await this.startExecution(programId, execId);
    
    // Set as current execution
    await this.setCurrentExecutionId(execId);
    
    return execId;
  }
}