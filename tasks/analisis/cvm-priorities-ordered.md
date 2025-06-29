# CVM Priorities - Ordered by Impact and Effort

Based on comprehensive analysis, here are all findings organized by priority for a task automation tool.

## 🔴 CRITICAL - Must Fix (Hours to Days)

### 1. The [] Accessor Bug (1 hour fix!)
- **Impact**: Basic functionality broken - `obj[123]` fails
- **Location**: `/packages/vm/src/lib/handlers/arrays.ts:114`
- **Fix**: Change `const key = index as string;` to `const key = cvmToString(index);`
- **Why Critical**: This is THE original bug, still breaking core functionality

### 2. Silent Compiler Failures (3-4 hours)
- **Impact**: Code silently deleted, no warnings, debugging nightmare
- **Location**: `/packages/parser/src/lib/compiler.ts:40-43`
- **Fix**: Throw errors instead of silently skipping unsupported syntax
- **Why Critical**: Destroys all trust - you write code that doesn't run

### 3. Basic Error Propagation (1-2 days)
- **Impact**: Any error crashes entire program
- **Fix**: Wrap VM execution in try/catch, return Result<Success, Error>
- **Why Critical**: Can't process 1000 files if one is bad

## 🟠 HIGH PRIORITY - Major Improvements (Days to Week)

### 4. Memory Leaks (2-3 days)
- **Impact**: Long-running servers exhaust memory
- **Location**: VMManager never removes VMs from cache
- **Fix**: Clean up VM cache on deletion, basic heap GC
- **Why Important**: Production stability

### 5. Array Methods Without Functions (3-5 days)
- **Impact**: Code is 3-5x more verbose than needed
- **Workaround**: Implement array.map/filter as special opcodes (not callbacks)
- **Why Important**: Highest priority feature from Memory Bank

### 6. Better Error Messages (2-3 days)
- **Impact**: "ARRAY_GET requires numeric index at PC 47" - useless
- **Fix**: Include line numbers, variable names, expressions
- **Why Important**: Developer experience

### 7. Compound Assignment Fix (1-2 days)
- **Impact**: Can't do `arr[i] += 1`
- **Location**: `/packages/parser/src/lib/compiler/statements/expression-statement.ts:66`
- **Fix**: Generate proper bytecode sequence
- **Why Important**: Common pattern broken

## 🟡 MEDIUM PRIORITY - Nice to Have (Week+)

### 8. Try/Catch Implementation (1-2 weeks)
- **Impact**: Can't handle expected errors gracefully
- **Complexity**: Needs exception handler stack, CC() integration
- **Why Medium**: Workaround exists (check before operations)

### 9. Stack Manipulation Opcodes (2-3 days)
- **Impact**: Inefficient bytecode with temp variables
- **Fix**: Add SWAP, DUP, ROT opcodes
- **Why Medium**: Performance not critical for CC() waits

### 10. Fix Type Coercion (2-3 days)
- **Impact**: Wrong opcode for `a += b` when b is string
- **Fix**: Runtime type checking in ADD opcode
- **Why Medium**: Edge case but causes confusion

### 11. Unified GET/SET Opcodes (3-4 days)
- **Impact**: ARRAY_GET handles objects too (confusing)
- **Fix**: Create ELEMENT_GET/SET for all bracket access
- **Why Medium**: Architectural cleanliness

## 🟢 LOW PRIORITY - Future Considerations

### 12. Functions Implementation (3-4 weeks)
- **Impact**: No code reuse, no real callbacks
- **Complexity**: Call stack, return addresses, scoping
- **Why Low**: CVM works for linear scripts

### 13. Switch Statements (1 week)
- **Impact**: Missing common control flow
- **Why Low**: If/else chains work fine

### 14. For Loops (3-4 days)
- **Impact**: Only for-of works
- **Why Low**: For-of covers most cases

### 15. Proper Scoping (2 weeks)
- **Impact**: Everything is global
- **Why Low**: Works for simple scripts

## 📐 ARCHITECTURAL - Long Term (Months)

### 16. Decouple Parser/VM (2-3 weeks)
- **Impact**: Adding features requires 7+ file changes
- **Options**: Merge into @cvm/core OR pluggable opcodes
- **Why Architectural**: Development velocity

### 17. Centralize State Management (2 weeks)
- **Impact**: 6+ places to update for any state change
- **Fix**: Single ExecutionContext object
- **Why Architectural**: Maintainability

### 18. Replace JSON Serialization (1 week)
- **Impact**: Performance bottleneck on CC()
- **Fix**: Use proven library like flatted
- **Why Architectural**: But performance doesn't matter vs CC() time

### 19. AST Interpreter Option (4-6 weeks)
- **Impact**: Eliminate bytecode complexity entirely
- **Benefit**: Rapid feature addition
- **Why Architectural**: Complete paradigm shift

## ✅ ALREADY DONE - Just Document!

### 20. fs.readFile/writeFile
- **Status**: FULLY IMPLEMENTED
- **Problem**: Memory Bank says it's not done
- **Action**: Update documentation

## 🚫 PROBABLY NEVER NEEDED

### 21. Async/Await
- **Why Not**: CC() is synchronous anyway

### 22. Classes & OOP
- **Why Not**: Procedural scripts are fine

### 23. Module System
- **Why Not**: Single file scripts work

### 24. Performance Optimization
- **Why Not**: CC() takes 30+ seconds

## Quick Win Sequence (What to do first)

1. **Day 1**: Fix [] accessor bug (1 hour) + tests
2. **Day 2-3**: Stop silent compiler failures 
3. **Day 4-5**: Basic error propagation
4. **Week 2**: Memory leak fixes
5. **Week 3**: Array methods as special opcodes
6. **Week 4**: Better error messages

This gets you a reliable CVM in ~1 month without architectural changes.

## Key Insights

1. **CVM is NOT a JavaScript VM** - It's a task automation tool
2. **Reliability > Features** - Better to do less reliably
3. **CC() changes everything** - 30 second waits make perf irrelevant
4. **Linear scripts are OK** - Don't need full programming language
5. **4 dev sessions built this** - Can fix quickly too

## The Bottom Line

Fix the critical issues (1-3) and CVM becomes usable. Add high priority items (4-7) and it becomes pleasant. Everything else is optional based on actual user needs.

Most importantly: **The [] accessor bug is still there after 1000+ lines of analysis!** Fix that first!