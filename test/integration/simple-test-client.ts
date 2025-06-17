#!/usr/bin/env node
/**
 * Simple test client for CVM that provides pre-programmed responses to CC prompts
 * This simulates what Claude would do, but with fixed responses
 */

import { spawn, ChildProcess } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: any;
  id: number;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  result?: any;
  error?: { code: number; message: string };
  id: number;
}

class CVMTestClient {
  private server: ChildProcess;
  private requestId = 1;
  private responseHandlers = new Map<number, (response: JsonRpcResponse) => void>();
  private buffer = '';

  constructor() {
    // Start CVM server with file storage
    this.server = spawn('node', [
      join(process.cwd(), 'apps/cvm-server/dist/main.cjs')
    ], {
      stdio: ['pipe', 'pipe', 'inherit'], // inherit stderr to see server logs
      env: {
        ...process.env,
        CVM_STORAGE: 'file',
        CVM_LOG_LEVEL: 'info'
      }
    });

    // Handle server stdout (JSON-RPC responses)
    this.server.stdout!.on('data', (data) => {
      this.buffer += data.toString();
      this.processBuffer();
    });

    this.server.on('error', (err) => {
      console.error('Server error:', err);
    });
  }

  private processBuffer() {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim() && line.startsWith('{')) {
        try {
          const msg = JSON.parse(line);
          if (msg.id && this.responseHandlers.has(msg.id)) {
            const handler = this.responseHandlers.get(msg.id)!;
            this.responseHandlers.delete(msg.id);
            handler(msg);
          }
        } catch (e) {
          // Not JSON, ignore
        }
      }
    }
  }

  private async callTool(name: string, params: any): Promise<any> {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name,
        arguments: params
      },
      id: this.requestId++
    };

    return new Promise((resolve, reject) => {
      this.responseHandlers.set(request.id, (response) => {
        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response.result);
        }
      });

      this.server.stdin!.write(JSON.stringify(request) + '\n');
    });
  }

  async waitForServer(timeout = 5000): Promise<void> {
    // Give server time to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to list tools to verify server is ready
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        await this.callTool('listTools', {});
        return;
      } catch {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    throw new Error('Server did not start in time');
  }

  async runTest(programPath: string, responses: string[]): Promise<void> {
    console.log('=== CVM Test Client ===\n');

    try {
      // Wait for server to be ready
      console.log('Waiting for server...');
      await this.waitForServer();
      console.log('✓ Server ready\n');

      // Load program
      const source = readFileSync(programPath, 'utf-8');
      const programId = 'test-' + Date.now();
      
      console.log(`Loading program: ${programPath}`);
      const loadResult = await this.callTool('load', { programId, source });
      console.log('✓ Program loaded\n');

      // Start execution
      const executionId = 'exec-' + Date.now();
      console.log(`Starting execution: ${executionId}`);
      await this.callTool('start', { programId, executionId });
      console.log('✓ Execution started\n');

      // Process CC calls
      let responseIndex = 0;
      let done = false;

      while (!done) {
        const taskResult = await this.callTool('getTask', { executionId });
        const taskText = taskResult.content[0].text;

        if (taskText === 'Execution completed') {
          console.log('✓ Execution completed successfully!\n');
          done = true;
        } else if (taskText.startsWith('Error:')) {
          console.error('✗ Execution error:', taskText);
          done = true;
        } else {
          // Must be a CC prompt
          console.log(`CC Prompt: "${taskText}"`);
          
          if (responseIndex >= responses.length) {
            throw new Error('No more responses available for CC prompt');
          }

          const response = responses[responseIndex++];
          console.log(`Responding: "${response}"`);
          
          await this.callTool('submitTask', { executionId, result: response });
          console.log('✓ Response submitted\n');
        }
      }

      // Check output file
      const outputPath = join(process.cwd(), '.cvm/outputs', `${executionId}.output`);
      console.log('Checking output file...');
      
      // Give it a moment to write
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        const output = readFileSync(outputPath, 'utf-8');
        console.log('\n=== Program Output ===');
        console.log(output);
        console.log('===================\n');
        console.log('✓ Output file verified!');
      } catch (e) {
        console.error('✗ Could not read output file:', e);
      }

    } finally {
      this.cleanup();
    }
  }

  cleanup() {
    this.server.kill();
  }
}

// Run test if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('Usage: simple-test-client.ts <program.ts> [response1] [response2] ...');
    console.error('Example: simple-test-client.ts test.ts "Alice" "25"');
    process.exit(1);
  }

  const programPath = args[0];
  const responses = args.slice(1);

  const client = new CVMTestClient();
  
  client.runTest(programPath, responses)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Test failed:', err);
      process.exit(1);
    });
}