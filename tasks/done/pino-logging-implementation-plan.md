# Pino Logging System Implementation Plan

## Mission: Production-Ready Logging for CVM

**Objective**: Replace Winston with Pino logging system across all CVM layers for enhanced debugging capabilities, especially for the "Invalid jump target: -1" bug investigation and production monitoring.

## Context & Rationale

From Memory Bank research: Pino was selected over Winston/Bunyan due to:
- **Out-of-process architecture** superior for CVM performance
- **File logging capabilities** with structured debugging 
- **Better MCP compatibility** - avoids stdout conflicts with JSON-RPC protocol
- **Production performance** - faster than Winston for high-volume logging

## TDDAB Blocks (Test Driven Development Atomic Blocks)

### TDDAB-1: Package Infrastructure
**Goal**: Set up Pino dependencies and remove Winston

**Test Requirements**:
- [ ] Pino and @types/pino installed in apps/cvm-server 
- [ ] Winston dependency removed from package.json
- [ ] Build passes without Winston references
- [ ] Import statements for pino work correctly

**Implementation**:
- Remove winston from apps/cvm-server/package.json
- Add pino and @types/pino dependencies
- Verify no Winston imports remain in codebase

**Validation**:
- `npx nx build cvm-server` succeeds
- No Winston references in node_modules dependencies

### TDDAB-2: Core Pino Logger Service
**Goal**: Create centralized Pino logger configuration

**Test Requirements**:
- [ ] Logger service exports consistent interface with current Logger class
- [ ] Environment-based log level configuration (CVM_LOG_LEVEL)
- [ ] File logging to dedicated log directory (.cvm/logs/)
- [ ] JSON structured logging for production, pretty printing for development
- [ ] Proper log rotation configuration
- [ ] Error-safe fallback if log directory creation fails

**Files to Create**:
- `apps/cvm-server/src/logger.ts` (replace existing)

**Implementation Details**:
```typescript
// Key features to implement:
- pino({ level: process.env.CVM_LOG_LEVEL || 'info' })
- File transport to .cvm/logs/cvm.log with rotation
- Pretty printing for development (CVM_LOG_FORMAT=pretty)
- JSON format for production (CVM_LOG_FORMAT=json)
- Error handling for file system access
```

**Validation**:
- Unit tests for logger configuration
- Log files created in correct location
- Log rotation works (size-based)
- Environment variables control behavior

### TDDAB-3: MCP Server Integration
**Goal**: Integrate Pino logging in MCP server layer

**Test Requirements**:
- [ ] MCP server initializes logger on startup
- [ ] Tool execution logging (mcp__cvm__* operations)
- [ ] Error logging with stack traces
- [ ] Request/response correlation IDs
- [ ] Performance timing logs for debugging

**Files to Modify**:
- `packages/mcp-server/src/lib/mcp-server.ts`

**Implementation**:
- Replace console.error calls with structured logging
- Add request correlation tracking
- Log tool execution start/end with timing
- Error logging with full context

**Validation**:
- Integration tests verify log entries
- Error scenarios properly logged
- Performance data captured

### TDDAB-4: VM Manager Logging
**Goal**: Add comprehensive logging to VM execution

**Test Requirements**:
- [ ] Program compilation logging
- [ ] Execution state transitions logged
- [ ] CC() call logging with context
- [ ] Bytecode instruction debugging (optional debug level)
- [ ] Heap operations logging for memory debugging
- [ ] Jump target resolution logging (for "Invalid jump target: -1" bug)

**Files to Modify**:
- `packages/vm/src/lib/vm-manager.ts`
- `packages/vm/src/lib/vm.ts`

**Implementation**:
- Log program load/start/resume operations
- State transition logging (running -> waiting -> completed)
- Debug-level bytecode execution tracing
- Memory operation logging with heap state

**Validation**:
- E2E tests produce expected log entries
- Debug logs help trace execution flow
- Jump target logging captures the specific bug

### TDDAB-5: Compiler Logging
**Goal**: Add structured logging to compilation process

**Test Requirements**:
- [ ] AST parsing stage logging
- [ ] Bytecode generation logging
- [ ] Error compilation logging with source locations
- [ ] Symbol table and scope resolution logging
- [ ] Jump target calculation logging (critical for debugging)

**Files to Modify**:
- `packages/parser/src/lib/compiler.ts`
- `packages/parser/src/lib/compiler/statements/for-of-statement.ts` (for current bug)

**Implementation**:
- Compilation phase logging
- Jump target resolution with detailed context
- Error compilation with source line/column
- Symbol resolution logging

**Validation**:
- Compilation logs show clear progression
- Jump target calculations are traceable
- Error logs include source context

### TDDAB-6: Storage Layer Logging
**Goal**: Add logging to storage operations

**Test Requirements**:
- [ ] MongoDB connection/disconnection logging
- [ ] File adapter operations logging
- [ ] Serialization/deserialization logging
- [ ] Storage error handling with detailed logs
- [ ] Performance metrics for storage operations

**Files to Modify**:
- `packages/storage/src/lib/mongodb-adapter.ts`
- `packages/storage/src/lib/file-adapter.ts`
- `packages/storage/src/lib/storage-factory.ts`

**Implementation**:
- Connection lifecycle logging
- CRUD operations with timing
- Serialization error logging
- Storage adapter selection logging

**Validation**:
- Storage operations traced in logs
- Error conditions properly captured
- Performance data available

### TDDAB-7: Configuration & Environment
**Goal**: Centralized logging configuration system

**Test Requirements**:
- [ ] Environment variable configuration
- [ ] Log level inheritance across packages
- [ ] Log directory auto-creation
- [ ] Configuration validation and error handling
- [ ] Default fallback values

**Files to Create/Modify**:
- `apps/cvm-server/src/config.ts`
- `.env.example` with logging variables

**Environment Variables**:
```bash
CVM_LOG_LEVEL=debug|info|warn|error
CVM_LOG_FORMAT=json|pretty
CVM_LOG_DIR=.cvm/logs
CVM_LOG_FILE=cvm.log
CVM_LOG_MAX_SIZE=10m
CVM_LOG_MAX_FILES=5
```

**Validation**:
- Configuration loads from environment
- Default values work without .env
- Invalid configs handled gracefully

### TDDAB-8: Testing & Verification
**Goal**: Comprehensive test coverage for logging system

**Test Requirements**:
- [ ] Logger unit tests (configuration, output)
- [ ] Integration tests verify log entries during operations
- [ ] E2E tests produce expected log structure
- [ ] Log file rotation tests
- [ ] Performance tests (logging doesn't impact VM performance)
- [ ] Error scenario tests (disk full, permission issues)

**Test Files to Create**:
- `apps/cvm-server/src/logger.spec.ts`
- `packages/mcp-server/src/lib/logging.integration.spec.ts`
- `packages/vm/src/lib/logging.integration.spec.ts`

**Validation Criteria**:
- All existing tests still pass
- New logging tests achieve >90% coverage
- Log output format validation
- No performance regression

### TDDAB-9: Documentation & Examples
**Goal**: Document logging system usage and configuration

**Test Requirements**:
- [ ] README updates with logging configuration
- [ ] Debugging guide with log analysis examples
- [ ] Environment variable documentation
- [ ] Troubleshooting guide using logs

**Files to Create/Update**:
- `apps/cvm-server/README.md` (logging section)
- `docs/DEBUGGING.md` (new file)
- `CLAUDE.md` (update with logging notes)

**Content Requirements**:
- Log configuration examples
- Common debugging scenarios
- Log analysis techniques
- Integration with external log aggregation

### TDDAB-10: Production Validation
**Goal**: Verify logging system works in production scenarios

**Test Requirements**:
- [ ] High-volume operation logging (1000+ CC calls)
- [ ] Multi-program execution logging
- [ ] Error recovery logging validation
- [ ] Log rotation under load
- [ ] Memory usage monitoring with logging enabled

**Validation Scenarios**:
- Run all 57 E2E tests with debug logging
- Execute complex programs (regex, file operations)
- Simulate error conditions and verify logs
- Load testing with logging overhead measurement

## Implementation Strategy

### Phase 1: Foundation (TDDAB 1-2)
- Set up dependencies and core logger
- Replace Winston infrastructure
- Validate basic logging works

### Phase 2: Integration (TDDAB 3-6) 
- Integrate logging across all layers
- Focus on VM debugging capabilities
- Add jump target debugging for current bug

### Phase 3: Production Ready (TDDAB 7-10)
- Configuration management
- Comprehensive testing
- Documentation and validation

## Success Criteria

1. **Debugging Capability**: "Invalid jump target: -1" bug can be traced through logs
2. **Performance**: No measurable impact on VM execution performance
3. **Reliability**: Logging system never crashes or blocks CVM operations
4. **Maintainability**: Clear, structured logs aid in future debugging
5. **Production Ready**: Configurable, rotated, structured logging suitable for monitoring

## Risk Mitigation

- **Backward Compatibility**: Maintain existing Logger interface initially
- **Performance**: Use debug level for heavy logging, info/warn/error for production
- **Disk Space**: Implement log rotation and size limits
- **Error Handling**: Logger failures must not impact VM operations
- **Testing**: Extensive integration testing to prevent regressions

This implementation will provide CVM with production-grade logging infrastructure essential for debugging complex VM execution issues and maintaining system health in production environments.