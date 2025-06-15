import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileStorageAdapter } from './file-adapter.js';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Program, Execution } from '@cvm/types';

describe('FileStorageAdapter', () => {
  let adapter: FileStorageAdapter;
  const testDir = '/tmp/cvm-test-' + Date.now();

  beforeEach(async () => {
    adapter = new FileStorageAdapter(testDir);
    await adapter.connect();
  });

  afterEach(async () => {
    await adapter.disconnect();
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true });
    } catch (e) {
      // Ignore if doesn't exist
    }
  });

  describe('lifecycle', () => {
    it('should create directory structure on connect', async () => {
      const programsDir = path.join(testDir, 'programs');
      const executionsDir = path.join(testDir, 'executions');

      const programsDirExists = await fs.access(programsDir).then(() => true).catch(() => false);
      const executionsDirExists = await fs.access(executionsDir).then(() => true).catch(() => false);

      expect(programsDirExists).toBe(true);
      expect(executionsDirExists).toBe(true);
    });

    it('should report connected status', () => {
      expect(adapter.isConnected()).toBe(true);
    });

    it('should disconnect properly', async () => {
      await adapter.disconnect();
      expect(adapter.isConnected()).toBe(false);
    });
  });

  describe('programs', () => {
    it('should save and retrieve a program', async () => {
      const program: Program = {
        id: 'test-prog-1',
        name: 'Test Program',
        source: 'console.log("hello")',
        bytecode: [{ op: 'PUSH', arg: 'hello' }],
        created: new Date(),
      };

      await adapter.saveProgram(program);
      const retrieved = await adapter.getProgram('test-prog-1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('test-prog-1');
      expect(retrieved?.name).toBe('Test Program');
      expect(retrieved?.source).toBe('console.log("hello")');
      expect(retrieved?.bytecode).toEqual([{ op: 'PUSH', arg: 'hello' }]);
    });

    it('should return null for non-existent program', async () => {
      const retrieved = await adapter.getProgram('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should overwrite existing program', async () => {
      const program1: Program = {
        id: 'test-prog-2',
        name: 'Original',
        source: 'v1',
        bytecode: [],
        created: new Date(),
      };

      const program2: Program = {
        id: 'test-prog-2',
        name: 'Updated',
        source: 'v2',
        bytecode: [],
        created: new Date(),
        updated: new Date(),
      };

      await adapter.saveProgram(program1);
      await adapter.saveProgram(program2);
      const retrieved = await adapter.getProgram('test-prog-2');

      expect(retrieved?.name).toBe('Updated');
      expect(retrieved?.source).toBe('v2');
    });
  });

  describe('executions', () => {
    it('should save and retrieve execution', async () => {
      const execution: Execution = {
        id: 'exec-1',
        programId: 'prog-1',
        state: 'running',
        pc: 5,
        stack: ['a', 'b'],
        variables: { x: 10 },
        output: ['hello'],
        created: new Date(),
      };

      await adapter.saveExecution(execution);
      const retrieved = await adapter.getExecution('exec-1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('exec-1');
      expect(retrieved?.state).toBe('running');
      expect(retrieved?.pc).toBe(5);
      expect(retrieved?.stack).toEqual(['a', 'b']);
      expect(retrieved?.variables).toEqual({ x: 10 });
      expect(retrieved?.output).toEqual(['hello']);
    });

    it('should return null for non-existent execution', async () => {
      const retrieved = await adapter.getExecution('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should save execution with ccPrompt', async () => {
      const execution: Execution = {
        id: 'exec-2',
        programId: 'prog-1',
        state: 'waiting_cc',
        pc: 3,
        stack: [],
        variables: {},
        output: [],
        ccPrompt: 'What is your name?',
        created: new Date(),
      };

      await adapter.saveExecution(execution);
      const retrieved = await adapter.getExecution('exec-2');

      expect(retrieved?.state).toBe('waiting_cc');
      expect(retrieved?.ccPrompt).toBe('What is your name?');
    });
  });

  describe('error handling', () => {
    it('should throw if not connected', async () => {
      const disconnectedAdapter = new FileStorageAdapter(testDir);
      
      await expect(disconnectedAdapter.saveProgram({} as Program))
        .rejects.toThrow('Not connected');
      await expect(disconnectedAdapter.getProgram('test'))
        .rejects.toThrow('Not connected');
    });
  });
});