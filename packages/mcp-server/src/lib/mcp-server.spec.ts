import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { CVMMcpServer } from './mcp-server.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { MongoDBAdapter } from '@cvm/mongodb';

describe('CVMMcpServer', () => {
  let server: CVMMcpServer;
  let mockDb: MongoDBAdapter;

  beforeAll(async () => {
    mockDb = {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      isConnected: vi.fn().mockReturnValue(true),
      saveProgram: vi.fn().mockResolvedValue(undefined),
      getProgram: vi.fn(),
      saveExecution: vi.fn().mockResolvedValue(undefined),
      getExecution: vi.fn(),
      saveHistory: vi.fn().mockResolvedValue(undefined),
      getHistory: vi.fn().mockResolvedValue([]),
      getCollections: vi.fn().mockResolvedValue(['programs', 'executions', 'history']),
    } as any;

    server = new CVMMcpServer(mockDb);
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
    it('should parse and store a valid program', async () => {
      const source = `function main() {
  const name = "World";
  console.log("Hello, " + name);
  CC("What should I say next?");
}
main();`;

      mockDb.saveProgram = vi.fn().mockResolvedValue(undefined);

      const result = await server.handleTool('loadProgram', {
        programId: 'test-prog-1',
        source
      });

      expect(result.content[0].text).toContain('Program loaded successfully');
      expect(mockDb.saveProgram).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-prog-1',
          source,
          bytecode: expect.any(Uint8Array)
        })
      );
    });

    it('should reject program with syntax errors', async () => {
      const source = `
        function main() {
          const x = // syntax error
        }
      `;

      const result = await server.handleTool('loadProgram', {
        programId: 'test-prog-2',
        source
      });

      expect(result.content[0].text).toContain('error');
      expect(result.isError).toBe(true);
    });

    it('should reject program without main function', async () => {
      const source = `
        function helper() {
          console.log("No main");
        }
      `;

      const result = await server.handleTool('loadProgram', {
        programId: 'test-prog-3',
        source
      });

      expect(result.content[0].text).toContain('main()');
      expect(result.isError).toBe(true);
    });
  });

  describe('startExecution tool', () => {
    it('should start execution of a loaded program', async () => {
      const mockProgram = {
        id: 'test-prog-1',
        source: 'function main() {}',
        bytecode: new Uint8Array([4, 0, 0, 0, 72, 65, 76, 84]),
        created: new Date()
      };

      mockDb.getProgram = vi.fn().mockResolvedValue(mockProgram);
      mockDb.saveExecution = vi.fn().mockResolvedValue(undefined);

      const result = await server.handleTool('startExecution', {
        programId: 'test-prog-1',
        executionId: 'exec-1'
      });

      expect(result.content[0].text).toContain('Execution started');
      expect(mockDb.saveExecution).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'exec-1',
          programId: 'test-prog-1',
          state: 'ready'
        })
      );
    });

    it('should fail if program not found', async () => {
      mockDb.getProgram = vi.fn().mockResolvedValue(null);

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
      const mockExecution = {
        id: 'exec-1',
        programId: 'test-prog-1',
        state: 'ready',
        pc: 0,
        stack: [],
        variables: {},
        created: new Date()
      };

      // Build bytecode exactly as the server expects it
      const bytecodeBuilder: number[] = [];
      
      // Helper to add length-prefixed string
      const addInstruction = (opcode: string, arg?: string) => {
        const opcodeBytes = new TextEncoder().encode(opcode);
        const lengthBytes = new Uint8Array(4);
        new DataView(lengthBytes.buffer).setUint32(0, opcodeBytes.length, true);
        bytecodeBuilder.push(...lengthBytes);
        bytecodeBuilder.push(...opcodeBytes);
        
        if (arg !== undefined) {
          const argBytes = new TextEncoder().encode(arg);
          const argLengthBytes = new Uint8Array(4);
          new DataView(argLengthBytes.buffer).setUint32(0, argBytes.length, true);
          bytecodeBuilder.push(...argLengthBytes);
          bytecodeBuilder.push(...argBytes);
        }
      };
      
      // Add instructions
      addInstruction('PUSH', 'Hello World?');
      addInstruction('CC');
      addInstruction('HALT');
      
      const mockProgram = {
        id: 'test-prog-1',
        source: '',
        bytecode: new Uint8Array(bytecodeBuilder),
        created: new Date()
      };

      mockDb.getExecution = vi.fn().mockResolvedValue(mockExecution);
      mockDb.getProgram = vi.fn().mockResolvedValue(mockProgram);
      mockDb.saveExecution = vi.fn().mockResolvedValue(undefined);
      mockDb.saveHistory = vi.fn().mockResolvedValue(undefined);

      const result = await server.handleTool('getNext', {
        executionId: 'exec-1'
      });

      // Let's check what we actually got
      if (result.content[0].text !== 'Hello World?') {
        console.error('Expected "Hello World?" but got:', result.content[0].text);
        console.error('Result:', JSON.stringify(result, null, 2));
      }

      expect(result.content[0].text).toContain('Hello World?');
      expect(mockDb.saveExecution).toHaveBeenCalledWith(
        expect.objectContaining({
          state: 'running'
        })
      );
    });

    it('should return completion status when program finishes', async () => {
      const mockExecution = {
        id: 'exec-1',
        programId: 'test-prog-1',
        state: 'ready',
        pc: 0,
        stack: [],
        variables: {},
        created: new Date()
      };

      const mockProgram = {
        id: 'test-prog-1',
        source: '',
        bytecode: new Uint8Array([4, 0, 0, 0, 72, 65, 76, 84]), // Just HALT
        created: new Date()
      };

      mockDb.getExecution = vi.fn().mockResolvedValue(mockExecution);
      mockDb.getProgram = vi.fn().mockResolvedValue(mockProgram);
      mockDb.saveExecution = vi.fn().mockResolvedValue(undefined);

      const result = await server.handleTool('getNext', {
        executionId: 'exec-1'
      });

      expect(result.content[0].text).toContain('completed');
      expect(mockDb.saveExecution).toHaveBeenCalledWith(
        expect.objectContaining({
          state: 'completed'
        })
      );
    });
  });

  describe('reportCCResult tool', () => {
    it('should resume execution with CC result', async () => {
      const mockExecution = {
        id: 'exec-1',
        programId: 'test-prog-1',
        state: 'running',
        pc: 30, // After CC - this will be calculated by VM during execution
        stack: [],
        variables: {},
        created: new Date()
      };

      // Build bytecode exactly as the server expects it
      const bytecodeBuilder: number[] = [];
      
      // Helper to add length-prefixed string
      const addInstruction = (opcode: string, arg?: string) => {
        const opcodeBytes = new TextEncoder().encode(opcode);
        const lengthBytes = new Uint8Array(4);
        new DataView(lengthBytes.buffer).setUint32(0, opcodeBytes.length, true);
        bytecodeBuilder.push(...lengthBytes);
        bytecodeBuilder.push(...opcodeBytes);
        
        if (arg !== undefined) {
          const argBytes = new TextEncoder().encode(arg);
          const argLengthBytes = new Uint8Array(4);
          new DataView(argLengthBytes.buffer).setUint32(0, argBytes.length, true);
          bytecodeBuilder.push(...argLengthBytes);
          bytecodeBuilder.push(...argBytes);
        }
      };
      
      // Add instructions
      addInstruction('PUSH', 'Hello World?');
      addInstruction('CC');
      addInstruction('PRINT');
      addInstruction('HALT');
      
      const mockProgram = {
        id: 'test-prog-1',
        source: '',
        bytecode: new Uint8Array(bytecodeBuilder),
        created: new Date()
      };

      mockDb.getExecution = vi.fn().mockResolvedValue(mockExecution);
      mockDb.getProgram = vi.fn().mockResolvedValue(mockProgram);
      mockDb.saveExecution = vi.fn().mockResolvedValue(undefined);
      mockDb.saveHistory = vi.fn().mockResolvedValue(undefined);

      const result = await server.handleTool('reportCCResult', {
        executionId: 'exec-1',
        result: 'Goodbye!'
      });

      expect(result.content[0].text).toContain('resumed');
      expect(mockDb.saveHistory).toHaveBeenCalled();
    });
  });

  describe('getExecutionState tool', () => {
    it('should return current execution state', async () => {
      const mockExecution = {
        id: 'exec-1',
        programId: 'test-prog-1',
        state: 'running',
        pc: 10,
        stack: ['Hello', 'World'],
        variables: { x: 42 },
        created: new Date()
      };

      const mockHistory = [
        {
          executionId: 'exec-1',
          step: 1,
          pc: 0,
          instruction: 'PUSH',
          stack: ['Hello'],
          variables: {},
          timestamp: new Date()
        }
      ];

      mockDb.getExecution = vi.fn().mockResolvedValue(mockExecution);
      mockDb.getHistory = vi.fn().mockResolvedValue(mockHistory);

      const result = await server.handleTool('getExecutionState', {
        executionId: 'exec-1'
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.state).toBe('running');
      expect(response.pc).toBe(10);
      expect(response.stack).toEqual(['Hello', 'World']);
      expect(response.variables).toEqual({ x: 42 });
      expect(response.history).toHaveLength(1);
    });
  });
});