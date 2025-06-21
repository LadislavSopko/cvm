import { describe, it, expect, beforeAll, afterAll } from 'vitest';
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

});