# Phase 3 Implementation: Iteration

## VM Implementation (COMPLETE)

### Opcodes Implemented
1. **ITER_START**
   - Pops array from stack
   - Validates it's an array (error on null/undefined/non-array)
   - Creates snapshot of array elements
   - Pushes iterator context to state.iterators
   - Enforces max depth of 10 iterators

2. **ITER_NEXT**
   - Requires active iterator (error if none)
   - Gets top iterator from stack
   - If has more elements:
     - Pushes current element
     - Pushes `true` (hasMore flag)
     - Advances index
   - If no more elements:
     - Pushes `null` (not undefined - CVMValue constraint)
     - Pushes `false` (hasMore flag)

3. **ITER_END**
   - Requires active iterator (error if none)
   - Pops iterator from state.iterators
   - No stack operations

### Key Design Decisions

1. **Iterator Stack Management**
   ```typescript
   interface IteratorContext {
     array: CVMArray;
     index: number;
   }
   ```
   - Separate iterator stack allows nested loops
   - Maximum depth of 10 to prevent stack overflow

2. **Two-Value ITER_NEXT**
   - Pushes element first, then hasMore flag
   - Allows direct use with JUMP_IF_FALSE
   - Requires POP after STORE to remove hasMore

3. **Array Snapshots**
   - Iterator creates copy of array elements
   - Prevents modification during iteration
   - Consistent with foreach semantics

### Opcode Sequence Pattern
```
[array expression]
ITER_START              // Pop array, push iterator
:loop_start
ITER_NEXT               // Push element, push hasMore
JUMP_IF_FALSE :end      // Check hasMore flag
STORE variable          // Store element
POP                     // Remove hasMore flag
[loop body]
JUMP :loop_start
:loop_end
ITER_END                // Cleanup iterator
```

## Tests Created (38 new tests)

### ITER_START Tests (10)
- Valid array initialization
- Empty array handling
- Non-array error handling
- Null/undefined error handling
- Stack underflow detection
- Nested iterator support
- Iterator depth limit (10)
- Array snapshot behavior
- Mixed type arrays

### ITER_NEXT Tests (9)
- First element retrieval
- Array traversal
- End of array detection
- Empty array behavior
- No active iterator error
- Nested iterator independence
- Null element handling
- Stack order validation
- Snapshot isolation

### ITER_END Tests (8)
- Iterator removal
- Nested iterator handling
- No active iterator error
- Complete loop pattern
- Sequential iterators
- Stack preservation
- Reverse cleanup order
- Partial iteration cleanup

### Integration Test (1)
- Basic foreach pattern validation

## Next Steps: Parser Implementation

### Syntax Decision
```typescript
// Chosen syntax:
foreach (item in array) {
  // body
}

// Not for-in (reserved for objects)
// Not for-of (ES6 specific)
```

### Parser Tasks
1. Recognize `foreach` keyword
2. Parse `(identifier in expression)` pattern
3. Validate expression context
4. Create AST node representation

## Next Steps: Compiler Implementation

### CompilerState Extensions
```typescript
interface LoopContext {
  type: 'while' | 'foreach';
  startLabel: number;     // for continue
  endLabel: number;       // for break
  hasIterator: boolean;   // true for foreach
}
```

### Compilation Pattern
1. Compile array expression
2. Emit ITER_START
3. Mark loop start
4. Emit ITER_NEXT
5. Emit JUMP_IF_FALSE with forward reference
6. Emit STORE for loop variable
7. Emit POP to remove hasMore
8. Compile loop body
9. Emit JUMP back to loop start
10. Patch JUMP_IF_FALSE target
11. Emit ITER_END

### Break/Continue Support
- **Break**: Jump to ITER_END (ensures cleanup)
- **Continue**: Jump to ITER_NEXT (next iteration)
- Must maintain LoopContext stack

## Implementation Order
1. ✅ VM opcodes and tests
2. Parser foreach recognition
3. CompilerState loop context extension
4. Basic foreach compilation
5. Break/continue compilation
6. Integration tests
7. Update language documentation