import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { z } from 'zod';
import { VMManager } from '@cvm/vm';

/**
 * MCP Server - A thin interface layer for the CVM
 * All execution logic is handled by VMManager
 */
export class CVMMcpServer {
  private server: McpServer;
  private transport: Transport | null = null;
  private vmManager: VMManager;
  private version: string;

  constructor(version: string = '0.0.1') {
    this.version = version;
    this.vmManager = new VMManager();
    this.server = new McpServer({
      name: 'cvm-server',
      version: this.version
    });

    this.setupTools();
  }

  getName(): string {
    return 'cvm-server';
  }

  getVersion(): string {
    return this.version;
  }

  private setupTools(): void {
    // Load a CVM program
    this.server.tool(
      'load',
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
      'start',
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
      'getTask',
      {
        executionId: z.string()
      },
      async ({ executionId }) => {
        try {
          const result = await this.vmManager.getNext(executionId);
          
          if (result.type === 'completed') {
            const response = result.result !== undefined 
              ? `Execution completed with result: ${JSON.stringify(result.result)}`
              : 'Execution completed';
            return {
              content: [{ type: 'text', text: response }]
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
      'submitTask',
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
      'status',
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

  async start(transport?: Transport): Promise<void> {
    await this.vmManager.initialize();
    // Allow transport injection for testing, default to stdio for production
    this.transport = transport || new StdioServerTransport();
    await this.server.connect(this.transport);
  }

  async stop(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
    await this.vmManager.dispose();
  }

  // For testing - expose VMManager for direct testing
  getVMManager(): VMManager {
    return this.vmManager;
  }
}