import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { VMManager } from '@cvm/vm';

/**
 * MCP Server - A thin interface layer for the CVM
 * All execution logic is handled by VMManager
 */
export class CVMMcpServer {
  private server: McpServer;
  private transport: StdioServerTransport | null = null;
  private vmManager: VMManager;

  constructor() {
    this.vmManager = new VMManager();
    this.server = new McpServer({
      name: 'cvm-server',
      version: '1.0.0'
    });

    this.setupTools();
  }

  getName(): string {
    return 'cvm-server';
  }

  getVersion(): string {
    return '1.0.0';
  }

  private setupTools(): void {
    // Load a CVM program
    this.server.tool(
      'loadProgram',
      {
        programId: z.string(),
        source: z.string()
      },
      async ({ programId, source }) => {
        try {
          await this.vmManager.loadProgram(programId, source);
          return {
            content: [{ type: 'text', text: `Program loaded successfully: ${programId}` }]
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
            isError: true
          };
        }
      }
    );

    // Start execution of a program
    this.server.tool(
      'startExecution',
      {
        programId: z.string(),
        executionId: z.string()
      },
      async ({ programId, executionId }) => {
        try {
          await this.vmManager.startExecution(programId, executionId);
          return {
            content: [{ type: 'text', text: `Execution started: ${executionId}` }]
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
            isError: true
          };
        }
      }
    );

    // Get next CC prompt or completion status
    this.server.tool(
      'getNext',
      {
        executionId: z.string()
      },
      async ({ executionId }) => {
        try {
          const result = await this.vmManager.getNext(executionId);
          
          if (result.type === 'completed') {
            return {
              content: [{ type: 'text', text: 'Execution completed' }]
            };
          } else if (result.type === 'waiting') {
            return {
              content: [{ type: 'text', text: result.message || 'Waiting for input' }]
            };
          } else if (result.type === 'error') {
            return {
              content: [{ type: 'text', text: `Error: ${result.error}` }],
              isError: true
            };
          }
          
          return {
            content: [{ type: 'text', text: 'Unexpected state' }],
            isError: true
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
            isError: true
          };
        }
      }
    );

    // Report CC result and continue execution
    this.server.tool(
      'reportCCResult',
      {
        executionId: z.string(),
        result: z.string()
      },
      async ({ executionId, result }) => {
        try {
          await this.vmManager.reportCCResult(executionId, result);
          return {
            content: [{ type: 'text', text: 'Execution resumed' }]
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
            isError: true
          };
        }
      }
    );

    // Get current execution state
    this.server.tool(
      'getExecutionState',
      {
        executionId: z.string()
      },
      async ({ executionId }) => {
        try {
          const status = await this.vmManager.getExecutionStatus(executionId);
          return {
            content: [{ type: 'text', text: JSON.stringify(status, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
            isError: true
          };
        }
      }
    );
  }

  async start(): Promise<void> {
    await this.vmManager.initialize();
    // StdioServerTransport uses process.stdin and process.stdout by default
    this.transport = new StdioServerTransport();
    await this.server.connect(this.transport);
  }

  async stop(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
    await this.vmManager.dispose();
  }

  // For testing - direct tool invocation
  async handleTool(toolName: string, args: any): Promise<any> {
    const handlers: Record<string, (args: any) => Promise<any>> = {
      loadProgram: async ({ programId, source }) => {
        try {
          await this.vmManager.loadProgram(programId, source);
          return { content: [{ type: 'text', text: `Program loaded successfully: ${programId}` }] };
        } catch (error) {
          return { content: [{ type: 'text', text: error instanceof Error ? error.message : 'Unknown error' }], isError: true };
        }
      },
      startExecution: async ({ programId, executionId }) => {
        try {
          await this.vmManager.startExecution(programId, executionId);
          return { content: [{ type: 'text', text: `Execution started: ${executionId}` }] };
        } catch (error) {
          return { content: [{ type: 'text', text: error instanceof Error ? error.message : 'Unknown error' }], isError: true };
        }
      },
      getNext: async ({ executionId }) => {
        try {
          const result = await this.vmManager.getNext(executionId);
          if (result.type === 'completed') {
            return { content: [{ type: 'text', text: 'Execution completed' }] };
          } else if (result.type === 'waiting') {
            return { content: [{ type: 'text', text: result.message || 'Waiting for input' }] };
          } else {
            return { content: [{ type: 'text', text: `Error: ${result.error}` }], isError: true };
          }
        } catch (error) {
          return { content: [{ type: 'text', text: error instanceof Error ? error.message : 'Unknown error' }], isError: true };
        }
      },
      reportCCResult: async ({ executionId, result }) => {
        try {
          await this.vmManager.reportCCResult(executionId, result);
          return { content: [{ type: 'text', text: 'Execution resumed' }] };
        } catch (error) {
          return { content: [{ type: 'text', text: error instanceof Error ? error.message : 'Unknown error' }], isError: true };
        }
      },
      getExecutionState: async ({ executionId }) => {
        try {
          const status = await this.vmManager.getExecutionStatus(executionId);
          return { content: [{ type: 'text', text: JSON.stringify(status, null, 2) }] };
        } catch (error) {
          return { content: [{ type: 'text', text: error instanceof Error ? error.message : 'Unknown error' }], isError: true };
        }
      }
    };

    const handler = handlers[toolName];
    if (!handler) {
      throw new Error(`Tool not found: ${toolName}`);
    }
    return await handler(args);
  }
}