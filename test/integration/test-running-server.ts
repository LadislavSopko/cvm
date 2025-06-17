import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

async function testRunningServer() {
  console.log('=== Testing CVM Server ===\n');

  // Connect to already running server
  const transport = new StdioClientTransport({
    command: 'node',
    args: [join(process.cwd(), 'apps/cvm-server/dist/main.cjs')],
    env: {
      ...process.env,
      CVM_STORAGE: 'file',
      CVM_LOG_LEVEL: 'error'  // Reduce noise
    }
  });

  const client = new Client({
    name: 'test-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  try {
    await client.connect(transport);
    console.log('✓ Connected to CVM server\n');

    // Load program
    const source = readFileSync(join(process.cwd(), 'test/programs/test-output.cvm'), 'utf-8');
    console.log('Loading program...');
    const loadResult = await client.callTool('load', {
      programId: 'test-output',
      source
    });
    console.log('✓', loadResult.content[0].text, '\n');

    // Start execution
    const executionId = 'test-' + Date.now();
    console.log('Starting execution:', executionId);
    await client.callTool('start', {
      programId: 'test-output',
      executionId
    });
    console.log('✓ Execution started\n');

    // Process cognitive calls
    let taskCount = 1;
    while (true) {
      const taskResult = await client.callTool('getTask', { executionId });
      const task = JSON.parse(taskResult.content[0].text);
      
      if (task.state === 'COMPLETED') {
        console.log('✓ Execution completed!\n');
        break;
      } else if (task.state === 'ERROR') {
        console.error('✗ Execution error:', task);
        break;
      } else if (task.state === 'AWAITING_COGNITIVE_RESULT') {
        console.log(`Task ${taskCount}: ${task.message}`);
        
        // Provide responses
        const response = taskCount === 1 ? 'TestUser' : '42';
        console.log(`Responding with: ${response}`);
        
        await client.callTool('submitTask', {
          executionId,
          result: response
        });
        console.log('✓ Response submitted\n');
        taskCount++;
      }
    }

    // Check output
    const outputPath = join(process.cwd(), '.cvm/outputs', executionId + '.output');
    console.log('Checking output file:', outputPath);
    
    if (existsSync(outputPath)) {
      const output = readFileSync(outputPath, 'utf-8');
      console.log('\n=== Program Output ===');
      console.log(output);
      console.log('===================\n');
      console.log('✓ Output file verified!');
    } else {
      console.error('✗ Output file not found!');
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await client.close();
  }
}

testRunningServer().catch(console.error);