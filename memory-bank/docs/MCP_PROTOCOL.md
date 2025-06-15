# MCP Protocol for CVM

## Overview

CVM uses MCP (Model Context Protocol) to communicate with Claude. The protocol uses JSON-RPC 2.0 over standard input/output.

## Message Format

### Request
```json
{
  "jsonrpc": "2.0",
  "method": "cvm/methodName",
  "params": {
    "param1": "value1"
  },
  "id": 1
}
```

### Success Response
```json
{
  "jsonrpc": "2.0",
  "result": {
    "data": "value"
  },
  "id": 1
}
```

### Error Response
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32600,
    "message": "Invalid request",
    "data": "Additional error info"
  },
  "id": 1
}
```

## CVM Methods

### cvm/load

Loads a program from source code.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "cvm/load",
  "params": {
    "name": "email_processor",
    "source": "let x = CC(\"test\"); print(x);"
  },
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "programId": "507f1f77bcf86cd799439011",
    "success": true
  },
  "id": 1
}
```

### cvm/start

Starts executing a loaded program.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "cvm/start",
  "params": {
    "programId": "507f1f77bcf86cd799439011"
  },
  "id": 2
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "executionId": "507f1f77bcf86cd799439012",
    "status": "RUNNING"
  },
  "id": 2
}
```

### cvm/getTask

Gets the next state of execution (continues until next CC operation or completion).

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "cvm/getTask",
  "params": {
    "executionId": "507f1f77bcf86cd799439012"
  },
  "id": 3
}
```

**Response (CC Operation):**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "status": "AWAITING_COGNITIVE_RESULT",
    "prompt": "Is this email urgent?",
    "executionId": "507f1f77bcf86cd799439012"
  },
  "id": 3
}
```

**Response (Complete):**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "status": "COMPLETED",
    "output": ["Line 1", "Line 2"],
    "executionId": "507f1f77bcf86cd799439012"
  },
  "id": 3
}
```

### cvm/submitTask

Reports the result of a CC operation.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "cvm/submitTask",
  "params": {
    "executionId": "507f1f77bcf86cd799439012",
    "result": "Yes, this email is urgent"
  },
  "id": 4
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "success": true,
    "status": "RUNNING"
  },
  "id": 4
}
```

### cvm/status

Gets current execution state for debugging.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "cvm/status",
  "params": {
    "executionId": "507f1f77bcf86cd799439012"
  },
  "id": 5
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "pc": 10,
    "status": "AWAITING_COGNITIVE_RESULT",
    "stack": ["value1", "value2"],
    "variables": {
      "email": "test@example.com",
      "result": "urgent"
    },
    "output": ["Processing email..."]
  },
  "id": 5
}
```

### cvm/listPrograms

Lists all available programs.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "cvm/listPrograms",
  "params": {},
  "id": 6
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "programs": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "email_processor",
        "created": "2024-01-20T10:00:00Z"
      }
    ]
  },
  "id": 6
}
```

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| -32600 | Invalid Request | JSON-RPC format error |
| -32601 | Method not found | Unknown method name |
| -32602 | Invalid params | Missing or invalid parameters |
| -32603 | Internal error | Server error |
| -32000 | Program not found | Program ID doesn't exist |
| -32001 | Execution not found | Execution ID doesn't exist |
| -32002 | Invalid state | Operation not valid in current state |
| -32003 | Parse error | Source code syntax error |
| -32004 | Runtime error | Execution error |

## Connection Flow

1. **Claude connects** to CVM via MCP
2. **Load program**: `cvm/load`
3. **Start execution**: `cvm/start`
4. **Execute loop**:
   - Call `cvm/getTask`
   - If `AWAITING_COGNITIVE_RESULT`: Claude processes prompt
   - Call `cvm/submitTask` with response
   - Repeat until `COMPLETED`
5. **Get output** from final response

## Implementation Notes

### Server Side
```typescript
class MCPServer {
  async handleRequest(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    try {
      const [namespace, method] = request.method.split('/');
      if (namespace !== 'cvm') {
        return this.error(request.id, -32601, 'Method not found');
      }
      
      switch (method) {
        case 'load':
          return await this.loadProgram(request);
        case 'start':
          return await this.startExecution(request);
        // ... other methods
      }
    } catch (error) {
      return this.error(request.id, -32603, 'Internal error', error.message);
    }
  }
}
```

### Claude Integration
```
Human: Execute my email processor program

Claude: I'll execute your email processor program using CVM.

[Connects to CVM via MCP]
[Calls cvm/load]
[Calls cvm/startExecution]
[Calls cvm/getNext]
[Receives: waiting_cc with prompt "Is this urgent?"]

I need to analyze an email. Let me process: "Is this urgent?"
[Analyzes the email content]
The email appears to be urgent based on...

[Calls cvm/reportCCResult with "yes"]
[Calls cvm/getNext]
[Receives: complete with output]

Program execution complete! Output:
- Processed 1 urgent email
- Response saved to urgent_response.txt
```

## State Management

- Each execution has unique ID
- State persists in MongoDB between calls
- Multiple executions can run concurrently
- CC operations are stateful (wait for specific execution)

## Security Considerations

1. **Input validation**: Validate all parameters
2. **Resource limits**: Max execution time, stack size
3. **Sanitization**: Clean CC prompts before sending
4. **Access control**: Future - program ownership
5. **Rate limiting**: Prevent abuse

## Testing MCP Integration

### Mock Claude Test
```typescript
// Simulate Claude's interaction
const client = new MCPClient();

// Load program
const { programId } = await client.call('cvm/loadProgram', {
  name: 'test',
  source: 'let x = CC("test"); print(x);'
});

// Start execution  
const { executionId } = await client.call('cvm/startExecution', { programId });

// Continue until CC
const { status, prompt } = await client.call('cvm/getNext', { executionId });
assert(status === 'waiting_cc');
assert(prompt === 'test');

// Report result
await client.call('cvm/reportCCResult', { 
  executionId, 
  result: 'test response' 
});

// Continue to completion
const { status: finalStatus, output } = await client.call('cvm/getNext', { executionId });
assert(finalStatus === 'complete');
assert(output[0] === 'test response');
```

## Future Extensions

1. **Streaming output**: Real-time output instead of batch
2. **Progress notifications**: For long-running programs
3. **Async execution**: WebSocket for push notifications
4. **Batch operations**: Execute multiple programs
5. **Resource management**: CPU/memory limits