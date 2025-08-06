# Practical Pino Logging Implementation - TDDAB Execution Order

## Mission: PoC-First Logging Implementation

**Objective**: Start with working Pino logging system, then incrementally add logging calls throughout codebase. Each TDDAB block has implicit validation through tests - if tests pass, implementation works.

## TDDAB Execution Order (No Phases, Single Implementation)

### TDDAB-1: Core Pino Logger Foundation
**Goal**: Minimal viable logging system that works and is testable

**Dependencies to Add**:
```bash
cd apps/cvm-server
npm install pino pino-pretty @types/pino
```

**Implementation**:
```typescript
// apps/cvm-server/src/logger.ts (replace existing)
import pino from 'pino';

const logLevel = process.env.CVM_LOG_LEVEL || 'info';

const logger = pino({
  level: logLevel,
  transport: process.env.NODE_ENV !== 'production'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined, // JSON output in production
});

export default logger;
```

**Test Requirements**:
- Logger module exports valid Pino instance
- Environment variables control log level
- Pretty printing works in development

**Validation**: `npx nx test cvm-server` passes

### TDDAB-2: End-to-End Verification  
**Goal**: Prove new logger works in application context

**Implementation**:
Replace one existing console.error with Pino in main.ts:
```typescript
// apps/cvm-server/src/main.ts
import logger from './logger.js';

// Replace existing console.error with:
logger.info('CVM Server starting');
```

**Test Requirements**:
- Application starts successfully  
- Pino formatted logs appear in console
- No console.error calls in main startup path

**Validation**: Manual run + existing integration tests pass

### TDDAB-3: VM Execution Logging
**Goal**: Critical VM execution loop visibility for jump target debugging

**Files to Modify**:
- `packages/vm/src/lib/vm.ts`

**Implementation**:
```typescript
// vm.ts - Add logger import and critical logging points
import logger from '../../../apps/cvm-server/src/logger.js';

// In executeInstruction():
const vmLogger = logger.child({ component: 'vm', executionId: this.executionId });

// Main execution loop (line ~84-143):
vmLogger.trace({ pc: this.pc, opcode, stack: this.stack.length }, 'Executing instruction');

// Jump validation (line ~99-111) - CRITICAL for current bug:
if (jumpTarget < 0 || jumpTarget >= instructions.length) {
  vmLogger.error({ 
    pc: this.pc, 
    jumpTarget, 
    instructionCount: instructions.length,
    opcode 
  }, 'Invalid jump target detected');
}
```

**Test Requirements**:
- All existing VM tests pass
- Debug logs appear during test execution  
- Jump target validation logs captured

**Validation**: `npx nx test vm` passes + manual jump target test

### TDDAB-4: Jump Target Specific Logging
**Goal**: Target the exact locations causing "Invalid jump target: -1" 

**Files to Modify**:
- `packages/parser/src/lib/compiler/statements/for-of-statement.ts`

**Implementation**:
```typescript
// for-of-statement.ts - Add compiler logging
import logger from '../../../../../../apps/cvm-server/src/logger.js';

const compilerLogger = logger.child({ component: 'compiler', statement: 'for-of' });

// Line ~41-44: Jump target setup
compilerLogger.debug({ jumpTarget: forEndLabel }, 'Setting for-of end jump target');

// Line ~75,79: Break/continue target patching - WHERE -1 OCCURS  
compilerLogger.debug({ 
  breakTarget: context.breakJumpTargets, 
  continueTarget: context.continueJumpTargets 
}, 'Patching break/continue jump targets');

// Line ~81: After patching
compilerLogger.debug({ 
  patchedBreakTargets: context.breakJumpTargets,
  patchedContinueTargets: context.continueJumpTargets
}, 'Jump target patching completed');
```

**Test Requirements**:
- All parser/compiler tests pass
- Jump target calculation logs visible during compilation
- -1 jump targets logged with full context

**Validation**: `npx nx test parser` passes + compile test with for-of loops

### TDDAB-5: MCP Server Request Logging
**Goal**: MCP tool execution visibility

**Files to Modify**:
- `packages/mcp-server/src/lib/mcp-server.ts`

**Implementation**:
```typescript
// mcp-server.ts - Add request correlation logging
import logger from '../../../../apps/cvm-server/src/logger.js';

// Tool execution with correlation IDs:
export async function handleToolCall(toolName: string, args: any) {
  const correlationId = crypto.randomUUID();
  const mcpLogger = logger.child({ component: 'mcp', correlationId, tool: toolName });
  
  mcpLogger.info({ args }, 'Tool execution started');
  
  try {
    const result = await executeTool(toolName, args);
    mcpLogger.info({ duration: Date.now() - start }, 'Tool execution completed');
    return result;
  } catch (error) {
    mcpLogger.error({ err: error }, 'Tool execution failed');
    throw error;
  }
}
```

**Test Requirements**:
- All MCP server tests pass
- Tool execution logs with correlation IDs
- Error scenarios properly logged

**Validation**: `npx nx test mcp-server` passes + manual MCP tool test

### TDDAB-6: Storage Layer Logging
**Goal**: Database and file operation visibility

**Files to Modify**:
- `packages/storage/src/lib/mongodb-adapter.ts`
- `packages/storage/src/lib/file-adapter.ts`

**Implementation**:
```typescript
// mongodb-adapter.ts
import logger from '../../../../apps/cvm-server/src/logger.js';

const storageLogger = logger.child({ component: 'storage', adapter: 'mongodb' });

// CRUD operations:
async saveProgram(program: Program): Promise<void> {
  storageLogger.debug({ programId: program.id }, 'Saving program to MongoDB');
  try {
    await this.programs.insertOne(program);
    storageLogger.info({ programId: program.id }, 'Program saved successfully');
  } catch (error) {
    storageLogger.error({ err: error, programId: program.id }, 'Failed to save program');
    throw error;
  }
}
```

**Test Requirements**:
- All storage tests pass
- Database operations logged with timing
- File operations logged with paths

**Validation**: `npx nx test storage` passes

### TDDAB-7: Comprehensive VM Handler Logging
**Goal**: Complete instruction handler visibility

**Files to Modify**:
- `packages/vm/src/lib/handlers/control.ts`
- `packages/vm/src/lib/handlers/advanced.ts`
- `packages/vm/src/lib/handlers/iterators.ts`
- All other handler files

**Implementation**:
```typescript
// control.ts - Jump instruction handlers
import logger from '../../../../../apps/cvm-server/src/logger.js';

const handlerLogger = logger.child({ component: 'vm-handler', type: 'control' });

// JUMP instruction:
execute(state: VMState, instruction: Instruction): void {
  handlerLogger.trace({ 
    fromPC: state.pc, 
    toPC: instruction.operand,
    stackSize: state.stack.length 
  }, 'JUMP instruction executing');
  
  state.pc = instruction.operand;
}

// JUMP_IF_FALSE - critical for for-of debugging:
execute(state: VMState, instruction: Instruction): void {
  const condition = state.stack.pop();
  handlerLogger.trace({ 
    condition, 
    jumpTarget: instruction.operand,
    willJump: !condition 
  }, 'JUMP_IF_FALSE evaluating');
  
  if (!condition) {
    state.pc = instruction.operand;
  }
}
```

**Test Requirements**:
- All VM handler tests pass
- Instruction-level execution tracing available
- Performance impact < 5% overhead

**Validation**: `npx nx test vm` passes + performance benchmark

## Environment Variables

```bash
# Basic configuration
CVM_LOG_LEVEL=trace|debug|info|warn|error
NODE_ENV=development|production

# For debugging current issue
CVM_LOG_LEVEL=debug  # Shows jump target debugging
CVM_LOG_LEVEL=trace  # Shows instruction-level execution
```

## Execution Strategy

1. **Start with TDDAB-1**: Get basic Pino working
2. **Validate with TDDAB-2**: Prove end-to-end functionality
3. **Target critical issue with TDDAB-3,4**: Focus on jump target bug
4. **Expand coverage with TDDAB-5,6,7**: Add remaining logging

## Success Criteria

- All existing tests continue to pass
- "Invalid jump target: -1" bug is traceable through logs
- No performance regression in VM execution
- Structured JSON logs in production, pretty logs in development
- Each TDDAB block independently testable and reversible

This approach provides incremental logging expansion with built-in validation at each step, starting with a proven foundation and targeting the specific debugging needs.