import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoDBAdapter } from './mongodb.js';

describe('MongoDBAdapter', () => {
  let adapter: MongoDBAdapter;

  beforeAll(async () => {
    adapter = new MongoDBAdapter('mongodb://root:example@localhost:27017/cvm_test?authSource=admin');
    await adapter.connect();
  });

  afterAll(async () => {
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
      expect(collections).toContain('history');
    });
  });

  describe('programs collection', () => {
    it('should save and retrieve a program', async () => {
      const program = {
        id: 'test-program-1',
        name: 'Test Program',
        source: 'print "Hello"',
        bytecode: new Uint8Array([1, 2, 3]),
        created: new Date(),
      };

      await adapter.saveProgram(program);
      const retrieved = await adapter.getProgram('test-program-1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Test Program');
      expect(retrieved?.source).toBe('print "Hello"');
    });
  });

  describe('executions collection', () => {
    it('should save and retrieve execution state', async () => {
      const execution = {
        id: 'test-exec-1',
        programId: 'test-program-1',
        state: 'running' as const,
        pc: 0,
        stack: [],
        variables: {},
        created: new Date(),
      };

      await adapter.saveExecution(execution);
      const retrieved = await adapter.getExecution('test-exec-1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.programId).toBe('test-program-1');
      expect(retrieved?.state).toBe('running');
    });
  });

  describe('history collection', () => {
    it('should save execution history', async () => {
      const history = {
        executionId: 'test-exec-1',
        step: 1,
        pc: 0,
        instruction: 'PUSH',
        stack: [42],
        variables: {},
        timestamp: new Date(),
      };

      await adapter.saveHistory(history);
      const retrieved = await adapter.getHistory('test-exec-1');

      expect(retrieved).toBeDefined();
      expect(retrieved.length).toBeGreaterThan(0);
      expect(retrieved[0].instruction).toBe('PUSH');
    });
  });
});