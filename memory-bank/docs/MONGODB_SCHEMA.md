# MongoDB Schema for CVM

## Database: `cvm`

## Collections

### 1. programs
Stores CVM programs with source and compiled bytecode.

```javascript
{
  _id: ObjectId("..."),
  name: "email_processor",           // Unique program name
  description: "Processes emails",   // Optional description
  source: 'let email = "...";\n...', // Original source code
  bytecode: [                        // Compiled instructions
    { op: 1, arg: "Hello" },
    { op: 4, arg: "msg" }
  ],
  metadata: {
    version: 1,                      // Language version
    compiled: ISODate("2024-01-20T10:00:00Z"),
    compiler: "cvm-compiler:1.0"
  },
  created: ISODate("2024-01-20T10:00:00Z"),
  modified: ISODate("2024-01-20T10:00:00Z"),
  tags: ["email", "automation"]      // Optional tags
}

// Indexes
db.programs.createIndex({ "name": 1 }, { unique: true })
db.programs.createIndex({ "tags": 1 })
db.programs.createIndex({ "created": -1 })
```

### 2. executions
Active and completed program executions.

```javascript
{
  _id: ObjectId("..."),              // Execution ID
  programId: ObjectId("..."),        // Reference to program
  programName: "email_processor",    // Denormalized for query
  
  state: {
    pc: 5,                           // Program counter
    stack: ["Hello", "World"],       // Operand stack
    scopes: [
      {                              // Global scope (always index 0)
        variables: {
          "email": "test@example.com",
          "result": "urgent"
        }
      }
      // Function scopes added here when called
    ],
    status: "waiting_cc",            // running|waiting_cc|complete|error
    output: ["Line 1", "Line 2"]     // Accumulated print output
  },
  
  ccWaiting: {                       // Only present when waiting
    instructionId: 5,
    prompt: "Is this email urgent?",
    requestedAt: ISODate("2024-01-20T10:00:00Z")
  },
  
  started: ISODate("2024-01-20T10:00:00Z"),
  completed: ISODate("2024-01-20T10:05:00Z"),  // When status becomes complete/error
  lastModified: ISODate("2024-01-20T10:03:00Z"),
  
  metrics: {
    instructionsExecuted: 150,
    ccCallsCount: 3,
    executionTimeMs: 5000
  },
  
  error: {                           // Only if status = error
    message: "Undefined variable: xyz",
    line: 10,
    instruction: { op: 3, arg: "xyz" },
    stack: ["value1", "value2"],
    timestamp: ISODate("2024-01-20T10:05:00Z")
  }
}

// Indexes
db.executions.createIndex({ "programId": 1 })
db.executions.createIndex({ "state.status": 1 })
db.executions.createIndex({ "started": -1 })
db.executions.createIndex({ "programName": 1, "started": -1 })
```

### 3. cc_history
History of all cognitive calls for analysis and debugging.

```javascript
{
  _id: ObjectId("..."),
  executionId: ObjectId("..."),      // Link to execution
  programName: "email_processor",
  
  request: {
    prompt: "Is this email urgent? Reply yes/no only.",
    instructionId: 5,
    timestamp: ISODate("2024-01-20T10:00:00Z")
  },
  
  response: {
    result: "yes",
    timestamp: ISODate("2024-01-20T10:00:02Z"),
    latencyMs: 2000
  },
  
  context: {                         // Execution context at time of call
    pc: 5,
    variables: {
      "email": "URGENT: Server down!"
    }
  }
}

// Indexes
db.cc_history.createIndex({ "executionId": 1 })
db.cc_history.createIndex({ "programName": 1 })
db.cc_history.createIndex({ "request.timestamp": -1 })
```

### 4. execution_logs
Detailed execution logs for debugging.

```javascript
{
  _id: ObjectId("..."),
  executionId: ObjectId("..."),
  timestamp: ISODate("2024-01-20T10:00:00Z"),
  
  event: "instruction",              // instruction|cc_call|error|complete
  details: {
    pc: 3,
    instruction: { op: 1, arg: "Hello" },
    stackBefore: [],
    stackAfter: ["Hello"],
    executionTimeUs: 15
  }
}

// Indexes
db.execution_logs.createIndex({ "executionId": 1, "timestamp": 1 })
db.execution_logs.createIndex({ "event": 1 })

// TTL Index - auto-delete logs after 30 days
db.execution_logs.createIndex(
  { "timestamp": 1 }, 
  { expireAfterSeconds: 2592000 }
)
```

## Key Design Decisions

### 1. State Persistence Strategy
- Save state after every CC instruction
- Optionally save every N instructions (configurable)
- Always save on error or completion

### 2. Denormalization
- Program name in executions for easier querying
- Context snapshot in cc_history for analysis

### 3. TTL Indexes
- Execution logs auto-expire after 30 days
- Completed executions could expire after N days

### 4. Sharding Strategy (Future)
If scale requires:
- Shard executions by `_id` (random distribution)
- Shard cc_history by `timestamp` (time-based)

## Query Patterns

### Find active executions
```javascript
db.executions.find({ "state.status": "waiting_cc" })
```

### Get program execution history
```javascript
db.executions.find({ 
  programName: "email_processor" 
}).sort({ started: -1 }).limit(10)
```

### Analyze CC response times
```javascript
db.cc_history.aggregate([
  { $match: { programName: "email_processor" } },
  { $group: {
    _id: null,
    avgLatency: { $avg: "$response.latencyMs" },
    maxLatency: { $max: "$response.latencyMs" }
  }}
])
```

### Resume execution
```javascript
// 1. Find execution
const exec = db.executions.findOne({ 
  _id: executionId,
  "state.status": "waiting_cc"
})

// 2. Update with CC result
db.executions.updateOne(
  { _id: executionId },
  { 
    $set: {
      "state.status": "running",
      "state.pc": exec.state.pc + 1,
      "state.stack": [...exec.state.stack, ccResult],
      "lastModified": new Date()
    },
    $unset: { "ccWaiting": "" }
  }
)
```

## Migration Strategy

### Version 1 → Version 2
When adding new language features:
1. Add version field to programs
2. Recompile programs to new bytecode
3. Existing executions continue with old bytecode
4. New executions use new bytecode

## Backup Strategy

Critical collections (backup frequently):
- programs (source code)
- executions (active states)

Less critical (can be regenerated):
- cc_history
- execution_logs