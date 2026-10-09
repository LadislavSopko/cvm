#!/usr/bin/env node
/**
 * MCP test client for CVM using the official SDK
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { parseClientArgs, decideOutcome, Outcome } from '../../packages/integration/src/e2e-outcome.js';

class CVMMcpTestClient {
  private client: Client;
  private transport: StdioClientTransport;

  constructor() {
    this.client = new Client({
      name: 'cvm-test-client',
      version: '1.0.0'
    });

    // Connect to CVM server via stdio
    // Run server from current directory (test/integration)
    this.transport = new StdioClientTransport({
      command: 'node',
      args: ['../../apps/cvm-server/dist/main.cjs'],
      env: {
        ...process.env,
        CVM_STORAGE: 'file',
        CVM_DATA_DIR: '.cvm',
        CVM_LOG_LEVEL: process.env.CVM_LOG_LEVEL || 'info',
        CVM_SANDBOX_PATHS: process.env.CVM_SANDBOX_PATHS || '/home/laco/cvm/test/integration'
      }
    });
  }

  async connect(): Promise<void> {
    await this.client.connect(this.transport);
    console.log('✓ Connected to CVM server\n');
  }

  async runTest(programPath: string, responses: string[], expectError?: string): Promise<Outcome> {
    console.log('=== CVM MCP Test Client ===\n');

    try {
      // Load program
      const source = readFileSync(programPath, 'utf-8');
      const programId = 'test-' + Date.now();
      
      console.log(`Loading program: ${programPath}`);
      const loadResult = await this.client.callTool({
        name: 'load',
        arguments: { programId, source }
      });
      const loadText = (loadResult.content as any)[0].text as string;
      if (loadResult.isError || loadText.startsWith('Error:')) {
        console.error('✗ Program load failed:', loadText);
        return decideOutcome({ loadError: loadText, finalText: '', outputFound: false, expectError });
      }
      console.log('✓ Program loaded:', loadText);
      console.log();

      // Start execution
      const executionId = 'exec-' + Date.now();
      console.log(`Starting execution: ${executionId}`);
      const startResult = await this.client.callTool({
        name: 'start',
        arguments: { programId, executionId }
      });
      const startText = (startResult.content as any)[0].text as string;
      if (startResult.isError || startText.startsWith('Error:')) {
        console.error('✗ Execution start failed:', startText);
        return decideOutcome({ startError: startText, finalText: '', outputFound: false, expectError });
      }
      console.log('✓ Execution started:', startText);
      console.log();

      // Process CC calls
      let responseIndex = 0;
      let done = false;
      let finalText = '';

      while (!done) {
        const taskResult = await this.client.callTool({
          name: 'getTask',
          arguments: { executionId }
        });
        
        const taskText = (taskResult.content as any)[0].text;

        if (taskText === 'Execution completed' || taskText.startsWith('Execution completed with result:')) {
          console.log('✓ Execution completed successfully!\n');
          finalText = taskText;
          done = true;
        } else if (taskText.startsWith('Error:')) {
          console.error('✗ Execution error:', taskText);
          finalText = taskText;
          done = true;
        } else {
          // Must be a CC prompt
          console.log(`CC Prompt: "${taskText}"`);
          
          if (responseIndex >= responses.length) {
            throw new Error('No more responses available for CC prompt');
          }

          const response = responses[responseIndex++];
          console.log(`Responding: "${response}"`);
          
          const submitResult = await this.client.callTool({
            name: 'submitTask',
            arguments: { executionId, result: response }
          });
          console.log('✓ Response submitted:', (submitResult.content as any)[0].text);
          console.log();
        }
      }

      // Check output file in test/integration/.cvm/outputs/
      const outputPath = join(process.cwd(), '.cvm/outputs', `${executionId}.output`);
      console.log(`Checking output file: ${outputPath}`);
      
      // Give it a moment to write
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let outputFound = false;
      try {
        const output = readFileSync(outputPath, 'utf-8');
        outputFound = true;
        console.log('\n=== Program Output ===');
        console.log(output);
        console.log('===================\n');
        console.log('✓ Output file verified!');
      } catch {
        console.log('(no output file: program printed nothing)');
      }

      return decideOutcome({ finalText, outputFound, expectError });

    } finally {
      await this.cleanup();
    }
  }

  async cleanup(): Promise<void> {
    await this.transport.close();
    console.log('\n✓ Disconnected from server');
  }
}

// Run test if called directly
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error('Usage: mcp-test-client.ts <program.ts> [response1] [response2] ...');
  console.error('Example: mcp-test-client.ts test.ts "Alice" "25"');
  process.exit(1);
}

const { programPath, responses, expectError } = parseClientArgs(args);

const client = new CVMMcpTestClient();

client.connect()
  .then(() => client.runTest(programPath, responses, expectError))
  .then((outcome) => {
    console.log(`${outcome.exitCode === 0 ? '✓' : '✗'} Outcome: ${outcome.reason}`);
    process.exit(outcome.exitCode);
  })
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  });