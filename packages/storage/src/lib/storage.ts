import { Program, Execution } from '@cvm/types';

/**
 * Storage adapter interface for CVM
 * Simplified after removing history tracking
 */
export interface StorageAdapter {
  // Lifecycle
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Programs
  saveProgram(program: Program): Promise<void>;
  getProgram(id: string): Promise<Program | null>;
  
  // Executions
  saveExecution(execution: Execution): Promise<void>;
  getExecution(id: string): Promise<Execution | null>;
  
  // Output (separate from execution state)
  appendOutput(executionId: string, lines: string[]): Promise<void>;
  getOutput(executionId: string): Promise<string[]>;
  
  // Execution management
  listExecutions(): Promise<Execution[]>;
  getCurrentExecutionId(): Promise<string | null>;
  setCurrentExecutionId(executionId: string | null): Promise<void>;
  deleteExecution(executionId: string): Promise<void>;
}
