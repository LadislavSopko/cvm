# CVM Feature Priorities

*Last updated: June 23, 2025*

## Core Mission Reminder
CVM is a task orchestrator for Claude - NOT a general programming language. Every feature must help Claude process many tasks systematically without losing context.

## Key Realization
State persistence is already solid! CVM waits indefinitely for CC responses. Focus should be on making CC/CVM interaction smarter, not crash recovery.

## Priority Features (Revised Order)

### 1. 🔍 Execution Management Tools (HIGHEST - 2-3 days)
**Problem**: Claude can't see what executions exist or their status
**Solution**: Complete execution management system

#### New MCP Tools:
- **`cvm_list_executions()`** - List all executions with status
- **`cvm_get_execution(executionId?)`** - Detailed execution info including:
  - Current task prompt
  - Attempt count (retry tracking!)
  - Timestamps
  - Task completion stats
- **`cvm_set_current(executionId)`** - Set default/current execution
- **`cvm_delete_execution(executionId)`** - Clean up old executions

#### Enhancements:
- `cvm_start()` auto-sets new execution as current
- `cvm_getTask()` can use current execution (no ID needed)

**Benefits**:
- Claude works without tracking executionIds
- Full visibility into retry attempts
- Easy switching between multiple programs
- Clean execution management

### 2. 📋 Task Metadata & Context (POSTPONED)
**Reason**: After testing, we found that:
- `getTask` returns simple prompt strings (clean design)
- Most "metadata" can be included in prompt text
- Execution info (like retry count) available via `cvm_get_execution()`
- No immediate need for structured metadata

### 3. 🛡️ Error Handling: try/catch (MEDIUM - 3-4 days)  
**Problem**: One bad task stops entire program
**Solution**: Graceful error recovery
```typescript
try {
  const result = CC("Process: " + file);
} catch (e) {
  console.log("Skipped problematic file: " + file);
}
```

### 4. 🔄 Array Methods: map/filter/reduce (MEDIUM - 2-3 days)
**Problem**: Can't efficiently process file lists
**Solution**: Native array operations
```typescript
const tsFiles = files.filter(f => f.endsWith('.ts'));
const tasks = tsFiles.map(f => CC("Analyze: " + f));
```

### 5. 💾 fs.readFile/writeFile for CVM State (LOW)
**Problem**: Can't persist analysis results between runs
**Solution**: Let CVM save/load its own data
- NOT for Claude's file reading (Claude uses own tools)
- For intermediate results, progress tracking
- Example: Save analysis summary after each batch

### 6. 🔍 String Pattern Matching (LOW)
**Problem**: Can't filter files by pattern
**Solution**: Basic regex support
```typescript
if (filename.match(/\.test\.ts$/)) {
  CC("Run test analysis: " + filename);
}
```

## What We DON'T Need
❌ Complex debugging tools (keep CVM programs simple)
❌ General computation features (not the mission)
❌ Direct Claude API integration (MCP boundary works well)
❌ Advanced scheduling (simple is better)

## Key Insight from Analysis
The most critical realization: **fs.readFile() isn't needed** because Claude has direct file access. CVM just passes file paths in tasks. This keeps the architecture clean and focused on orchestration rather than file handling.

## Implementation Order
1. First: Array methods (enables better file processing)
2. Then: Error handling (prevents task failure cascades)  
3. Then: Task metadata (improves task clarity)
4. Later: Other features as needed

## Success Metric
Can CVM reliably orchestrate Claude through analyzing 1000+ files without losing track, handling errors gracefully, and producing organized results?