import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { CVMMcpServer } from './mcp-server.js';
import { TestTransport } from './test-transport.js';
import { Execution } from '@cvm/types';

// Mock VMManager at module level
vi.mock('@cvm/vm', () => ({
  VMManager: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    dispose: vi.fn(),
    loadProgram: vi.fn(),
    startExecution: vi.fn(),
    getNext: vi.fn(),
    reportCCResult: vi.fn(),
    getExecutionStatus: vi.fn(),
    listExecutions: vi.fn(),
    getCurrentExecutionId: vi.fn(),
    setCurrentExecutionId: vi.fn(),
    deleteExecution: vi.fn(),
    getExecutionWithAttempts: vi.fn()
  }))
}));

describe('CVMMcpServer - Execution Management', () => {
  let server: CVMMcpServer;
  let mockVMManager: any;
  let testTransport: TestTransport;

  beforeAll(async () => {
    // Create server (it will create its own VMManager)
    server = new CVMMcpServer('1.0.0-test');
    
    // Get the mocked VMManager instance
    const VMManagerMock = (await import('@cvm/vm')).VMManager as any;
    mockVMManager = VMManagerMock.mock.results[0].value;
    
    // Create test transport and start server with it
    testTransport = new TestTransport();
    await server.start(testTransport);
  });

  afterAll(async () => {
    await server.stop();
  });

  describe('list_executions tool', () => {
    it('should list all executions with current marked', async () => {
      const mockExecutions: Execution[] = [
        {
          id: 'exec-1',
          programId: 'prog-1',
          state: 'AWAITING_COGNITIVE_RESULT',
          pc: 10,
          stack: [],
          variables: {},
          ccPrompt: 'Test prompt',
          created: new Date('2025-01-23T10:00:00Z')
        },
        {
          id: 'exec-2',
          programId: 'prog-2',
          state: 'COMPLETED',
          pc: 50,
          stack: [],
          variables: {},
          created: new Date('2025-01-22T10:00:00Z')
        }
      ];

      mockVMManager.listExecutions.mockResolvedValueOnce(mockExecutions);
      mockVMManager.getCurrentExecutionId.mockResolvedValueOnce('exec-1');

      const result = await testTransport.callTool('list_executions', {});
      
      expect(result).toHaveProperty('content');
      expect('content' in result && result.content[0].text).toBeTruthy();
      
      const response = JSON.parse((result as any).content[0].text);
      expect(response).toHaveLength(2);
      expect(response[0].isCurrent).toBe(true);
      expect(response[1].isCurrent).toBe(false);
      expect(response[0].summary.currentPrompt).toBe('Test prompt');
    });

    it('should handle empty execution list', async () => {
      mockVMManager.listExecutions.mockResolvedValueOnce([]);
      mockVMManager.getCurrentExecutionId.mockResolvedValueOnce(null);

      const result = await testTransport.callTool('list_executions', {});
      
      expect(result).toHaveProperty('content');
      const response = JSON.parse((result as any).content[0].text);
      expect(response).toEqual([]);
    });
  });

  describe('get_execution tool', () => {
    it('should get execution details with attempt count', async () => {
      const mockExecution = {
        id: 'exec-1',
        programId: 'prog-1',
        state: 'AWAITING_COGNITIVE_RESULT',
        pc: 10,
        stack: [],
        variables: { file: 'test.ts' },
        ccPrompt: 'Analyze file',
        created: new Date('2025-01-23T10:00:00Z'),
        attempts: 2,
        firstAttemptAt: new Date('2025-01-23T10:05:00Z'),
        lastAttemptAt: new Date('2025-01-23T10:10:00Z')
      };

      mockVMManager.getExecutionWithAttempts.mockResolvedValueOnce(mockExecution);
      mockVMManager.getCurrentExecutionId.mockResolvedValueOnce('exec-1');

      const result = await testTransport.callTool('get_execution', { executionId: 'exec-1' });
      
      expect(result).toHaveProperty('content');
      const response = JSON.parse((result as any).content[0].text);
      
      expect(response.executionId).toBe('exec-1');
      expect(response.isCurrent).toBe(true);
      expect(response.currentTask.prompt).toBe('Analyze file');
      expect(response.currentTask.attempts).toBe(2);
    });

    it('should use current execution when no id provided', async () => {
      mockVMManager.getCurrentExecutionId.mockResolvedValueOnce('exec-current');
      
      const mockExecution = {
        id: 'exec-current',
        programId: 'prog-1',
        state: 'RUNNING',
        pc: 5,
        stack: [],
        variables: {},
        created: new Date()
      };
      
      mockVMManager.getExecutionWithAttempts.mockResolvedValueOnce(mockExecution);

      const result = await testTransport.callTool('get_execution', {});
      
      expect(mockVMManager.getExecutionWithAttempts).toHaveBeenCalledWith('exec-current');
      expect(result).toHaveProperty('content');
    });

    it('should return error when no current execution', async () => {
      mockVMManager.getCurrentExecutionId.mockResolvedValueOnce(null);

      const result = await testTransport.callTool('get_execution', {});
      
      expect(result).toHaveProperty('content');
      expect((result as any).content[0].text).toContain('No current execution');
    });
  });

  describe('set_current tool', () => {
    it('should set current execution', async () => {
      mockVMManager.setCurrentExecutionId.mockResolvedValueOnce(undefined);

      const result = await testTransport.callTool('set_current', { executionId: 'exec-123' });
      
      expect(result).toHaveProperty('content');
      expect((result as any).content[0].text).toContain('Current execution set to: exec-123');
      expect(mockVMManager.setCurrentExecutionId).toHaveBeenCalledWith('exec-123');
    });
  });

  describe('delete_execution tool', () => {
    it('should delete execution after confirmation', async () => {
      // First call - generate token
      const result1 = await testTransport.callTool('delete_execution', { executionId: 'exec-del' });
      
      expect(result1).toHaveProperty('content');
      const response1 = JSON.parse((result1 as any).content[0].text);
      expect(response1.confirmationRequired).toBe(true);
      expect(response1.token).toBeTruthy();
      
      // Second call - with token
      mockVMManager.deleteExecution.mockResolvedValueOnce(undefined);
      const result2 = await testTransport.callTool('delete_execution', {
        executionId: 'exec-del',
        confirmToken: response1.token
      });
      
      expect(result2).toHaveProperty('content');
      expect((result2 as any).content[0].text).toContain('Execution deleted: exec-del');
      expect(mockVMManager.deleteExecution).toHaveBeenCalledWith('exec-del');
    });

    it('should reject deletion without valid token', async () => {
      const result = await testTransport.callTool('delete_execution', {
        executionId: 'exec-del',
        confirmToken: 'invalid-token'
      });
      
      expect(result).toHaveProperty('content');
      expect((result as any).content[0].text).toContain('Invalid confirmation token');
    });
  });
});