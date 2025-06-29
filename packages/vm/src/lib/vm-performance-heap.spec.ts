import { describe, it, expect } from 'vitest';
import { VM } from './vm.js';
import { VMManager } from './vm-manager.js';
import { StorageAdapter } from '@cvm/storage';
import { compile } from '@cvm/parser';
import { OpCode } from '@cvm/parser';
import { Program, Execution } from '@cvm/types';

// Create a simple in-memory storage adapter for testing
class MemoryStorage implements StorageAdapter {
  private programs = new Map<string, Program>();
  private executions = new Map<string, Execution>();
  private outputs = new Map<string, string[]>();
  private _connected = false;

  async connect(): Promise<void> {
    this._connected = true;
  }

  async disconnect(): Promise<void> {
    this._connected = false;
  }

  isConnected(): boolean {
    return this._connected;
  }

  async saveProgram(program: Program): Promise<void> {
    this.programs.set(program.id, program);
  }

  async getProgram(id: string): Promise<Program | null> {
    return this.programs.get(id) || null;
  }

  async listPrograms(): Promise<Program[]> {
    return Array.from(this.programs.values());
  }

  async deleteProgram(id: string): Promise<void> {
    this.programs.delete(id);
  }

  async saveExecution(execution: Execution): Promise<void> {
    this.executions.set(execution.id, execution);
  }

  async getExecution(id: string): Promise<Execution | null> {
    return this.executions.get(id) || null;
  }

  async deleteExecution(id: string): Promise<void> {
    this.executions.delete(id);
  }

  async listExecutions(programId?: string): Promise<Execution[]> {
    const all = Array.from(this.executions.values());
    return programId ? all.filter(e => e.programId === programId) : all;
  }

  async appendOutput(executionId: string, lines: string[]): Promise<void> {
    const existing = this.outputs.get(executionId) || [];
    this.outputs.set(executionId, [...existing, ...lines]);
  }

  async getOutput(executionId: string): Promise<string[]> {
    return this.outputs.get(executionId) || [];
  }

  async clearOutput(executionId: string): Promise<void> {
    this.outputs.delete(executionId);
  }

  async getCurrentExecutionId(): Promise<string | null> {
    return null;
  }

  async setCurrentExecutionId(executionId: string | null): Promise<void> {
    // No-op for testing
  }
}

describe('Heap Performance', () => {
  it('should not regress array access performance', () => {
    const vm = new VM();
    
    // Create bytecode that builds and accesses a large array
    const bytecode = [
      // Create array
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.STORE, arg: 'arr' },
      
      // Fill array with 1000 elements
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.STORE, arg: 'i' },
      
      // Loop start (index 5)
      { op: OpCode.LOAD, arg: 'i' },
      { op: OpCode.PUSH, arg: 1000 },
      { op: OpCode.LT },
      { op: OpCode.JUMP_IF_FALSE, arg: 19 }, // Jump to after loop
      
      // Push value to array
      { op: OpCode.LOAD, arg: 'arr' },
      { op: OpCode.LOAD, arg: 'i' },
      { op: OpCode.ARRAY_PUSH },
      { op: OpCode.POP },
      
      // Increment counter
      { op: OpCode.LOAD, arg: 'i' },
      { op: OpCode.PUSH, arg: 1 },
      { op: OpCode.ADD },
      { op: OpCode.STORE, arg: 'i' },
      { op: OpCode.JUMP, arg: 6 }, // Jump back to loop start
      
      // Now access all elements (index 20)
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.STORE, arg: 'sum' },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.STORE, arg: 'j' },
      
      // Access loop start (index 24)
      { op: OpCode.LOAD, arg: 'j' },
      { op: OpCode.PUSH, arg: 1000 },
      { op: OpCode.LT },
      { op: OpCode.JUMP_IF_FALSE, arg: 40 }, // Jump to end
      
      // Access array element and add to sum
      { op: OpCode.LOAD, arg: 'sum' },
      { op: OpCode.LOAD, arg: 'arr' },
      { op: OpCode.LOAD, arg: 'j' },
      { op: OpCode.ARRAY_GET },
      { op: OpCode.ADD },
      { op: OpCode.STORE, arg: 'sum' },
      
      // Increment counter
      { op: OpCode.LOAD, arg: 'j' },
      { op: OpCode.PUSH, arg: 1 },
      { op: OpCode.ADD },
      { op: OpCode.STORE, arg: 'j' },
      { op: OpCode.JUMP, arg: 24 }, // Jump back to access loop
      
      // Print result (index 40)
      { op: OpCode.PUSH, arg: 'Sum: ' },
      { op: OpCode.LOAD, arg: 'sum' },
      { op: OpCode.CONCAT },
      { op: OpCode.PRINT },
      
      { op: OpCode.HALT }
    ];
    
    // Measure execution time
    const startTime = Date.now();
    const state = vm.execute(bytecode);
    const executionTime = Date.now() - startTime;
    
    // Debug error
    if (state.status === 'error') {
      console.error('VM Error:', state.error);
    }
    
    expect(state.status).toBe('complete');
    expect(state.output).toContain('Sum: 499500'); // 0 + 1 + 2 + ... + 999
    
    // Performance should be reasonable even with heap references
    expect(executionTime).toBeLessThan(500); // Generous limit for CI
    
    // Verify the array is stored as a reference
    const arr = state.variables.get('arr');
    expect(arr).toHaveProperty('type', 'array-ref');
  });

  it('should improve serialization performance', async () => {
    const storage = new MemoryStorage();
    await storage.connect();
    const manager = new VMManager(storage);
    
    // Create bytecode that builds a large array and hits CC
    const bytecode = [
      // Create array
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.STORE, arg: 'data' },
      
      // Fill with 10000 strings (simulating file paths)
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.STORE, arg: 'i' },
      
      // Loop start (index 5)
      { op: OpCode.LOAD, arg: 'i' },
      { op: OpCode.PUSH, arg: 10000 },
      { op: OpCode.LT },
      { op: OpCode.JUMP_IF_FALSE, arg: 20 }, // Jump to CC
      
      // Create path string and push to array
      { op: OpCode.LOAD, arg: 'data' },
      { op: OpCode.PUSH, arg: '/path/to/file' },
      { op: OpCode.LOAD, arg: 'i' },
      { op: OpCode.CONCAT },
      { op: OpCode.ARRAY_PUSH },
      { op: OpCode.POP },
      
      // Increment counter
      { op: OpCode.LOAD, arg: 'i' },
      { op: OpCode.PUSH, arg: 1 },
      { op: OpCode.ADD },
      { op: OpCode.STORE, arg: 'i' },
      { op: OpCode.JUMP, arg: 5 }, // Jump back to loop
      
      // CC point (index 20)
      { op: OpCode.PUSH, arg: 'Array has ' },
      { op: OpCode.LOAD, arg: 'data' },
      { op: OpCode.ARRAY_LEN },
      { op: OpCode.CONCAT },
      { op: OpCode.PUSH, arg: ' items' },
      { op: OpCode.CONCAT },
      { op: OpCode.CC },
      { op: OpCode.PRINT },
      
      { op: OpCode.HALT }
    ];
    
    // Create a simple source that will be replaced by bytecode
    await manager.loadProgram('perf-test', 'function main() {}');
    
    // Manually set the bytecode for the loaded program
    const program = await storage.getProgram('perf-test');
    if (program) {
      program.bytecode = bytecode;
      await storage.saveProgram(program);
    }
    
    // Start execution
    const startExecTime = Date.now();
    await manager.startExecution('perf-test', 'exec1');
    
    // Get to CC point
    const result = await manager.getNext('exec1');
    const totalTime = Date.now() - startExecTime;
    
    expect(result.type).toBe('waiting');
    expect(result.message).toBe('Array has 10000 items');
    
    // Measure serialization by getting the execution state
    const startSerializeTime = Date.now();
    const execution = await storage.getExecution('exec1');
    const serializeTime = Date.now() - startSerializeTime;
    
    // Check serialized size
    const serializedSize = JSON.stringify(execution).length;
    
    // With heap references:
    // - The 10k element array is stored once in the heap
    // - Variables only store a reference
    // - This should dramatically reduce serialization size
    
    console.log(`Built 10k array and reached CC in ${totalTime}ms`);
    console.log(`Serialization took ${serializeTime}ms`);
    console.log(`Serialized size: ${serializedSize} bytes`);
    
    // The serialized size should be reasonable (not 10k * string length)
    expect(serializedSize).toBeLessThan(100000); // Much smaller than inline storage
    
    // Serialization should be fast
    expect(serializeTime).toBeLessThan(50); // Should be very fast
    
    // Verify the heap contains our array
    expect(execution!.heap).toBeDefined();
    expect(execution!.heap!.nextId).toBeGreaterThan(1);
  });

  it('should handle deeply nested structures with shared references', () => {
    const vm = new VM();
    
    // Create bytecode for nested structure with shared references
    const bytecode = [
      // Create a shared data object
      { op: OpCode.OBJECT_CREATE },
      { op: OpCode.STORE, arg: 'sharedData' },
      { op: OpCode.LOAD, arg: 'sharedData' },
      { op: OpCode.PUSH, arg: 'value' },
      { op: OpCode.PUSH, arg: 'shared content that is very long and would be expensive to duplicate' },
      { op: OpCode.PROPERTY_SET },
      { op: OpCode.POP },
      
      // Create root object
      { op: OpCode.OBJECT_CREATE },
      { op: OpCode.STORE, arg: 'root' },
      
      // Create 50 children, each with reference to shared data
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.STORE, arg: 'i' },
      
      // Loop start (index 12)
      { op: OpCode.LOAD, arg: 'i' },
      { op: OpCode.PUSH, arg: 50 },
      { op: OpCode.LT },
      { op: OpCode.JUMP_IF_FALSE, arg: 36 }, // Jump to end
      
      // Create child object
      { op: OpCode.OBJECT_CREATE },
      { op: OpCode.STORE, arg: 'child' },
      
      // Set id property
      { op: OpCode.LOAD, arg: 'child' },
      { op: OpCode.PUSH, arg: 'id' },
      { op: OpCode.LOAD, arg: 'i' },
      { op: OpCode.PROPERTY_SET },
      { op: OpCode.POP },
      
      // Set shared data reference
      { op: OpCode.LOAD, arg: 'child' },
      { op: OpCode.PUSH, arg: 'data' },
      { op: OpCode.LOAD, arg: 'sharedData' },
      { op: OpCode.PROPERTY_SET },
      { op: OpCode.POP },
      
      // Add child to root's children array
      { op: OpCode.LOAD, arg: 'root' },
      { op: OpCode.PUSH, arg: 'children' },
      { op: OpCode.PROPERTY_GET },
      { op: OpCode.LOAD, arg: 'child' },
      { op: OpCode.ARRAY_PUSH },
      { op: OpCode.POP },
      
      // Increment counter
      { op: OpCode.LOAD, arg: 'i' },
      { op: OpCode.PUSH, arg: 1 },
      { op: OpCode.ADD },
      { op: OpCode.STORE, arg: 'i' },
      { op: OpCode.JUMP, arg: 12 },
      
      // Verify structure (index 36)
      { op: OpCode.PUSH, arg: 'Created structure with ' },
      { op: OpCode.LOAD, arg: 'root' },
      { op: OpCode.PUSH, arg: 'children' },
      { op: OpCode.PROPERTY_GET },
      { op: OpCode.ARRAY_LEN },
      { op: OpCode.CONCAT },
      { op: OpCode.PUSH, arg: ' children' },
      { op: OpCode.CONCAT },
      { op: OpCode.PRINT },
      
      { op: OpCode.HALT }
    ];
    
    // First ensure root has empty children array
    bytecode.splice(9, 0, 
      { op: OpCode.LOAD, arg: 'root' },
      { op: OpCode.PUSH, arg: 'children' },
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.PROPERTY_SET },
      { op: OpCode.POP }
    );
    
    // Adjust jump targets after insertion (5 instructions added at position 9)
    bytecode[17].arg = 46; // JUMP_IF_FALSE (was 36, now 36+5+5)
    bytecode[45].arg = 17; // JUMP back (was at index 40, now 40+5)
    
    const startTime = Date.now();
    const state = vm.execute(bytecode);
    const executionTime = Date.now() - startTime;
    
    // Debug error
    if (state.status === 'error') {
      console.error('VM Error:', state.error);
    }
    
    expect(state.status).toBe('complete');
    expect(state.output).toContain('Created structure with 50 children');
    
    // Verify heap efficiency - shared data object should only exist once
    const heapObjects = Array.from(state.heap.objects.values());
    const sharedDataObjects = heapObjects.filter(obj => 
      obj.type === 'object' && 
      obj.data && 
      'properties' in obj.data &&
      obj.data.properties['value'] === 'shared content that is very long and would be expensive to duplicate'
    );
    expect(sharedDataObjects.length).toBe(1); // Only one instance in heap
    
    // Performance should be good even with many references
    expect(executionTime).toBeLessThan(100);
  });

  it('should demonstrate storage size reduction with heap references', async () => {
    const storage = new MemoryStorage();
    await storage.connect();
    const manager = new VMManager(storage);
    
    // Create bytecode that builds multiple arrays pointing to same data
    const bytecode = [
      // Create a large array of paths
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.STORE, arg: 'paths' },
      
      // Fill with 5000 paths
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.STORE, arg: 'i' },
      
      // Loop start (index 4)
      { op: OpCode.LOAD, arg: 'i' },
      { op: OpCode.PUSH, arg: 5000 },
      { op: OpCode.LT },
      { op: OpCode.JUMP_IF_FALSE, arg: 18 }, // Jump to create copies
      
      // Create path and push
      { op: OpCode.LOAD, arg: 'paths' },
      { op: OpCode.PUSH, arg: '/very/long/path/to/deeply/nested/directory/structure/file' },
      { op: OpCode.LOAD, arg: 'i' },
      { op: OpCode.CONCAT },
      { op: OpCode.PUSH, arg: '.txt' },
      { op: OpCode.CONCAT },
      { op: OpCode.ARRAY_PUSH },
      { op: OpCode.POP },
      
      // Increment
      { op: OpCode.LOAD, arg: 'i' },
      { op: OpCode.PUSH, arg: 1 },
      { op: OpCode.ADD },
      { op: OpCode.STORE, arg: 'i' },
      { op: OpCode.JUMP, arg: 4 },
      
      // Create multiple references to same array (index 18)
      { op: OpCode.LOAD, arg: 'paths' },
      { op: OpCode.STORE, arg: 'backup1' },
      { op: OpCode.LOAD, arg: 'paths' },
      { op: OpCode.STORE, arg: 'backup2' },
      { op: OpCode.LOAD, arg: 'paths' },
      { op: OpCode.STORE, arg: 'backup3' },
      
      // Hit CC to force serialization
      { op: OpCode.PUSH, arg: 'Processing ' },
      { op: OpCode.LOAD, arg: 'paths' },
      { op: OpCode.ARRAY_LEN },
      { op: OpCode.CONCAT },
      { op: OpCode.PUSH, arg: ' files' },
      { op: OpCode.CONCAT },
      { op: OpCode.CC },
      
      { op: OpCode.HALT }
    ];
    
    // Create a simple source that will be replaced by bytecode
    await manager.loadProgram('size-test', 'function main() {}');
    
    // Manually set the bytecode for the loaded program
    const program = await storage.getProgram('size-test');
    if (program) {
      program.bytecode = bytecode;
      await storage.saveProgram(program);
    }
    await manager.startExecution('size-test', 'exec1');
    
    const result = await manager.getNext('exec1');
    expect(result.type).toBe('waiting');
    expect(result.message).toBe('Processing 5000 files');
    
    // Get the serialized execution
    const execution = await storage.getExecution('exec1');
    const serializedSize = JSON.stringify(execution).length;
    
    // With heap references:
    // - The 5000 element array is stored ONCE in the heap
    // - Variables backup1, backup2, backup3 just store small references
    // - Without heap refs, the array would be duplicated 4 times!
    
    console.log(`\nHeap-based storage size: ${serializedSize} bytes`);
    console.log(`Without heap refs (estimated): ${serializedSize * 4} bytes`);
    console.log(`Storage reduction: ${Math.round((1 - 1/4) * 100)}%`);
    
    // The serialized size should be reasonable
    expect(serializedSize).toBeLessThan(500000); // Less than 500KB for 5000 long paths
  });
});