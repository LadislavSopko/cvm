# Enhanced Pino Logging System - Comprehensive Debug/Trace Implementation

## Mission: Complete CVM Execution Visibility

**Objective**: Implement comprehensive debug/trace logging across ALL CVM execution paths using Pino, enabling perfect debugging visibility for issues like "Invalid jump target: -1" and complete system monitoring.

## Analysis Results: 247 Critical Execution Points Identified

Based on comprehensive codebase analysis, logging is needed at **247 specific locations** across all packages. This enhanced plan provides complete execution tracing.

## Enhanced TDDAB Blocks

### TDDAB-1: Enhanced Pino Infrastructure
**Goal**: Set up Pino with comprehensive tracing capabilities

**Test Requirements**:
- [ ] Pino and pino-pretty dependencies installed
- [ ] Multi-level logging: trace, debug, info, warn, error, fatal
- [ ] High-performance transports for trace-level logging
- [ ] Environment-controlled granular logging levels

**Dependencies to Add**:
```bash
npm install pino pino-pretty pino-multi-stream @types/pino
```

**Implementation**:
- Remove winston (✅ already done)
- Add Pino with trace level support
- Configure multiple transports (file + console)

### TDDAB-2: Advanced Logger Configuration
**Goal**: Production-grade logger with comprehensive tracing

**Test Requirements**:
- [ ] Trace-level logging with minimal performance impact
- [ ] Package-specific log levels
- [ ] Instruction-level execution tracing (optional)
- [ ] Memory usage and performance timing
- [ ] Structured JSON logging with correlation IDs

**Files to Create/Replace**:
- `apps/cvm-server/src/logger.ts` (enhanced replacement)

**Implementation Details**:
```typescript
// Enhanced configuration:
- Trace level for instruction-by-instruction debugging
- Correlation IDs for cross-package request tracking  
- Performance timing built into all log entries
- Memory usage tracking per major operation
- Context preservation across async operations
```

**Environment Variables**:
```bash
# Granular logging control
CVM_LOG_LEVEL=trace|debug|info|warn|error|fatal
CVM_TRACE_INSTRUCTIONS=true|false
CVM_TRACE_JUMP_TARGETS=true|false
CVM_TRACE_HEAP_OPERATIONS=true|false
CVM_TRACE_COMPILATION=true|false

# Package-specific levels
CVM_VM_LOG_LEVEL=trace|debug|info|warn|error
CVM_PARSER_LOG_LEVEL=trace|debug|info|warn|error
CVM_MCP_LOG_LEVEL=trace|debug|info|warn|error
CVM_STORAGE_LOG_LEVEL=trace|debug|info|warn|error

# Performance monitoring
CVM_LOG_PERFORMANCE_TIMING=true|false
CVM_LOG_MEMORY_USAGE=true|false
CVM_LOG_STACK_STATE=true|false

# Output control
CVM_LOG_FORMAT=json|pretty
CVM_LOG_DIR=.cvm/logs
CVM_LOG_FILE=cvm.log
CVM_LOG_MAX_SIZE=50m
CVM_LOG_MAX_FILES=10
```

### TDDAB-3: VM Core Execution Tracing (18 Critical Points)
**Goal**: Complete visibility into VM execution engine

**Files to Modify**:
- `packages/vm/src/lib/vm.ts`

**Critical Logging Points**:
```typescript
// vm.ts - Every execution point logged
Line 84-143: Main execution loop
  - TRACE: Before/after each instruction execution
  - DEBUG: Stack state before/after each instruction
  - INFO: Execution milestones (every 100 instructions)

Line 99-111: Jump validation (CRITICAL for current bug)
  - TRACE: Jump target validation details
  - DEBUG: Current PC, target PC, instruction context
  - WARN: Invalid jump targets with full context

Line 43-57: executeInstruction()
  - TRACE: Instruction opcode, operands, stack state
  - DEBUG: Handler selection and execution
  - ERROR: Execution failures with full context

Line 147-163: resume() method
  - DEBUG: Resume context, previous state
  - INFO: Successful resume operations
```

**Implementation**:
- Add logger injection to VM constructor
- Instruction-level tracing with performance timing
- Stack state logging before/after each instruction
- Jump target validation with detailed context

### TDDAB-4: VM Manager State Management (31 Critical Points)
**Goal**: Complete state transition and CC() call visibility

**Files to Modify**:
- `packages/vm/src/lib/vm-manager.ts`

**Critical Logging Points**:
```typescript
// vm-manager.ts - State management tracing
Line 60-78: Program compilation and loading
  - DEBUG: Compilation start/end with timing
  - INFO: Program loaded successfully
  - ERROR: Compilation failures with source context

Line 111-206: getNext() - Core execution polling
  - TRACE: Each polling cycle
  - DEBUG: State transitions (running -> waiting -> completed)
  - INFO: CC() calls with context and timing

Line 212-273: reportCCResult() - CC continuation
  - DEBUG: CC result processing
  - INFO: Successful continuations
  - ERROR: CC result validation failures

Line 375-487: Heap serialization/deserialization
  - DEBUG: Serialization operations with size metrics
  - WARN: Large heap operations
  - ERROR: Serialization failures
```

### TDDAB-5: Instruction Handler Tracing (81 Critical Points)
**Goal**: Complete visibility into all instruction execution

**Files to Modify** (all handlers):
- `packages/vm/src/lib/handlers/control.ts` (14 points)
- `packages/vm/src/lib/handlers/advanced.ts` (8 points)
- `packages/vm/src/lib/handlers/iterators.ts` (12 points)
- All other handler files (47 points)

**Critical Areas**:

**Control Flow Handlers**:
```typescript
// control.ts - Jump instruction tracing
JUMP, JUMP_IF_FALSE, JUMP_IF_TRUE:
  - TRACE: Jump calculation details
  - DEBUG: Before/after PC values
  - WARN: Conditional jump evaluation results
  - ERROR: Invalid jump targets with full stack trace
```

**Break/Continue Handlers**:
```typescript
// advanced.ts - Break/continue tracing
BREAK, CONTINUE instructions:
  - TRACE: Jump target resolution
  - DEBUG: Loop context and target calculation
  - ERROR: Invalid jump targets (-1) with full context
```

**Iterator Handlers**:
```typescript
// iterators.ts - Iterator lifecycle tracing
ITER_START, ITER_NEXT, ITER_END:
  - TRACE: Iterator state changes
  - DEBUG: Iterator value processing
  - INFO: Iterator completion
```

### TDDAB-6: Jump Target Resolution Deep Tracing
**Goal**: Specific logging for jump target bug debugging

**Files to Modify**:
- `packages/parser/src/lib/compiler/statements/for-of-statement.ts`
- `packages/parser/src/lib/compiler-state.ts`

**Critical Logging Points**:
```typescript
// for-of-statement.ts - Jump target compilation
Line 41-44: Jump target setup
  - TRACE: Initial jump target calculation
  - DEBUG: Jump target placeholder creation

Line 64-82: Context patching (WHERE -1 TARGETS OCCUR)
  - TRACE: Before/after jump target values
  - DEBUG: Patching operation details
  - WARN: Unresolved jump targets
  - ERROR: Invalid target assignments

Line 75,79: Break/continue target patching
  - TRACE: Target resolution process
  - DEBUG: Final target values
```

### TDDAB-7: Compiler Comprehensive Tracing (38 Critical Points)
**Goal**: Complete compilation process visibility

**Files to Modify**:
- `packages/parser/src/lib/compiler.ts` (15 points)
- All statement compilers (23 points)

**Critical Areas**:
```typescript
// compiler.ts - Main compilation tracing
Line 19-36: Parse error handling
  - ERROR: Parsing failures with source location
  - DEBUG: AST structure validation

Line 56-84: Statement/expression compilation
  - TRACE: Each compilation step
  - DEBUG: AST node processing
  - INFO: Compilation phase completion

// Statement compilers - Individual statement tracing
Each statement type:
  - TRACE: Statement type and structure
  - DEBUG: Bytecode generation
  - INFO: Complex statement completion (loops, conditionals)
```

### TDDAB-8: MCP Server Request Tracing (28 Critical Points)
**Goal**: Complete MCP tool execution visibility

**Files to Modify**:
- `packages/mcp-server/src/lib/mcp-server.ts`

**Critical Areas**:
```typescript
// mcp-server.ts - Tool execution tracing
Line 48-57: Program loading tool
  - INFO: Tool execution start with correlation ID
  - DEBUG: Program source analysis
  - ERROR: Loading failures with context

Line 115-131: Execution start tool
  - INFO: Execution initialization
  - DEBUG: Execution parameters
  - WARN: Execution conflicts

Line 154-183: Task retrieval tool
  - TRACE: Task polling requests
  - DEBUG: Task state evaluation
  - INFO: Task retrieval success

Line 209-219: Task submission tool
  - DEBUG: Task result processing
  - INFO: Successful submissions
  - ERROR: Result validation failures
```

### TDDAB-9: Storage Layer Deep Tracing (29 Critical Points)
**Goal**: Complete storage operation visibility

**Files to Modify**:
- `packages/storage/src/lib/mongodb-adapter.ts` (21 points)
- `packages/storage/src/lib/file-adapter.ts` (8 points)

**Critical Areas**:
```typescript
// mongodb-adapter.ts - Database operation tracing
Line 14-36: Connection lifecycle
  - INFO: Connection attempts and success
  - DEBUG: Connection configuration
  - ERROR: Connection failures with retry logic

Line 59-78: CRUD operations
  - TRACE: Individual database operations
  - DEBUG: Query construction and execution
  - INFO: Operation completion with timing
  - ERROR: Database errors with query context

// file-adapter.ts - File system operation tracing
All file operations:
  - DEBUG: File I/O operations
  - INFO: File operation completion
  - ERROR: File system errors with path context
```

### TDDAB-10: Type System and Value Tracing (12 Critical Points)
**Goal**: Type conversion and value operation visibility

**Files to Modify**:
- `packages/types/src/lib/cvm-value.ts`

**Critical Areas**:
```typescript
// cvm-value.ts - Type operation tracing
Type conversion operations:
  - TRACE: Type conversion attempts
  - DEBUG: Conversion logic and results
  - WARN: Lossy conversions
  - ERROR: Invalid type conversions

Reference resolution:
  - TRACE: Reference lookup operations
  - DEBUG: Reference resolution results
  - ERROR: Invalid reference access
```

### TDDAB-11: Performance and Memory Monitoring
**Goal**: System performance visibility

**Test Requirements**:
- [ ] Instruction execution timing per instruction type
- [ ] Memory allocation/deallocation tracking
- [ ] Heap growth monitoring
- [ ] GC pressure indicators
- [ ] Storage operation performance metrics

**Implementation**:
- Add performance timing to all major operations
- Memory usage tracking with warnings for high usage
- Execution speed metrics (instructions per second)
- Storage performance monitoring

### TDDAB-12: Correlation and Context Tracking
**Goal**: Request correlation across all packages

**Test Requirements**:
- [ ] Unique correlation IDs for each MCP request
- [ ] Context propagation across package boundaries
- [ ] Request tracing from MCP tool to VM execution
- [ ] CC() call correlation with original request

**Implementation**:
- Add correlation ID to all log entries
- Context object passed through all operations
- Request lifecycle tracking from start to completion

### TDDAB-13: Advanced Error Context
**Goal**: Enhanced error reporting with complete context

**Test Requirements**:
- [ ] Stack traces with CVM execution context
- [ ] Source code location mapping for runtime errors
- [ ] Error correlation across package boundaries
- [ ] Execution state capture on errors

**Implementation**:
- Enhanced error objects with CVM context
- Source location tracking through compilation
- Execution state snapshots on errors
- Error correlation with request context

### TDDAB-14: Testing and Validation
**Goal**: Comprehensive test coverage for logging system

**Test Requirements**:
- [ ] All 247 logging points tested
- [ ] Performance impact measurement (< 5% overhead)
- [ ] Log format validation
- [ ] Correlation ID tracking tests
- [ ] Error scenario coverage

**Test Files to Create**:
- `packages/vm/src/lib/logging.integration.spec.ts`
- `packages/parser/src/lib/logging.integration.spec.ts`
- `packages/mcp-server/src/lib/logging.integration.spec.ts`
- `packages/storage/src/lib/logging.integration.spec.ts`
- `apps/cvm-server/src/logger.comprehensive.spec.ts`

### TDDAB-15: Production Validation and Optimization
**Goal**: Verify complete logging system in production scenarios

**Test Requirements**:
- [ ] All 57 E2E tests with trace logging enabled
- [ ] Performance benchmarking with/without logging
- [ ] Log volume analysis and storage requirements
- [ ] Memory leak testing with continuous logging
- [ ] Error injection testing

## Implementation Priority

### Phase 1: Critical Debugging (TDDAB 1-6)
**Target**: Immediate jump target bug resolution
- Core infrastructure and VM tracing
- Jump target specific logging
- Basic compiler tracing

### Phase 2: Complete Coverage (TDDAB 7-10)
**Target**: Full system visibility  
- MCP server tracing
- Storage layer tracing
- Type system tracing

### Phase 3: Advanced Features (TDDAB 11-13)
**Target**: Production monitoring
- Performance monitoring
- Correlation tracking
- Enhanced error reporting

### Phase 4: Validation (TDDAB 14-15)
**Target**: Production readiness
- Comprehensive testing
- Performance validation
- Production deployment

## Expected Outcomes

1. **Complete Visibility**: Every CVM operation traceable through logs
2. **Bug Resolution**: "Invalid jump target: -1" fully debuggable
3. **Production Monitoring**: Real-time system health monitoring
4. **Performance Optimization**: Bottleneck identification through detailed metrics
5. **Maintenance Efficiency**: Future debugging through comprehensive logs

This enhanced plan provides complete CVM execution visibility with minimal performance impact, enabling perfect debugging and production monitoring capabilities.