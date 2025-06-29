import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { MongoDBAdapter } from './mongodb-adapter.js';
import { OpCode } from '@cvm/parser';

describe('MongoDBAdapter', () => {
  let adapter: MongoDBAdapter;

  beforeAll(async () => {
    adapter = new MongoDBAdapter('mongodb://root:example@localhost:27017/cvm_test?authSource=admin');
    await adapter.connect();
  });

  afterAll(async () => {
    // Clean up test data before disconnecting
    if (adapter.isConnected()) {
      const db = (adapter as any).db;
      if (db) {
        await db.collection('programs').deleteMany({});
        await db.collection('executions').deleteMany({});
        await db.collection('outputs').deleteMany({});
      }
    }
    await adapter.disconnect();
  });

  describe('connection', () => {
    it('should connect to MongoDB', () => {
      expect(adapter.isConnected()).toBe(true);
    });

    it('should have required collections', async () => {
      const collections = await adapter.getCollections();
      expect(collections).toContain('programs');
      expect(collections).toContain('executions');
    });
  });

  describe('programs collection', () => {
    it('should save and retrieve a program', async () => {
      const program = {
        id: 'test-program-1',
        name: 'Test Program',
        source: 'print "Hello"',
        bytecode: [{ op: OpCode.PUSH, arg: 'dummy' }], // Dummy bytecode for testing
        created: new Date(),
      };

      await adapter.saveProgram(program);
      const retrieved = await adapter.getProgram('test-program-1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Test Program');
      expect(retrieved?.source).toBe('print "Hello"');
      expect(retrieved?.bytecode).toEqual(program.bytecode);
    });
  });

  describe('executions collection', () => {
    it('should save and retrieve execution state', async () => {
      const execution = {
        id: 'test-exec-1',
        programId: 'test-program-1',
        state: 'RUNNING' as const,
        pc: 0,
        stack: [],
        variables: {},
        created: new Date(),
      };

      await adapter.saveExecution(execution);
      const retrieved = await adapter.getExecution('test-exec-1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.programId).toBe('test-program-1');
      expect(retrieved?.state).toBe('RUNNING');
    });
  });

  describe('output collection', () => {
    it('should append and retrieve output', async () => {
      const executionId = 'test-exec-output-' + Date.now(); // Unique ID per test run
      
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
  });

  describe('program management', () => {
    beforeEach(async () => {
      // Clean up programs collection before each test
      const db = (adapter as any).db;
      if (db) {
        await db.collection('programs').deleteMany({});
      }
    });

    it('should list all programs', async () => {
      // Save multiple programs
      const program1 = {
        id: 'prog-1',
        name: 'Program 1',
        source: 'function main() { return 1; }',
        bytecode: [{ op: OpCode.PUSH, arg: 1 }],
        created: new Date('2025-01-01'),
      };

      const program2 = {
        id: 'prog-2',
        name: 'Program 2',
        source: 'function main() { return 2; }',
        bytecode: [{ op: OpCode.PUSH, arg: 2 }],
        created: new Date('2025-01-02'),
      };

      await adapter.saveProgram(program1);
      await adapter.saveProgram(program2);

      const programs = await adapter.listPrograms();
      
      expect(programs).toHaveLength(2);
      expect(programs[0].id).toBe('prog-1');
      expect(programs[1].id).toBe('prog-2');
      expect(programs[0].name).toBe('Program 1');
      expect(programs[1].name).toBe('Program 2');
    });

    it('should return empty array when no programs exist', async () => {
      const programs = await adapter.listPrograms();
      expect(programs).toEqual([]);
    });

    it('should delete a program', async () => {
      const program = {
        id: 'prog-to-delete',
        name: 'Delete Me',
        source: 'function main() { }',
        bytecode: [],
        created: new Date(),
      };

      await adapter.saveProgram(program);
      
      // Verify it exists
      const exists = await adapter.getProgram('prog-to-delete');
      expect(exists).toBeDefined();

      // Delete it
      await adapter.deleteProgram('prog-to-delete');

      // Verify it's gone
      const deleted = await adapter.getProgram('prog-to-delete');
      expect(deleted).toBeNull();
    });

    it('should not throw when deleting non-existent program', async () => {
      // Should not throw
      await expect(adapter.deleteProgram('non-existent')).resolves.not.toThrow();
    });
  });

  describe('Atomic deletion operations', () => {
    it.skip('should rollback all changes if any operation fails during deleteExecution (requires replica set)', async () => {
      // This test requires MongoDB replica set for transactions
      // In production with replica set, transactions ensure atomicity
      // Skip in test environment with standalone MongoDB
      
      // Setup execution with output
      const mockExecution = {
        id: 'exec1',
        programId: 'test-prog',
        state: 'COMPLETED' as const,
        pc: 0,
        stack: [],
        variables: {},
        created: new Date()
      };
      
      await adapter.saveExecution(mockExecution);
      await adapter.appendOutput('exec1', ['output']);
      
      // Get the internal collections to mock failure
      const db = (adapter as any).db;
      const outputsCollection = db.collection('outputs');
      
      // Mock failure on second operation (deleteMany)
      const originalDeleteMany = outputsCollection.deleteMany.bind(outputsCollection);
      outputsCollection.deleteMany = vi.fn().mockRejectedValue(new Error('DB Error'));
      
      // Attempt deletion
      await expect(adapter.deleteExecution('exec1')).rejects.toThrow('DB Error');
      
      // Restore original method
      outputsCollection.deleteMany = originalDeleteMany;
      
      // Verify execution still exists (rollback)
      const execution = await adapter.getExecution('exec1');
      expect(execution).not.toBeNull();
      expect(execution?.id).toBe('exec1');
    });

    it('should successfully delete execution with all related data in transaction', async () => {
      // Setup execution with output
      const mockExecution = {
        id: 'exec2',
        programId: 'test-prog',
        state: 'COMPLETED' as const,
        pc: 0,
        stack: [],
        variables: {},
        created: new Date()
      };
      
      await adapter.saveExecution(mockExecution);
      await adapter.appendOutput('exec2', ['output1']);
      await adapter.appendOutput('exec2', ['output2']);
      
      // Set as current execution
      await adapter.setCurrentExecutionId('exec2');
      
      // Delete execution
      await adapter.deleteExecution('exec2');
      
      // Verify execution is gone
      const execution = await adapter.getExecution('exec2');
      expect(execution).toBeNull();
      
      // Verify outputs are gone
      const db = (adapter as any).db;
      const outputs = await db.collection('outputs').find({ executionId: 'exec2' }).toArray();
      expect(outputs).toHaveLength(0);
      
      // Verify current execution is cleared
      const currentId = await adapter.getCurrentExecutionId();
      expect(currentId).toBeNull();
    });

    it('should handle current execution update within transaction', async () => {
      // Setup two executions
      const exec1 = {
        id: 'current-exec',
        programId: 'test-prog',
        state: 'COMPLETED' as const,
        pc: 0,
        stack: [],
        variables: {},
        created: new Date()
      };
      
      const exec2 = {
        id: 'other-exec',
        programId: 'test-prog',
        state: 'COMPLETED' as const,
        pc: 0,
        stack: [],
        variables: {},
        created: new Date()
      };
      
      await adapter.saveExecution(exec1);
      await adapter.saveExecution(exec2);
      
      // Set current execution
      await adapter.setCurrentExecutionId('current-exec');
      
      // Delete the current execution
      await adapter.deleteExecution('current-exec');
      
      // Verify current is cleared
      const currentId = await adapter.getCurrentExecutionId();
      expect(currentId).toBeNull();
      
      // Other execution should still exist
      const otherExec = await adapter.getExecution('other-exec');
      expect(otherExec).not.toBeNull();
    });
  });

});