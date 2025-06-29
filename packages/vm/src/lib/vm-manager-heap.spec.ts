import { describe, it, expect } from 'vitest';
import { VMManager } from './vm-manager.js';
import { compile } from '@cvm/parser';
import { StorageAdapter } from '@cvm/storage';
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

describe('VM Manager Heap Serialization', () => {
  it('should serialize heap with execution state', async () => {
    const storage = new MemoryStorage();
    await storage.connect();
    const manager = new VMManager(storage);
    
    const source = `
      function main(): void {
        let arr = [1, 2, 3];
        let obj = { name: "test", values: arr };
        CC("Checkpoint with heap data");
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    await manager.loadProgram('test', source);
    await manager.startExecution('test', 'exec1');
    
    const result = await manager.getNext('exec1');
    expect(result.type).toBe('waiting');
    
    // Get the saved execution state
    const execution = await storage.getExecution('exec1');
    expect(execution).not.toBeNull();
    expect(execution!.heap).toBeDefined();
    expect(execution!.heap!.objects).toBeDefined();
    expect(execution!.heap!.nextId).toBeGreaterThan(0);
    
    // Verify heap contains our array and object
    const heapObjects = Object.values(execution!.heap!.objects);
    expect(heapObjects.length).toBeGreaterThan(0);
  });

  it('should restore heap on execution resume', async () => {
    const storage = new MemoryStorage();
    await storage.connect();
    const manager = new VMManager(storage);
    
    const source = `
      function main(): void {
        let arr = [10, 20, 30];
        CC("First checkpoint");
        arr.push(40);
        console.log(arr.length);
        CC("Second checkpoint");
        console.log(arr[3]);
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    await manager.loadProgram('test', source);
    
    // Start execution - hits first CC
    await manager.startExecution('test', 'exec1');
    const result1 = await manager.getNext('exec1');
    expect(result1.type).toBe('waiting');
    
    // Resume with first response
    await manager.reportCCResult('exec1', 'continue');
    const result2 = await manager.getNext('exec1');
    expect(result2.type).toBe('waiting');
    
    // Check that array modifications persisted
    const output = await storage.getOutput('exec1');
    expect(output).toContain('4'); // arr.length after push
    
    // Resume with second response
    await manager.reportCCResult('exec1', 'done');
    const result3 = await manager.getNext('exec1');
    expect(result3.type).toBe('completed');
    
    // Final output should show the pushed value
    const finalOutput = await storage.getOutput('exec1');
    expect(finalOutput).toContain('40');
  });

  it('should handle large arrays efficiently', async () => {
    const storage = new MemoryStorage();
    await storage.connect();
    const manager = new VMManager(storage);
    
    const source = `
      function main(): void {
        let files = [];
        for (let i = 0; i < 10000; i++) {
          files.push('/path/to/file' + i);
        }
        CC('Ready to process files');
        console.log(files.length);
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    await manager.loadProgram('test', source);
    await manager.startExecution('test', 'exec1');
    
    const result = await manager.getNext('exec1');
    expect(result.type).toBe('waiting');
    
    // Get serialized state
    const execution = await storage.getExecution('exec1');
    expect(execution).not.toBeNull();
    
    // Verify heap contains the large array
    expect(execution!.heap).toBeDefined();
    expect(execution!.heap!.objects).toBeDefined();
    
    // The key test: serialized size should be reasonable
    // With heap references, we store the array once, not duplicated in variables
    const serializedSize = JSON.stringify(execution).length;
    console.log('Serialized execution size:', serializedSize);
    
    // Should be much smaller than if we stored 10k strings inline
    expect(serializedSize).toBeLessThan(1000000); // Less than 1MB
  });

  it('should maintain heap references across multiple CC calls', async () => {
    const storage = new MemoryStorage();
    await storage.connect();
    const manager = new VMManager(storage);
    
    const source = `
      function main(): void {
        let shared = { counter: 0 };
        let arr = [shared, shared, shared];
        
        CC("Initial state");
        
        arr[0].counter = 10;
        CC("After modification");
        
        console.log(arr[1].counter); // Should be 10
        console.log(arr[2].counter); // Should be 10
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    await manager.loadProgram('test', source);
    
    // First CC
    await manager.startExecution('test', 'exec1');
    const result1 = await manager.getNext('exec1');
    expect(result1.type).toBe('waiting');
    
    // Resume - hits second CC
    await manager.reportCCResult('exec1', 'continue');
    const result2 = await manager.getNext('exec1');
    expect(result2.type).toBe('waiting');
    
    // Resume - completes
    await manager.reportCCResult('exec1', 'continue');
    const result3 = await manager.getNext('exec1');
    expect(result3.type).toBe('completed');
    
    // Verify shared object mutations were preserved
    const output = await storage.getOutput('exec1');
    expect(output).toEqual(['10', '10']);
  });
});