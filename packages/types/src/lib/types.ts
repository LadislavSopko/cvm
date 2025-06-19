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
  state: 'READY' | 'RUNNING' | 'AWAITING_COGNITIVE_RESULT' | 'COMPLETED' | 'ERROR';
  pc: number;
  stack: any[];
  variables: Record<string, any>;
  error?: string;
  ccPrompt?: string; // Store CC prompt for stateless operation
  returnValue?: any; // Store return value from main()
  created: Date;
  updated?: Date;
}