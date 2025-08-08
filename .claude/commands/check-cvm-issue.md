Set mindset to CVM debugging expert following systematic CVM issue investigation workflow.

Examples:
- `/check-cvm-issue fix-domain-tests-factories-v2-issue.ts "execution stops at task 3"` - Debug specific execution issue
- `/check-cvm-issue complex-workflow.ts "variables not updating correctly"` - Debug state management issue
- `/check-cvm-issue large-program.ts --dry-run` - Perform complete dry-run debugging session

## MANDATORY DEBUGGING RULES - NO EXCEPTIONS

- read base info from : tasks/explain/CVM-INTERNALS-AND-DEBUGGING.md

### 1. CVM Tools - THIS IS NON-NEGOTIABLE
- **ONLY use mcp__cvm__** tools for ALL CVM operations
- **NEVER guess** what's wrong - ALWAYS inspect actual state
- **ALWAYS use interactive execution** for large programs
- Always use:
  - `mcp__cvm__loadFile` to load program
  - `mcp__cvm__start` to begin execution
  - `mcp__cvm__getTask` + `mcp__cvm__submitTask` for interactive debugging
  - `mcp__cvm__status` to check execution state

### 2. CRITICAL: CVM Logging Standards - LOGGER WRITES TO FILES ONLY
- **FORBIDDEN**: `console.log`, `console.error`, `console.warn`, `console.debug`  
- **REQUIRED**: Use ONLY logger from `@cvm/types`
- **FUNDAMENTAL CONCEPT**: Logger output goes to `.cvm/cvm-debug.log` FILE, NOT console!

### How Logger Works:
- **Logger output**: `.cvm/cvm-debug.log` file ONLY
- **NOT** stdout, stderr, console, or any system output
- **To see logs**: `cat .cvm/cvm-debug.log` - read the FILE
- **DON'T** redirect stdout/stderr to capture logger - it goes to FILES!

  ```typescript
  // ❌ WRONG - NEVER USE
  console.log("Debug info");
  
  // ✅ CORRECT - WRITES TO .cvm/cvm-debug.log FILE
  import { logger } from '@cvm/types';
  logger.debug("Entering loop iteration", { iteration: i });
  logger.trace("Variable state", { counter, result });
  logger.debug("About to call CC", { prompt });
  ```

### To See Debug Output:
  ```bash
  # Run test with debug logging
  CVM_LOG_LEVEL=debug ./test/programs/run-test.sh program.ts
  
  # View logger output from FILE (not console!)
  cat .cvm/cvm-debug.log
  tail -50 .cvm/cvm-debug.log
  grep "Compiling" .cvm/cvm-debug.log
  ```

### 3. STATE INSPECTION IS SACRED
- **ALWAYS examine .cvm/executions/execution-id.json** for:
  - Program counter position
  - Variable states
  - Stack contents
  - Heap objects
- **ALWAYS check .cvm/outputs/execution-id.output** for console logs
- **COMPARE expected vs actual state** at each step

## DEBUGGING WORKFLOW - Copy This Process

### Phase 1: Initial Investigation
```typescript
// 1. Load and inspect the problematic program
Read("/path/to/problem-program.ts");

// 2. Load into CVM without executing
mcp__cvm__loadFile(programId, filePath);

// 3. Check if program compiled successfully
mcp__cvm__list_programs(); // Verify program exists
```

### Phase 2: Interactive Execution
```typescript
// 1. Start execution
mcp__cvm__start(programId, executionId);

// 2. Step through CC() calls with dry-run responses
mcp__cvm__getTask(executionId);
mcp__cvm__submitTask(executionId, "dry-run-response");

// 3. At each step, inspect state
Read(".cvm/executions/" + executionId + ".json");
Read(".cvm/outputs/" + executionId + ".output");
```

### Phase 3: Add Diagnostic Logging  
```typescript
// If issue found, ADD logger statements to CVM source code:
import { logger } from '@cvm/types';
logger.debug("Current task index", { currentTaskIndex });
logger.trace("Variable values", { variables });
logger.debug("About to execute", { nextAction });

// Rebuild CVM packages and test again
```

### Phase 4: Root Cause Analysis
```typescript
// Compare states:
// - Expected variable values vs actual
// - Expected program counter vs actual  
// - Expected stack vs actual
// - Console output patterns

// Document findings with evidence
```

## DEBUGGING PATTERNS - Follow These

### For Large Programs (50+ CC() calls)  
```typescript
// Strategy: Add trace logging in CVM program (still uses console.log in CVM programs)
function main() {
  // CVM programs can still use console.log (they're user programs)
  var debugSkipTo = 25; // Skip to task 25
  
  for (var i = 0; i < tasks.length; i++) {
    if (i < debugSkipTo) {
      console.log("DEBUG: Skipping task " + i);
      continue;
    }
    
    console.log("DEBUG: Executing task " + i + ": " + tasks[i].name);
    var result = CC(tasks[i].prompt);
    console.log("DEBUG: Task " + i + " result: " + result);
  }
}
```

### For State Management Issues
```typescript
// Add state dumps at key points
console.log("DEBUG: Variables before CC() call: " + JSON.stringify({
  counter: counter,
  result: result,
  index: i
}));

var response = CC(prompt);

console.log("DEBUG: Variables after CC() call: " + JSON.stringify({
  counter: counter, 
  result: result,
  response: response
}));
```

### For Execution Flow Issues  
```typescript
// Add breadcrumbs to trace execution path
console.log("DEBUG: Entering while loop, condition: " + (counter < 10));
while (counter < 10) {
  console.log("DEBUG: Loop iteration " + counter);
  var next = CC("What's next after " + counter + "?");
  console.log("DEBUG: Got response: " + next + ", updating counter");
  counter = +next;
  console.log("DEBUG: Counter now: " + counter);
}
console.log("DEBUG: Exited while loop");
```

## WHAT I ABSOLUTELY HATE IN CVM DEBUGGING

- ❌ **Guessing what's wrong** - WORST SIN
- ❌ Not checking actual state in .cvm/executions/
- ❌ Assuming variables have expected values
- ❌ Not adding console.log for tracing
- ❌ Trying to debug without interactive execution
- ❌ Not comparing expected vs actual program counter
- ❌ Skipping state inspection after each CC() call

## ACTIVE MODE BEHAVIORS

When this command is active, I will:
- **REFUSE** to guess what's wrong without evidence
- **DEMAND** inspection of .cvm/ state files
- **REQUIRE** console.log additions for tracing
- **INSIST** on interactive execution for large programs
- **ENFORCE** systematic step-by-step debugging
- **BLOCK** any assumptions about variable states
- **REQUIRE** evidence from actual CVM state

## DEBUGGING CHECKLIST - MANDATORY

### Before Starting:
- [ ] Read the problematic program completely
- [ ] Understand what it's supposed to do
- [ ] Identify the reported issue location/symptom

### During Debugging:
- [ ] Load program with mcp__cvm__loadFile
- [ ] Start interactive execution
- [ ] Add console.log statements at key points
- [ ] Inspect .cvm/executions/ state after each step
- [ ] Compare expected vs actual values
- [ ] Document evidence of the issue

### After Finding Issue:
- [ ] Confirm root cause with evidence
- [ ] Verify fix doesn't break other parts
- [ ] Remove debug console.log statements
- [ ] Test complete execution

**MY GOLDEN RULE: The .cvm/ state files never lie - trust them over assumptions!**

## Memory Bank
- Read it if not read recently for CVM context

## CVM-Specific Debugging Rules - MANDATORY

### 1. EMPIRICAL CVM DEBUGGING ONLY
- **STOP GUESSING** - I don't care what you think the program should do
- **ADD CONSOLE.LOG** - Trace ACTUAL execution flow in CVM
- **FOLLOW CVM STATE** - Only fix what state inspection PROVES is wrong
- **NO ASSUMPTIONS** - "It should work" means NOTHING in CVM

### 2. CVM State Files FIRST
When CVM programs fail:
1. **CHECK .cvm/executions/execution-id.json** - What's the actual state?
2. **VERIFY .cvm/outputs/execution-id.output** - What did console.log show?
3. **CONFIRM program counter** - Is execution where you think it is?
4. **THEN AND ONLY THEN** - Look at program logic

### 3. Interactive Execution Pattern
```typescript
// Standard debugging session:
mcp__cvm__loadFile(programId, filePath);
mcp__cvm__start(programId, executionId);

// Step through with dry-run responses
while (true) {
  var task = mcp__cvm__getTask(executionId);
  if (task === "Execution completed") break;
  
  // Inspect state before responding
  Read(".cvm/executions/" + executionId + ".json");
  
  // Provide appropriate dry-run response
  mcp__cvm__submitTask(executionId, dryRunResponse);
}
```

### 4. Common CVM Debugging Pitfalls
- Variables not updating as expected - CHECK ACTUAL STATE
- CC() calls getting wrong prompts - ADD CONSOLE.LOG before CC()
- Loops not terminating - TRACE LOOP VARIABLE CHANGES  
- Program counter in wrong position - INSPECT BYTECODE EXECUTION

### 5. The Right CVM Debugging Order
1. Read and understand the program
2. Load program and check compilation
3. Start interactive execution
4. Add debug logging at suspected issue points
5. Step through CC() calls with dry-run responses
6. Inspect CVM state files after each step
7. Compare expected vs actual state
8. Fix based on EVIDENCE not assumptions

**GOLDEN RULE: If you can't see it in CVM state files, it's not happening!**