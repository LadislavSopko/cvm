import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { CVMMcpServer } from './mcp-server.js';
import { TestTransport } from './test-transport.js';

// Mock VMManager at module level
vi.mock('@cvm/vm', () => ({
  VMManager: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    dispose: vi.fn(),
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

  describe('initialization', () => {
    it('should create MCP server with CVM tools', () => {
      expect(server).toBeDefined();
      expect(server.getName()).toBe('cvm-server');
      expect(server.getVersion()).toBe('1.0.0-test');
    });
  });

  describe('load tool', () => {
    it('should call VMManager.loadProgram for valid program', async () => {
      const source = `function main() {
  const name = "World";
  console.log("Hello, " + name);
  CC("What should I say next?");
}
main();`;

      mockVMManager.loadProgram.mockResolvedValueOnce(undefined);

      // Test the ACTUAL registered tool through MCP protocol
      const result = await testTransport.callTool('load', {
        programId: 'test-prog-1',
        source
      });
      
      expect(result).toHaveProperty('content');
      expect('content' in result && result.content[0].text).toContain('Program loaded successfully');
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

      const result = await testTransport.callTool('load', {
        programId: 'test-prog-2',
        source
      });

      expect('error' in result || ('content' in result && result.content[0].text)).toBeTruthy();
      if ('content' in result) {
        expect(result.content[0].text).toContain('Compilation failed: ');
      }
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

      const result = await testTransport.callTool('load', {
        programId: 'test-prog-3',
        source
      });

      if ('content' in result) {
        expect(result.content[0].text).toContain('Compilation failed: ');
        expect(result.content[0].text).toContain('main()');
      }
    });
  });

  describe('start tool', () => {
    it('should call VMManager.startExecution', async () => {
      mockVMManager.startExecution.mockResolvedValueOnce(undefined);

      const result = await testTransport.callTool('start', {
        programId: 'test-prog-1',
        executionId: 'exec-1'
      });

      expect('content' in result && result.content[0].text).toContain('Execution started');
      expect(mockVMManager.startExecution).toHaveBeenCalledWith('test-prog-1', 'exec-1');
    });

    it('should handle program not found error', async () => {
      mockVMManager.startExecution.mockRejectedValueOnce(
        new Error('Program not found: non-existent')
      );

      const result = await testTransport.callTool('start', {
        programId: 'non-existent',
        executionId: 'exec-2'
      });

      if ('content' in result) {
        expect(result.content[0].text).toContain('Program not found');
      }
    });
  });

  describe('getTask tool', () => {
    it('should return CC prompt when VM pauses', async () => {
      mockVMManager.getNext.mockResolvedValueOnce({
        type: 'waiting',
        message: 'What should I say next?'
      });

      const result = await testTransport.callTool('getTask', {
        executionId: 'exec-1'
      });

      expect('content' in result && result.content[0].text).toBe('What should I say next?');
      expect(mockVMManager.getNext).toHaveBeenCalledWith('exec-1');
    });

    it('should return completion status when program finishes', async () => {
      mockVMManager.getNext.mockResolvedValueOnce({
        type: 'completed',
        message: 'Execution completed'
      });

      const result = await testTransport.callTool('getTask', {
        executionId: 'exec-1'
      });

      expect('content' in result && result.content[0].text).toContain('completed');
      expect(mockVMManager.getNext).toHaveBeenCalledWith('exec-1');
    });

    it('should handle execution errors', async () => {
      mockVMManager.getNext.mockResolvedValueOnce({
        type: 'error',
        error: 'Stack overflow'
      });

      const result = await testTransport.callTool('getTask', {
        executionId: 'exec-1'
      });

      if ('content' in result) {
        expect(result.content[0].text).toContain('Error: Stack overflow');
      }
    });
  });

  describe('submitTask tool', () => {
    it('should call VMManager.reportCCResult', async () => {
      mockVMManager.reportCCResult.mockResolvedValueOnce(undefined);

      const result = await testTransport.callTool('submitTask', {
        executionId: 'exec-1',
        result: 'Goodbye!'
      });

      expect('content' in result && result.content[0].text).toContain('resumed');
      expect(mockVMManager.reportCCResult).toHaveBeenCalledWith('exec-1', 'Goodbye!');
    });

    it('should handle errors during resume', async () => {
      mockVMManager.reportCCResult.mockRejectedValueOnce(
        new Error('Execution not found')
      );

      const result = await testTransport.callTool('submitTask', {
        executionId: 'non-existent',
        result: 'test'
      });

      if ('content' in result) {
        expect(result.content[0].text).toContain('Execution not found');
      }
    });
  });

  describe('status tool', () => {
    it('should return current execution state', async () => {
      const mockStatus = {
        id: 'exec-1',
        state: 'RUNNING',
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

      const result = await testTransport.callTool('status', {
        executionId: 'exec-1'
      });

      if ('content' in result && result.content[0].type === 'text') {
        const response = JSON.parse(result.content[0].text);
        expect(response.state).toBe('RUNNING');
        expect(response.pc).toBe(10);
        expect(response.stack).toEqual(['Hello', 'World']);
        expect(response.variables).toEqual({ x: 42 });
        expect(response.history).toHaveLength(1);
      }
      expect(mockVMManager.getExecutionStatus).toHaveBeenCalledWith('exec-1');
    });

    it('should handle execution not found', async () => {
      mockVMManager.getExecutionStatus.mockRejectedValueOnce(
        new Error('Execution not found: non-existent')
      );

      const result = await testTransport.callTool('status', {
        executionId: 'non-existent'
      });

      if ('content' in result) {
        expect(result.content[0].text).toContain('Execution not found');
      }
    });
  });
});