/**
 * Core types for the CVM system
 * These are shared between multiple packages
 */

import { CVMValue, CVMArray } from './cvm-value.js';
import { Instruction } from '@cvm/parser';

// Re-export for convenience
export type { Instruction } from '@cvm/parser';
export type { CVMValue, CVMArray } from './cvm-value.js';

export interface Program {
  id: string;
  name: string;
  source: string;
  bytecode: Instruction[];
  created: Date;
  updated?: Date;
}

export interface IteratorState {
  array: CVMArray;
  index: number;
  length: number;
}

export interface Execution {
  id: string;
  programId: string;
  state: 'READY' | 'RUNNING' | 'AWAITING_COGNITIVE_RESULT' | 'COMPLETED' | 'ERROR';
  pc: number;
  stack: CVMValue[];
  variables: Record<string, CVMValue>;
  iterators?: IteratorState[]; // Store iterator state for for-of loops
  heap?: {
    objects: Record<number, { type: 'array' | 'object'; data: CVMValue }>;
    nextId: number;
  };
  error?: string;
  ccPrompt?: string; // Store CC prompt for stateless operation
  returnValue?: CVMValue; // Store return value from main()
  created: Date;
  updated?: Date;
}