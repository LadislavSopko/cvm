import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { 
  JSONRPCMessage, 
  CallToolRequest, 
  CallToolResult,
  InitializeRequest
} from '@modelcontextprotocol/sdk/types.js';

/**
 * Test transport that allows direct invocation of registered tools
 * through the MCP protocol, ensuring we test the exact same code path as production
 */
export class TestTransport implements Transport {
  private messageId = 1;
  private responseHandlers = new Map<string | number, (response: any) => void>();
  private serverMessageHandler?: (message: JSONRPCMessage) => void;
  
  // Track initialization state
  private initialized = false;

  async start(): Promise<void> {
    // Initialize the MCP connection
    await this.initialize();
  }

  async close(): Promise<void> {
    this.responseHandlers.clear();
    this.serverMessageHandler = undefined;
    this.initialized = false;
  }

  // Set the server's message handler
  set onmessage(handler: (message: JSONRPCMessage) => void) {
    this.serverMessageHandler = handler;
  }

  async send(message: JSONRPCMessage): Promise<void> {
    // Handle responses to our requests
    if ('id' in message && message.id !== null && this.responseHandlers.has(message.id)) {
      const handler = this.responseHandlers.get(message.id)!;
      this.responseHandlers.delete(message.id);
      handler(message);
    }
  }

  /**
   * Initialize the MCP connection
   */
  private async initialize(): Promise<void> {
    const id = this.messageId++;
    
    const request = {
      jsonrpc: '2.0',
      id,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    } as InitializeRequest;

    const response = await this.sendRequest(request as unknown as JSONRPCMessage);
    if ('error' in response) {
      throw new Error(`Failed to initialize: ${response.error.message}`);
    }
    this.initialized = true;
  }

  /**
   * Send a request and wait for response
   */
  private async sendRequest(request: JSONRPCMessage): Promise<any> {
    return new Promise((resolve) => {
      if ('id' in request && request.id !== null) {
        this.responseHandlers.set(request.id, resolve);
      }
      
      // Send to server
      if (this.serverMessageHandler) {
        this.serverMessageHandler(request);
      }
    });
  }

  /**
   * Invoke a tool through the MCP protocol
   * This ensures we test the exact same code path as production
   */
  async callTool(toolName: string, args: any): Promise<CallToolResult | { error: any }> {
    if (!this.initialized) {
      throw new Error('Transport not initialized');
    }

    const id = this.messageId++;
    
    const request = {
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    } as CallToolRequest;

    const response = await this.sendRequest(request as unknown as JSONRPCMessage);
    if ('error' in response) {
      return { error: response.error };
    }
    return response.result as CallToolResult;
  }
}