# Critical Bug Fixes

## Issues Found
During integration testing, two critical bugs were discovered that our unit tests missed:

1. **Arithmetic doing string concatenation** - `10 + 20` was returning "1020" instead of 30
2. **CC values returning null in arrays** - `arr[0] = CC("prompt")` was storing null

## Root Causes

### 1. ADD vs CONCAT Detection
- The compiler was defaulting to CONCAT for non-literal operands
- `hasStringOperand()` only checked immediate operands, not nested expressions
- Variables and CC results were treated as strings by default

### 2. Missing ARRAY_SET Implementation
- Only ARRAY_GET was implemented, no way to set array elements
- Assignment expressions only handled identifiers: `if (ts.isIdentifier(expr.left))`
- Array element assignments were silently ignored

## Solutions Implemented

### 1. Fixed ADD/CONCAT Detection
```typescript
// Old: Default to CONCAT for safety
if (hasStringOperand(node.left, node.right)) {
  state.emit(OpCode.CONCAT);
} else if (isLikelyNumeric(node.left) && isLikelyNumeric(node.right)) {
  state.emit(OpCode.ADD);
} else {
  state.emit(OpCode.CONCAT); // Default
}

// New: Default to ADD, let VM handle type conversion
if (hasStringOperand(node.left, node.right)) {
  state.emit(OpCode.CONCAT);
} else {
  state.emit(OpCode.ADD);
}
```

Also improved `hasStringOperand()` to recursively check binary expressions.

### 2. Implemented ARRAY_SET
- Added ARRAY_SET opcode to bytecode.ts
- Implemented VM handler that pops value, index, array
- Updated compiler to handle `ElementAccessExpression` assignments
- Used temp variable approach to reorder stack for correct operation

## Testing Improvements
- Added E2E arithmetic tests that verify actual results, not just opcodes
- Added array assignment tests for CC values
- Created comprehensive integration test covering all bug scenarios

## Lessons Learned
1. **Unit tests aren't enough** - Need E2E tests that verify actual output
2. **Test with real user scenarios** - CC values in arrays is a common pattern
3. **Default to expected behavior** - Users expect + to add numbers
4. **Recursive checks needed** - Expression trees can be deeply nested