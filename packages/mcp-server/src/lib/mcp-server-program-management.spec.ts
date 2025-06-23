import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CVMMcpServer } from './mcp-server.js';
import { TestTransport } from './test-transport.js';
import { Program } from '@cvm/types';

// Mock VMManager
vi.mock('@cvm/vm', () => ({
  VMManager: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    dispose: vi.fn(),
    loadProgram: vi.fn(),
    startExecution: vi.fn(),
    getNext: vi.fn(),
    reportCCResult: vi.fn(),
    getExecutionStatus: vi.fn(),
    setCurrentExecutionId: vi.fn(),
    getCurrentExecutionId: vi.fn(),
    listExecutions: vi.fn(),
    deleteExecution: vi.fn(),
    getExecutionWithAttempts: vi.fn(),
    listPrograms: vi.fn(),
    deleteProgram: vi.fn(),
    restartExecution: vi.fn()
  }))
}));

describe('MCP Server Program Management', () => {
  let server: CVMMcpServer;
  let mockVMManager: any;
  let testTransport: TestTransport;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Create server
    server = new CVMMcpServer('1.0.0-test');
    
    // Get the mocked VMManager instance
    const VMManagerMock = (await import('@cvm/vm')).VMManager as any;
    mockVMManager = VMManagerMock.mock.results[VMManagerMock.mock.results.length - 1].value;
    
    // Create test transport and start server
    testTransport = new TestTransport();
    await server.start(testTransport);
  });

  describe('list_programs tool', () => {
    it('should list all programs', async () => {
      const mockPrograms: Program[] = [
        {
          id: 'prog1',
          name: 'Program 1',
          source: 'function main() { return 1; }',
          bytecode: [],
          created: new Date('2025-01-01')
        },
        {
          id: 'prog2',
          name: 'Program 2',
          source: 'function main() { return 2; }',
          bytecode: [],
          created: new Date('2025-01-02')
        }
      ];

      mockVMManager.listPrograms.mockResolvedValue(mockPrograms);

      const result = await testTransport.callTool('list_programs', {});

      expect(mockVMManager.listPrograms).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect((result as any).content[0].text).toContain('prog1');
      expect((result as any).content[0].text).toContain('prog2');
      expect((result as any).content[0].text).toContain('Program 1');
      expect((result as any).content[0].text).toContain('Program 2');
    });

    it('should return empty list when no programs exist', async () => {
      mockVMManager.listPrograms.mockResolvedValue([]);

      const result = await testTransport.callTool('list_programs', {});

      expect((result as any).content[0].text).toContain('No programs loaded');
    });
  });

  describe('delete_program tool', () => {
    it('should require confirmation token on first call', async () => {
      const result = await testTransport.callTool('delete_program', {
        programId: 'prog1'
      });

      expect(mockVMManager.deleteProgram).not.toHaveBeenCalled();
      expect((result as any).content[0].text).toContain('confirmation');
      expect((result as any).content[0].text).toContain('token');
      expect((result as any).content[0].text).toContain('delete-prog1-');
    });

    it('should delete program with valid confirmation token', async () => {
      // Get confirmation token
      const firstResult = await testTransport.callTool('delete_program', {
        programId: 'prog1'
      });
      
      // Extract token from response
      const responseText = (firstResult as any).content[0].text;
      const response = JSON.parse(responseText);
      const token = response.token;

      mockVMManager.deleteProgram.mockResolvedValue(undefined);

      // Delete with token
      const result = await testTransport.callTool('delete_program', {
        programId: 'prog1',
        confirmToken: token
      });

      expect(mockVMManager.deleteProgram).toHaveBeenCalledWith('prog1');
      expect((result as any).content[0].text).toContain('Program deleted: prog1');
    });

    it('should reject invalid confirmation token', async () => {
      const result = await testTransport.callTool('delete_program', {
        programId: 'prog1',
        confirmToken: 'invalid-token'
      });

      expect(mockVMManager.deleteProgram).not.toHaveBeenCalled();
      expect((result as any).content[0].text).toContain('Invalid confirmation token');
      expect((result as any).isError).toBe(true);
    });
  });

  describe('restart tool', () => {
    it('should restart program with auto-generated execution ID', async () => {
      mockVMManager.restartExecution.mockResolvedValue('prog1-123456');

      const result = await testTransport.callTool('restart', {
        programId: 'prog1'
      });

      expect(mockVMManager.restartExecution).toHaveBeenCalledWith('prog1', undefined);
      expect((result as any).content[0].text).toContain('Execution started: prog1-123456');
      expect((result as any).content[0].text).toContain('(set as current)');
    });

    it('should restart program with custom execution ID', async () => {
      mockVMManager.restartExecution.mockResolvedValue('custom-exec-id');

      const result = await testTransport.callTool('restart', {
        programId: 'prog1',
        executionId: 'custom-exec-id'
      });

      expect(mockVMManager.restartExecution).toHaveBeenCalledWith('prog1', 'custom-exec-id');
      expect((result as any).content[0].text).toContain('Execution started: custom-exec-id');
      expect((result as any).content[0].text).toContain('(set as current)');
    });

    it('should handle restart errors', async () => {
      mockVMManager.restartExecution.mockRejectedValue(new Error('Program not found'));

      const result = await testTransport.callTool('restart', {
        programId: 'non-existent'
      });

      expect((result as any).content[0].text).toContain('Error: Program not found');
      expect((result as any).isError).toBe(true);
    });
  });
});