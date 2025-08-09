# Control Flow Simple Fix - TDDAB Plan

## The Real Problem
- VM has inconsistent error messages: BREAK vs CONTINUE format differently
- Tests expect hardcoded strings instead of consistent behavior
- Adding logging broke tests because they test implementation details

## Current Broken State
- `packages/vm/src/lib/vm.ts` line 145: CONTINUE gets special suffix, BREAK doesn't
- `packages/vm/src/lib/vm-break-continue.spec.ts` lines 76, 98: hardcoded error strings

---

## TDDAB Execution Order

### TDDAB-1: Fix VM Error Message Consistency ✅
**Goal**: Make BREAK and CONTINUE use same error format

**File**: `packages/vm/src/lib/vm.ts` line 145

**Current Code**:
```typescript
const errorSuffix = (instruction.arg < 0 && instruction.op === OpCode.CONTINUE) ? ' (not patched properly during compilation)' : '';
state.error = `Invalid ${opName} target: ${instruction.arg}${errorSuffix}`;
```

**Fixed Code**:
```typescript
// Consistent error format for all jump operations
state.error = `Invalid ${opName} target: ${instruction.arg}`;
```

**Test**: `npx nx test vm` should fail on hardcoded tests

---

### TDDAB-2: Fix Hardcoded Test Expectations ✅
**Goal**: Make tests expect consistent error format

**File**: `packages/vm/src/lib/vm-break-continue.spec.ts`

**Current Broken Tests**:
```typescript
// Line 76
expect(result.error).toBe('Invalid break target: -1');

// Line 98  
expect(result.error).toBe('Invalid continue target: -1 (not patched properly during compilation)');
```

**Fixed Tests**:
```typescript
// Line 76
expect(result.error).toBe('Invalid break target: -1');

// Line 98
expect(result.error).toBe('Invalid continue target: -1');
```

**Test**: `npx nx test vm` should pass

---

### TDDAB-3: Validate Complete Fix ✅
**Goal**: Ensure all tests pass and behavior is consistent

**Commands**:
- `npx nx test vm` - all VM tests pass
- Test adding logging doesn't break anything

**Success Criteria**:
- BREAK and CONTINUE have same error format
- All 691 tests still pass
- Adding logging/observability doesn't break tests

---

## Total Work: 2 simple code changes, ~15 minutes