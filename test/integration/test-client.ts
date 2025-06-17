import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

async function testCVMServer() {
  console.log('=== CVM Server Integration Test ===\n');

  // Spawn the CVM server with file storage
  console.log('1. Starting CVM server with file storage...');
  const serverProcess = spawn('node', [
    join(process.cwd(), 'apps/cvm-server/dist/main.cjs')
  ], {
    env: {
      ...process.env,
      CVM_STORAGE: 'file',
      CVM_LOG_LEVEL: 'info'
    }
  });

  // Create MCP client
  const transport = new StdioClientTransport({
    command: 'node',
    args: [join(process.cwd(), 'apps/cvm-server/dist/main.cjs')],
    env: {
      ...process.env,
      CVM_STORAGE: 'file',
      CVM_LOG_LEVEL: 'info'
    }
  });

  const client = new Client({
    name: 'test-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  try {
    // Connect to server
    console.log('2. Connecting to CVM server...');
    await client.connect(transport);
    console.log('   Connected successfully!\n');

    // List available tools
    console.log('3. Listing available tools...');
    const tools = await client.listTools();
    console.log('   Available tools:');
    tools.tools.forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.description}`);
    });
    console.log();

    // Load the test program
    console.log('4. Loading test program...');
    const source = readFileSync(join(process.cwd(), 'test/programs/test-output.cvm'), 'utf-8');
    const loadResult = await client.callTool('load', {
      programId: 'test-output',
      source
    });
    console.log('   Result:', loadResult.content[0].text);
    console.log();

    // Start execution
    console.log('5. Starting execution...');
    const startResult = await client.callTool('start', {
      programId: 'test-output',
      executionId: 'test-exec-1'
    });
    console.log('   Result:', startResult.content[0].text);
    console.log();

    // Get first task (should be waiting for CC)
    console.log('6. Getting first task...');
    const task1 = await client.callTool('getTask', {
      executionId: 'test-exec-1'
    });
    const task1Data = JSON.parse(task1.content[0].text);
    console.log('   State:', task1Data.state);
    console.log('   Message:', task1Data.message);
    console.log();

    // Submit first CC result
    if (task1Data.state === 'AWAITING_COGNITIVE_RESULT') {
      console.log('7. Submitting first CC result...');
      const submit1 = await client.callTool('submitTask', {
        executionId: 'test-exec-1',
        result: 'Alice'
      });
      console.log('   Result:', submit1.content[0].text);
      console.log();

      // Get second task
      console.log('8. Getting second task...');
      const task2 = await client.callTool('getTask', {
        executionId: 'test-exec-1'
      });
      const task2Data = JSON.parse(task2.content[0].text);
      console.log('   State:', task2Data.state);
      console.log('   Message:', task2Data.message);
      console.log();

      // Submit second CC result
      if (task2Data.state === 'AWAITING_COGNITIVE_RESULT') {
        console.log('9. Submitting second CC result...');
        const submit2 = await client.callTool('submitTask', {
          executionId: 'test-exec-1',
          result: '25'
        });
        console.log('   Result:', submit2.content[0].text);
        console.log();

        // Get final status
        console.log('10. Getting final status...');
        const finalTask = await client.callTool('getTask', {
          executionId: 'test-exec-1'
        });
        const finalData = JSON.parse(finalTask.content[0].text);
        console.log('    State:', finalData.state);
        console.log();
      }
    }

    // Check status
    console.log('11. Checking execution status...');
    const status = await client.callTool('status', {
      executionId: 'test-exec-1'
    });
    const statusData = JSON.parse(status.content[0].text);
    console.log('    Final state:', statusData.state);
    console.log('    PC:', statusData.pc);
    console.log('    Variables:', statusData.variables);
    console.log();

    // Check output file
    console.log('12. Checking output file...');
    const outputPath = join(process.cwd(), '.cvm/outputs/test-exec-1.output');
    if (existsSync(outputPath)) {
      const output = readFileSync(outputPath, 'utf-8');
      console.log('    Output file found!');
      console.log('    Contents:');
      console.log('    --------------------');
      output.split('\n').forEach(line => {
        if (line) console.log('    ' + line);
      });
      console.log('    --------------------');
    } else {
      console.log('    ERROR: Output file not found at', outputPath);
    }

    console.log('\n=== Test Complete ===');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Cleanup
    await client.close();
    serverProcess.kill();
    process.exit(0);
  }
}

// Run the test
testCVMServer().catch(console.error);