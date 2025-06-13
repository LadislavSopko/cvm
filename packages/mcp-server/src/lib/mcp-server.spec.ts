import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { CVMMcpServer } from './mcp-server.js';
import { VMManager } from '@cvm/vm';
import { MongoDBAdapter } from '@cvm/mongodb';

// Mock the VMManager module
vi.mock('@cvm/vm', () => ({
  VMManager: vi.fn().mockImplementation(() => ({
    loadProgram: vi.fn(),
    startExecution: vi.fn(),
    getNext: vi.fn(),
    reportCCResult: vi.fn(),
    getExecutionStatus: vi.fn()
  }))
}));

describe('CVMMcpServer', () => {
  let server: CVMMcpServer;
  let mockVMManager: any;
  let mockDb: MongoDBAdapter;

  beforeAll(async () => {
    // Create a minimal mock DB (MCP server doesn't use it directly)
    mockDb = {} as MongoDBAdapter;
    
    // Create server
    server = new CVMMcpServer(mockDb);
    
    // Get the mocked VMManager instance
    mockVMManager = (VMManager as any).mock.results[0].value;
  });

  afterAll(async () => {
    await server.stop();
  });

  describe('initialization', () => {
    it('should create MCP server with CVM tools', () => {
      expect(server).toBeDefined();
      expect(server.getName()).toBe('cvm-server');
      expect(server.getVersion()).toBe('1.0.0');
    });
  });

  describe('loadProgram tool', () => {
    it('should call VMManager.loadProgram for valid program', async () => {
      const source = `function main() {
  const name = "World";
  console.log("Hello, " + name);
  CC("What should I say next?");
}
main();`;

      mockVMManager.loadProgram.mockResolvedValueOnce(undefined);

      const result = await server.handleTool('loadProgram', {
        programId: 'test-prog-1',
        source
      });

      expect(result.content[0].text).toContain('Program loaded successfully');
      expect(mockVMManager.loadProgram).toHaveBeenCalledWith('test-prog-1', source);
    });

    it('should return error when VMManager throws', async () => {
      const source = `
        function main() {
          const x = // syntax error
        }
      `;

      mockVMManager.loadProgram.mockRejectedValueOnce(
        new Error('Compilation failed: main() must be called at the top level')
      );

      const result = await server.handleTool('loadProgram', {
        programId: 'test-prog-2',
        source
      });

      expect(result.content[0].text).toContain('Compilation failed: ');
      expect(result.isError).toBe(true);
    });

    it('should handle programs without main function', async () => {
      const source = `
        function helper() {
          console.log("No main");
        }
      `;

      mockVMManager.loadProgram.mockRejectedValueOnce(
        new Error('Compilation failed: Program must have a main() function')
      );

      const result = await server.handleTool('loadProgram', {
        programId: 'test-prog-3',
        source
      });

      expect(result.content[0].text).toContain('Compilation failed: ');
      expect(result.content[0].text).toContain('main()');
      expect(result.isError).toBe(true);
    });
  });

  describe('startExecution tool', () => {
    it('should call VMManager.startExecution', async () => {
      mockVMManager.startExecution.mockResolvedValueOnce(undefined);

      const result = await server.handleTool('startExecution', {
        programId: 'test-prog-1',
        executionId: 'exec-1'
      });

      expect(result.content[0].text).toContain('Execution started');
      expect(mockVMManager.startExecution).toHaveBeenCalledWith('test-prog-1', 'exec-1');
    });

    it('should handle program not found error', async () => {
      mockVMManager.startExecution.mockRejectedValueOnce(
        new Error('Program not found: non-existent')
      );

      const result = await server.handleTool('startExecution', {
        programId: 'non-existent',
        executionId: 'exec-2'
      });

      expect(result.content[0].text).toContain('Program not found');
      expect(result.isError).toBe(true);
    });
  });

  describe('getNext tool', () => {
    it('should return CC prompt when VM pauses', async () => {
      mockVMManager.getNext.mockResolvedValueOnce({
        type: 'waiting',
        message: 'What should I say next?'
      });

      const result = await server.handleTool('getNext', {
        executionId: 'exec-1'
      });

      expect(result.content[0].text).toBe('What should I say next?');
      expect(mockVMManager.getNext).toHaveBeenCalledWith('exec-1');
    });

    it('should return completion status when program finishes', async () => {
      mockVMManager.getNext.mockResolvedValueOnce({
        type: 'completed',
        message: 'Execution completed'
      });

      const result = await server.handleTool('getNext', {
        executionId: 'exec-1'
      });

      expect(result.content[0].text).toContain('completed');
      expect(mockVMManager.getNext).toHaveBeenCalledWith('exec-1');
    });

    it('should handle execution errors', async () => {
      mockVMManager.getNext.mockResolvedValueOnce({
        type: 'error',
        error: 'Stack overflow'
      });

      const result = await server.handleTool('getNext', {
        executionId: 'exec-1'
      });

      expect(result.content[0].text).toContain('Error: Stack overflow');
      expect(result.isError).toBe(true);
    });
  });

  describe('reportCCResult tool', () => {
    it('should call VMManager.reportCCResult', async () => {
      mockVMManager.reportCCResult.mockResolvedValueOnce(undefined);

      const result = await server.handleTool('reportCCResult', {
        executionId: 'exec-1',
        result: 'Goodbye!'
      });

      expect(result.content[0].text).toContain('resumed');
      expect(mockVMManager.reportCCResult).toHaveBeenCalledWith('exec-1', 'Goodbye!');
    });

    it('should handle errors during resume', async () => {
      mockVMManager.reportCCResult.mockRejectedValueOnce(
        new Error('Execution not found')
      );

      const result = await server.handleTool('reportCCResult', {
        executionId: 'non-existent',
        result: 'test'
      });

      expect(result.content[0].text).toContain('Execution not found');
      expect(result.isError).toBe(true);
    });
  });

  describe('getExecutionState tool', () => {
    it('should return current execution state', async () => {
      const mockStatus = {
        id: 'exec-1',
        state: 'running',
        pc: 10,
        stack: ['Hello', 'World'],
        variables: { x: 42 },
        output: ['Hello World'],
        history: [
          {
            step: 1,
            pc: 0,
            instruction: 'PUSH',
            stack: ['Hello'],
            variables: {},
            timestamp: new Date()
          }
        ]
      };

      mockVMManager.getExecutionStatus.mockResolvedValueOnce(mockStatus);

      const result = await server.handleTool('getExecutionState', {
        executionId: 'exec-1'
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.state).toBe('running');
      expect(response.pc).toBe(10);
      expect(response.stack).toEqual(['Hello', 'World']);
      expect(response.variables).toEqual({ x: 42 });
      expect(response.history).toHaveLength(1);
      expect(mockVMManager.getExecutionStatus).toHaveBeenCalledWith('exec-1');
    });

    it('should handle execution not found', async () => {
      mockVMManager.getExecutionStatus.mockRejectedValueOnce(
        new Error('Execution not found: non-existent')
      );

      const result = await server.handleTool('getExecutionState', {
        executionId: 'non-existent'
      });

      expect(result.content[0].text).toContain('Execution not found');
      expect(result.isError).toBe(true);
    });
  });
});