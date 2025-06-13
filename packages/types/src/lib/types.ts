import { Document } from 'mongodb';

/**
 * Core types for the CVM system
 * These are shared between multiple packages
 */

export interface Program extends Document {
  id: string;
  name: string;
  source: string;
  bytecode: any; // Opaque to consumers, VM decides the format
  created: Date;
  updated?: Date;
}

export interface Execution extends Document {
  id: string;
  programId: string;
  state: 'ready' | 'running' | 'completed' | 'error';
  pc: number;
  stack: any[];
  variables: Record<string, any>;
  output: string[];
  error?: string;
  created: Date;
  updated?: Date;
}

export interface History extends Document {
  executionId: string;
  step: number;
  pc: number;
  instruction: string;
  stack: any[];
  variables: Record<string, any>;
  timestamp: Date;
}