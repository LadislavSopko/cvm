import { Document } from 'mongodb';

export interface Program extends Document {
  id: string;
  name: string;
  source: string;
  bytecode: Uint8Array;
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