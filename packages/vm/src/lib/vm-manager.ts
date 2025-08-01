import { VM, VMState } from './vm.js';
import { compile } from '@cvm/parser';
import { StorageAdapter, StorageFactory } from '@cvm/storage';
import { Program, Execution, CVMValue, CVMArray, CVMObject, CVMArrayRef, CVMObjectRef, isCVMArrayRef, isCVMObjectRef } from '@cvm/types';
import { FileSystemService, SandboxedFileSystem } from './file-system.js';
import { VMHeap, createVMHeap } from './vm-heap.js';

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
      const errorMessages = compileResult.errors.map(err => 
        `${err.message} at line ${err.line}, column ${err.character}`
      );
      throw new Error(`Compilation failed: ${errorMessages.join('; ')}`);
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
    if (execution.state === 'READY' || execution.state === 'RUNNING') {
      // Either first time or continuing after CC
      const program = await this.storage.getProgram(execution.programId);
      if (!program) {
        throw new Error(`Program not found: ${execution.programId}`);
      }

      let vm = this.vms.get(executionId);
      if (!vm) {
        vm = new VM();
        this.vms.set(executionId, vm);
      }

      // Prepare state - either initial or restored from execution
      const initialState: Partial<VMState> = execution.state === 'READY' ? {
        pc: 0,
        stack: [],
        variables: new Map(),
        output: []
      } : this.deserializeVMState(execution);

      const state = vm.execute(program.bytecode, initialState, this.fileSystem);

      // Extract and save output separately
      if (state.output.length > 0) {
        await this.storage.appendOutput(executionId, state.output);
      }

      // Save state (without output)
      const serializedState = this.serializeVMState(state);
      Object.assign(execution, serializedState);

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
      ...this.deserializeVMState(execution),
      status: 'waiting_cc' as const,
      output: [], // Start with empty output for resumed execution
      ccPrompt: undefined
    };

    // Resume execution - this pushes result to stack and continues
    const newState = vm.resume(currentState, result, program.bytecode, this.fileSystem);
    
    // Extract and save any new output
    if (newState.output.length > 0) {
      await this.storage.appendOutput(executionId, newState.output);
    }
    
    // Update execution state (without output)
    const serializedState = this.serializeVMState(newState);
    Object.assign(execution, serializedState);
    
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
      // For any other state, keep as RUNNING
      // getNext will handle it when called
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
    this.vms.delete(executionId); // CRITICAL: Remove from cache!
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

  /**
   * Serialize heap to storage format
   */
  private serializeHeap(heap: VMHeap): { objects: Record<number, { type: 'array' | 'object'; data: CVMValue }>; nextId: number } {
    // Define replacer inside serializeHeap
    const replacer = (key: string, value: any) => {
      if (isCVMArrayRef(value) || isCVMObjectRef(value)) {
        return { $ref: value.id };
      }
      return value;
    };

    const heapObjects: Record<number, { type: 'array' | 'object'; data: any }> = {};
    heap.objects.forEach((heapObj, id) => {
      heapObjects[id] = {
        type: heapObj.type,
        // Serialize each object's data individually with replacer
        data: JSON.parse(JSON.stringify(heapObj.data, replacer))
      };
    });
    
    return {
      objects: heapObjects,
      nextId: heap.nextId
    };
  }

  /**
   * Deserialize heap from storage format
   */
  private deserializeHeap(heapData: { objects: Record<number, { type: 'array' | 'object'; data: CVMValue }>; nextId: number }): VMHeap {
    const heap = createVMHeap();
    heap.nextId = heapData.nextId;
    
    // First pass: restore all heap objects without fixing references
    for (const idStr in heapData.objects) {
      const id = parseInt(idStr, 10);
      const serializedObj = heapData.objects[id];
      heap.objects.set(id, {
        id,
        type: serializedObj.type,
        data: serializedObj.data as (CVMArray | CVMObject) // Still contains $ref stubs
      });
    }
    
    // Second pass: fix all $ref stubs to actual CVM references
    heap.objects.forEach((heapObj) => {
      heapObj.data = this.restoreReferences(heapObj.data, heap) as (CVMArray | CVMObject);
    });
    
    return heap;
  }

  /**
   * Serialize VM state for storage
   */
  private serializeVMState(state: VMState): any {
    return {
      pc: state.pc,
      stack: state.stack,
      variables: Object.fromEntries(state.variables),
      heap: state.heap ? this.serializeHeap(state.heap) : undefined,
      iterators: state.iterators,
      status: state.status,
      error: state.error,
      ccPrompt: state.ccPrompt,
      output: state.output,
      returnValue: state.returnValue
    };
  }

  /**
   * Deserialize VM state from storage
   */
  private deserializeVMState(data: any): VMState {
    return {
      pc: data.pc || 0,
      stack: data.stack || [],
      variables: new Map(Object.entries(data.variables || {})),
      heap: data.heap ? this.deserializeHeap(data.heap) : createVMHeap(),
      iterators: data.iterators || [],
      status: data.status || 'running',
      error: data.error || null,
      ccPrompt: data.ccPrompt || null,
      output: data.output || [],
      returnValue: data.returnValue
    };
  }

  private restoreReferences(value: any, heap: VMHeap): any {
    if (value && typeof value === 'object' && value.$ref !== undefined) {
      // Convert $ref stub back to proper CVM reference
      const targetObj = heap.objects.get(value.$ref);
      if (targetObj?.type === 'array') {
        return { type: 'array-ref', id: value.$ref } as CVMArrayRef;
      } else if (targetObj?.type === 'object') {
        return { type: 'object-ref', id: value.$ref } as CVMObjectRef;
      }
      return value; // Invalid reference, keep as-is
    }
    
    // Recursively process arrays and objects
    if (Array.isArray(value)) {
      return value.map(item => this.restoreReferences(item, heap));
    }
    
    if (value && typeof value === 'object') {
      const result: any = {};
      for (const key in value) {
        result[key] = this.restoreReferences(value[key], heap);
      }
      return result;
    }
    
    return value;
  }
}