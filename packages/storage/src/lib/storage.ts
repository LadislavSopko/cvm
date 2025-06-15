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
}
