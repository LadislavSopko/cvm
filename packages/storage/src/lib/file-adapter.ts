import { promises as fs } from 'fs';
import * as path from 'path';
import { Program, Execution } from '@cvm/types';
import { StorageAdapter } from './storage.js';

export class FileStorageAdapter implements StorageAdapter {
  private connected = false;
  private programsDir: string;
  private executionsDir: string;
  private outputsDir: string;

  constructor(private dataDir: string) {
    this.programsDir = path.join(dataDir, 'programs');
    this.executionsDir = path.join(dataDir, 'executions');
    this.outputsDir = path.join(dataDir, 'outputs');
  }

  async connect(): Promise<void> {
    // Create directory structure
    await fs.mkdir(this.dataDir, { recursive: true });
    await fs.mkdir(this.programsDir, { recursive: true });
    await fs.mkdir(this.executionsDir, { recursive: true });
    await fs.mkdir(this.outputsDir, { recursive: true });
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async saveProgram(program: Program): Promise<void> {
    if (!this.connected) throw new Error('Not connected');
    
    const filePath = path.join(this.programsDir, `${program.id}.json`);
    const data = JSON.stringify(program, null, 2);
    await fs.writeFile(filePath, data, 'utf-8');
  }

  async getProgram(id: string): Promise<Program | null> {
    if (!this.connected) throw new Error('Not connected');
    
    const filePath = path.join(this.programsDir, `${id}.json`);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const program = JSON.parse(data);
      // Convert date strings back to Date objects
      program.created = new Date(program.created);
      if (program.updated) {
        program.updated = new Date(program.updated);
      }
      return program;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async saveExecution(execution: Execution): Promise<void> {
    if (!this.connected) throw new Error('Not connected');
    
    const filePath = path.join(this.executionsDir, `${execution.id}.json`);
    const data = JSON.stringify(execution, null, 2);
    await fs.writeFile(filePath, data, 'utf-8');
  }

  async getExecution(id: string): Promise<Execution | null> {
    if (!this.connected) throw new Error('Not connected');
    
    const filePath = path.join(this.executionsDir, `${id}.json`);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const execution = JSON.parse(data);
      // Convert date strings back to Date objects
      execution.created = new Date(execution.created);
      if (execution.updated) {
        execution.updated = new Date(execution.updated);
      }
      return execution;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async appendOutput(executionId: string, lines: string[]): Promise<void> {
    if (!this.connected) throw new Error('Not connected');
    
    const filePath = path.join(this.outputsDir, `${executionId}.output`);
    const content = lines.join('\n') + '\n';
    await fs.appendFile(filePath, content, 'utf-8');
  }

  async getOutput(executionId: string): Promise<string[]> {
    if (!this.connected) throw new Error('Not connected');
    
    const filePath = path.join(this.outputsDir, `${executionId}.output`);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      // Split by newlines and filter out empty lines
      return content.split('\n').filter(line => line.length > 0);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }
}