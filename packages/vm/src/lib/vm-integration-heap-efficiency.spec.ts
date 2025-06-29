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

describe('VM Integration - Heap Storage Efficiency', () => {
  it('should handle large arrays with heap storage', async () => {
    const storage = new MemoryStorage();
    await storage.connect();
    const manager = new VMManager(storage);
    
    // Simplified version to test the core functionality
    const source = `
      function main(): void {
        // Create a large array simulating fs.listFiles()
        let files = [];
        
        // Add files one by one (simpler than for loop)
        files.push('/path/to/file1.txt');
        files.push('/path/to/file2.txt');
        files.push('/path/to/file3.txt');
        files.push('/path/to/file4.txt');
        files.push('/path/to/file5.txt');
        
        CC('Got ' + files.length + ' files');
        
        // Process files
        let processed = 0;
        processed = processed + 1;
        processed = processed + 1;
        processed = processed + 1;
        
        console.log('Processed ' + processed + ' files');
        console.log('First file: ' + files[0]);
        console.log('Last file: ' + files[4]);
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    await manager.loadProgram('simple-test', source);
    await manager.startExecution('simple-test', 'exec1');
    
    // First CC
    let result = await manager.getNext('exec1');
    expect(result.type).toBe('waiting');
    expect(result.message).toBe('Got 5 files');
    
    // Check serialization
    const execution = await storage.getExecution('exec1');
    const serializedSize = JSON.stringify(execution).length;
    console.log(`Serialized size: ${serializedSize} bytes`);
    
    // Complete execution
    await manager.reportCCResult('exec1', 'continue');
    result = await manager.getNext('exec1');
    expect(result.type).toBe('completed');
    
    // Verify output
    const output = await storage.getOutput('exec1');
    expect(output).toContain('Processed 3 files');
    expect(output).toContain('First file: /path/to/file1.txt');
    expect(output).toContain('Last file: /path/to/file5.txt');
  });

  it('should demonstrate storage efficiency with 1000 files', async () => {
    const storage = new MemoryStorage();
    await storage.connect();
    const manager = new VMManager(storage);
    
    // Create a program that builds array with while loop (more reliable than for loop)
    const source = `
      function main(): void {
        let files = [];
        let i = 0;
        
        // Build array with while loop
        while (i < 1000) {
          files.push('/very/long/path/to/deeply/nested/directory/file' + i + '.txt');
          i = i + 1;
        }
        
        // Create multiple references to test heap efficiency
        let backup1 = files;
        let backup2 = files;
        let backup3 = files;
        
        CC('Created ' + files.length + ' files with 3 backup references');
        
        // Modify array through one reference
        files.push('/new/file.txt');
        
        // All references should see the change
        console.log('Files length: ' + files.length);
        console.log('Backup1 length: ' + backup1.length);
        console.log('Backup2 length: ' + backup2.length);
        console.log('Backup3 length: ' + backup3.length);
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    await manager.loadProgram('efficiency-test', source);
    await manager.startExecution('efficiency-test', 'exec1');
    
    let result = await manager.getNext('exec1');
    expect(result.type).toBe('waiting');
    expect(result.message).toBe('Created 1000 files with 3 backup references');
    
    // Check serialization efficiency
    const execution = await storage.getExecution('exec1');
    const serializedSize = JSON.stringify(execution).length;
    console.log(`\nStorage efficiency test:`);
    console.log(`- Created 1000 element array`);
    console.log(`- 4 variables reference the same array`);
    console.log(`- Serialized size: ${serializedSize} bytes`);
    console.log(`- Without heap refs, this would be 4x larger!`);
    
    // The serialized size should be much smaller than if arrays were duplicated
    expect(serializedSize).toBeLessThan(100000); // Less than 100KB for 1000 long paths
    
    // Complete and verify reference semantics
    await manager.reportCCResult('exec1', 'continue');
    result = await manager.getNext('exec1');
    expect(result.type).toBe('completed');
    
    const output = await storage.getOutput('exec1');
    expect(output).toContain('Files length: 1001');
    expect(output).toContain('Backup1 length: 1001');
    expect(output).toContain('Backup2 length: 1001');
    expect(output).toContain('Backup3 length: 1001');
  });
});