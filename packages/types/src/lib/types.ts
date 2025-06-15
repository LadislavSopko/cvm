/**
 * Core types for the CVM system
 * These are shared between multiple packages
 */

export interface Program {
  id: string;
  name: string;
  source: string;
  bytecode: any; // Opaque to consumers, VM decides the format
  created: Date;
  updated?: Date;
}

export interface Execution {
  id: string;
  programId: string;
  state: 'ready' | 'running' | 'waiting_cc' | 'completed' | 'error';
  pc: number;
  stack: any[];
  variables: Record<string, any>;
  output: string[];
  error?: string;
  ccPrompt?: string; // Store CC prompt for stateless operation
  created: Date;
  updated?: Date;
}