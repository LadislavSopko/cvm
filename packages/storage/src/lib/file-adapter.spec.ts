import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileStorageAdapter } from './file-adapter.js';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Program, Execution } from '@cvm/types';
import { OpCode } from '@cvm/parser';

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
        bytecode: [{ op: OpCode.PUSH, arg: 'hello' }],
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
        state: 'RUNNING',
        pc: 5,
        stack: ['a', 'b'],
        variables: { x: 10 },
        created: new Date(),
      };

      await adapter.saveExecution(execution);
      const retrieved = await adapter.getExecution('exec-1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('exec-1');
      expect(retrieved?.state).toBe('RUNNING');
      expect(retrieved?.pc).toBe(5);
      expect(retrieved?.stack).toEqual(['a', 'b']);
      expect(retrieved?.variables).toEqual({ x: 10 });
    });

    it('should return null for non-existent execution', async () => {
      const retrieved = await adapter.getExecution('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should save execution with ccPrompt', async () => {
      const execution: Execution = {
        id: 'exec-2',
        programId: 'prog-1',
        state: 'AWAITING_COGNITIVE_RESULT',
        pc: 3,
        stack: [],
        variables: {},
        ccPrompt: 'What is your name?',
        created: new Date(),
      };

      await adapter.saveExecution(execution);
      const retrieved = await adapter.getExecution('exec-2');

      expect(retrieved?.state).toBe('AWAITING_COGNITIVE_RESULT');
      expect(retrieved?.ccPrompt).toBe('What is your name?');
    });
  });

  describe('output', () => {
    it('should append and retrieve output', async () => {
      const executionId = 'exec-output-1';
      
      // Initially empty
      const initial = await adapter.getOutput(executionId);
      expect(initial).toEqual([]);
      
      // Append first batch
      await adapter.appendOutput(executionId, ['Line 1', 'Line 2']);
      const after1 = await adapter.getOutput(executionId);
      expect(after1).toEqual(['Line 1', 'Line 2']);
      
      // Append second batch
      await adapter.appendOutput(executionId, ['Line 3']);
      const after2 = await adapter.getOutput(executionId);
      expect(after2).toEqual(['Line 1', 'Line 2', 'Line 3']);
    });

    it('should handle empty output lines', async () => {
      const executionId = 'exec-output-2';
      await adapter.appendOutput(executionId, []);
      const result = await adapter.getOutput(executionId);
      expect(result).toEqual([]);
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

  describe('current execution management', () => {
    it('should get and set current execution ID', async () => {
      const executionId = 'current-exec-1';
      
      // Initially null
      let currentId = await adapter.getCurrentExecutionId();
      expect(currentId).toBeNull();
      
      // Set current execution
      await adapter.setCurrentExecutionId(executionId);
      currentId = await adapter.getCurrentExecutionId();
      expect(currentId).toBe(executionId);
      
      // Clear current execution
      await adapter.setCurrentExecutionId(null);
      currentId = await adapter.getCurrentExecutionId();
      expect(currentId).toBeNull();
    });
  });

  describe('list operations', () => {
    it('should list all programs', async () => {
      const programs: Program[] = [
        { id: 'prog1', name: 'Program 1', source: 'test1', bytecode: [], created: new Date() },
        { id: 'prog2', name: 'Program 2', source: 'test2', bytecode: [], created: new Date() },
        { id: 'prog3', name: 'Program 3', source: 'test3', bytecode: [], created: new Date() }
      ];
      
      for (const prog of programs) {
        await adapter.saveProgram(prog);
      }
      
      const listed = await adapter.listPrograms();
      expect(listed).toHaveLength(3);
      expect(listed.map(p => p.id).sort()).toEqual(['prog1', 'prog2', 'prog3']);
    });

    it('should return empty array when no programs exist', async () => {
      const listed = await adapter.listPrograms();
      expect(listed).toEqual([]);
    });

    it('should list all executions', async () => {
      const executions: Execution[] = [
        {
          id: 'exec1',
          programId: 'prog1',
          state: 'READY',
          pc: 0,
          stack: [],
          variables: {},
          created: new Date(),
          heap: { objects: {}, nextId: 1 },
          iterators: []
        },
        {
          id: 'exec2',
          programId: 'prog2',
          state: 'RUNNING',
          pc: 5,
          stack: ['a'],
          variables: { x: 1 },
          created: new Date(),
          heap: { objects: {}, nextId: 1 },
          iterators: []
        }
      ];
      
      for (const exec of executions) {
        await adapter.saveExecution(exec);
      }
      
      const listed = await adapter.listExecutions();
      expect(listed).toHaveLength(2);
      expect(listed.map(e => e.id).sort()).toEqual(['exec1', 'exec2']);
    });
  });

  describe('delete operations', () => {
    it('should delete execution and its output', async () => {
      const execution: Execution = {
        id: 'exec-to-delete',
        programId: 'test-prog',
        state: 'READY',
        pc: 0,
        stack: [],
        variables: {},
        created: new Date(),
        heap: { objects: {}, nextId: 1 },
        iterators: []
      };
      
      await adapter.saveExecution(execution);
      await adapter.appendOutput(execution.id, ['Test output']);
      
      // Verify they exist
      let retrieved = await adapter.getExecution(execution.id);
      expect(retrieved).not.toBeNull();
      let output = await adapter.getOutput(execution.id);
      expect(output).toEqual(['Test output']);
      
      // Delete execution
      await adapter.deleteExecution(execution.id);
      
      // Verify they're gone
      retrieved = await adapter.getExecution(execution.id);
      expect(retrieved).toBeNull();
      output = await adapter.getOutput(execution.id);
      expect(output).toEqual([]);
    });

    it('should clear current execution when deleting current', async () => {
      const executionId = 'current-to-delete';
      const execution: Execution = {
        id: executionId,
        programId: 'test-prog',
        state: 'READY',
        pc: 0,
        stack: [],
        variables: {},
        created: new Date(),
        heap: { objects: {}, nextId: 1 },
        iterators: []
      };
      
      await adapter.saveExecution(execution);
      await adapter.setCurrentExecutionId(executionId);
      
      // Verify it's current
      let currentId = await adapter.getCurrentExecutionId();
      expect(currentId).toBe(executionId);
      
      // Delete execution
      await adapter.deleteExecution(executionId);
      
      // Verify current is cleared
      currentId = await adapter.getCurrentExecutionId();
      expect(currentId).toBeNull();
    });

    it('should handle deleting non-existent execution', async () => {
      // Should not throw
      await expect(adapter.deleteExecution('nonexistent')).resolves.not.toThrow();
    });

    it('should delete program', async () => {
      const program: Program = {
        id: 'prog-to-delete',
        name: 'Program to Delete',
        source: 'test',
        bytecode: [],
        created: new Date()
      };
      
      await adapter.saveProgram(program);
      
      // Verify it exists
      let retrieved = await adapter.getProgram(program.id);
      expect(retrieved).not.toBeNull();
      
      // Delete program
      await adapter.deleteProgram(program.id);
      
      // Verify it's gone
      retrieved = await adapter.getProgram(program.id);
      expect(retrieved).toBeNull();
    });

    it('should handle deleting non-existent program', async () => {
      // Should not throw
      await expect(adapter.deleteProgram('nonexistent')).resolves.not.toThrow();
    });
  });

  describe('error handling with connected adapter', () => {
    it('should throw when operations fail after connection', async () => {
      await adapter.disconnect();
      
      await expect(adapter.saveExecution({
        id: 'test',
        programId: 'test',
        state: 'READY',
        pc: 0,
        stack: [],
        variables: {},
        created: new Date(),
        heap: { objects: {}, nextId: 1 },
        iterators: []
      })).rejects.toThrow('Not connected');
      await expect(adapter.getExecution('test'))
        .rejects.toThrow('Not connected');
      await expect(adapter.listExecutions())
        .rejects.toThrow('Not connected');
      await expect(adapter.appendOutput('test', ['line']))
        .rejects.toThrow('Not connected');
      await expect(adapter.getOutput('test'))
        .rejects.toThrow('Not connected');
      await expect(adapter.getCurrentExecutionId())
        .rejects.toThrow('Not connected');
      await expect(adapter.setCurrentExecutionId('test'))
        .rejects.toThrow('Not connected');
      await expect(adapter.deleteExecution('test'))
        .rejects.toThrow('Not connected');
      await expect(adapter.listPrograms())
        .rejects.toThrow('Not connected');
      await expect(adapter.deleteProgram('test'))
        .rejects.toThrow('Not connected');
    });
  });
});