# CVM API.md Documentation Accuracy Report

## Critical Issues Found

### 1. Property Access Returns Wrong Type
**Documentation Says:** "Accessing non-existent properties returns `null`"
**Actual Behavior:** Returns `undefined`
**Evidence:** In `packages/vm/src/lib/handlers/objects.ts:99`:
```typescript
state.stack.push(value ?? createCVMUndefined());
```

### 2. for-of Loop Array Snapshot Misleading
**Documentation Says:** "The loop creates a snapshot of the array at the start of iteration"
**Actual Behavior:** Only the array LENGTH is snapshotted, not the array contents
**Evidence:** In `packages/vm/src/lib/handlers/iterators.ts:43-47`:
```typescript
state.iterators.push({
  array: array,  // Reference to original array
  index: 0,
  length: array.elements.length  // Only length is snapshotted
});
```

## Verified Correct Claims

### 1. console.log Single Argument
✓ Correctly documented - PRINT opcode takes only 1 value from stack

### 2. Increment/Decrement Behavior
✓ Pre/post increment correctly implemented with instruction.arg flag

### 3. fs.listFiles Default
✓ Defaults to empty options object when not provided

### 4. array.push Return Value
✓ Returns the array itself for chaining

### 5. Logical Operators
✓ AND/OR correctly implement short-circuit evaluation
✓ Return the actual value, not just boolean

### 6. String Methods
✓ substring handles negative indices correctly (clamps to 0)
✓ slice follows JavaScript behavior with negative indices
✓ charAt returns empty string for out-of-bounds

### 7. Type Coercion
✓ cvmToNumber follows JavaScript rules:
  - empty string → 0
  - null → 0  
  - undefined → NaN
  - arrays → NaN
  - booleans → 1/0

### 8. Binary + Operator
✓ Correctly determines string concatenation vs numeric addition
✓ Uses CONCAT for string operands, ADD for others

## Other Observations

### Division by Zero
- Throws DivisionByZero error (not documented in API.md)
- Unlike JavaScript which returns Infinity

### Type System
- Uses CVMUndefined type (not native undefined)
- Arrays and objects are always truthy
- typeof returns 'array' for arrays (not 'object')

## Recommendations

1. **Fix Property Access Documentation**
   - Change "returns `null`" to "returns `undefined`"

2. **Clarify for-of Loop Behavior**
   - Explain that only array length is snapshotted
   - Array contents can change during iteration

3. **Document Error Conditions**
   - Add division by zero behavior
   - List all possible runtime errors

4. **Add Type System Details**
   - Explain CVMUndefined vs native undefined
   - Document typeof return values for all types