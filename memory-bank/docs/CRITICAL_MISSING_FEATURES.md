# Critical Missing Features in CVM

## Discovered During Integration Testing

### 1. string.length - ✅ IMPLEMENTED!
- **Status**: FIXED - Added universal LENGTH opcode
- **Solution**: LENGTH opcode works for both strings and arrays
- **Example that now works**: `let len = password.length;`
- **Tested**: Full integration test suite passes

### 2. undefined value - CRITICAL  
- **Issue**: No `undefined` type or keyword
- **Impact**: Cannot check for missing values, breaks common JS patterns
- **Example that fails**: `if (x === undefined)`
- **Current workaround**: Use `null` instead

### 3. String Methods - IMPORTANT
- **Missing**: substring, indexOf, charAt, split, trim, etc.
- **Impact**: No string manipulation possible
- **Example use cases**: 
  - Validate email format
  - Extract parts of strings
  - Clean user input

## Why These Matter

These aren't nice-to-have features - they're FUNDAMENTAL for any real programming:
- How do you validate a password without checking its length?
- How do you check if a variable was initialized without undefined?
- How do you process text without string methods?

## Implementation Priority

1. ✅ **string.length** - IMPLEMENTED with universal LENGTH opcode
2. ✅ **return from main()** - IMPLEMENTED, returns value to AI
3. **undefined** - Add as a proper value type in the VM
4. **Basic string methods** - Start with substring and indexOf

## Lessons Learned

The "Unknown opcode: RETURN" issue revealed critical testing gaps:
- Unit tests alone are insufficient - need integration tests
- Monorepo build artifacts can become stale
- Always test the full compile → execute flow
- Add type information to error messages for debugging