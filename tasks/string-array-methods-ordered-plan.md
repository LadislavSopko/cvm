# String & Array Methods Implementation - Ordered Tasks

## Implementation Order (Dependencies Resolved)

### Phase 1: Add Opcodes to Bytecode (Foundation)
**File**: `/home/laco/cvm/packages/parser/src/lib/bytecode.ts`

1. **[Lines 1-13]** Add all 15 opcodes to the OpCode enum:
   - STRING_INCLUDES, STRING_ENDS_WITH, STRING_STARTS_WITH
   - STRING_TRIM, STRING_TRIM_START, STRING_TRIM_END
   - STRING_REPLACE, STRING_REPLACE_ALL
   - STRING_LAST_INDEX_OF, STRING_REPEAT
   - STRING_PAD_START, STRING_PAD_END
   - ARRAY_SLICE, ARRAY_JOIN, ARRAY_INDEX_OF
   - Reference: Implementation plan lines 507-529

### Phase 2: String Checking Methods Tests (TDD)
**Directory**: `/home/laco/cvm/test/programs/03-built-ins/`

2. **[Lines 15-20]** Write test file `string-checking-methods.ts`:
   - Test includes(), endsWith(), startsWith()
   - Test cases: path.endsWith('.ts'), path.startsWith('/home'), path.includes('test')
   - Reference: Implementation plan lines 580-590

### Phase 3: String Checking Methods Implementation
**File**: `/home/laco/cvm/packages/parser/src/lib/compiler/expressions/call-expression.ts`

3. **[Lines 22-26]** Add compiler support for string checking methods:
   - Add cases for includes, endsWith, startsWith
   - Reference: Implementation plan lines 455-468

**File**: `/home/laco/cvm/packages/vm/src/lib/handlers/advanced.ts`

4. **[Lines 28-31]** Implement STRING_INCLUDES handler
   - Reference: Implementation plan lines 52-67

5. **[Lines 33-36]** Implement STRING_ENDS_WITH handler
   - Reference: Implementation plan lines 76-91

6. **[Lines 38-41]** Implement STRING_STARTS_WITH handler
   - Reference: Implementation plan lines 100-115

### Phase 4: String Trim Methods Tests (TDD)

7. **[Lines 43-47]** Write test file `string-trim-methods.ts`:
   - Test trim(), trimStart(), trimEnd()
   - Test whitespace removal from user input
   - Reference: Implementation plan lines 598-601

### Phase 5: String Trim Methods Implementation

8. **[Lines 49-53]** Add compiler support for trim methods:
   - Add cases for trim, trimStart, trimEnd
   - Reference: Implementation plan lines 470-473, 536-543

9. **[Lines 55-58]** Implement STRING_TRIM handler
   - Reference: Implementation plan lines 124-137

10. **[Lines 60-63]** Implement STRING_TRIM_START and STRING_TRIM_END handlers
    - Reference: Implementation plan lines 209-233

### Phase 6: String Replace Methods Tests (TDD)

11. **[Lines 65-70]** Write test file `string-replace-methods.ts`:
    - Test replace() and replaceAll()
    - Test: path.replace('/home/user', '~'), path.replaceAll('/', '\\')
    - Reference: Implementation plan lines 604-605

### Phase 7: String Replace Methods Implementation

12. **[Lines 72-76]** Add compiler support for replace methods:
    - Add cases for replace and replaceAll
    - Reference: Implementation plan lines 474-479, 544-549

13. **[Lines 78-81]** Implement STRING_REPLACE handler (FIRST occurrence only)
    - Reference: Implementation plan lines 146-169

14. **[Lines 83-86]** Implement STRING_REPLACE_ALL handler
    - Reference: Implementation plan lines 178-199

### Phase 8: String Utility Methods Part 1 Tests (TDD)

15. **[Lines 88-93]** Write test file `string-utility-methods.ts`:
    - Test lastIndexOf() and repeat()
    - Test: path.lastIndexOf('.'), '='.repeat(50)
    - Reference: Implementation plan lines 593-594, 608

### Phase 9: String Utility Methods Part 1 Implementation

16. **[Lines 95-99]** Add compiler support for utility methods part 1:
    - Add cases for lastIndexOf and repeat
    - Reference: Implementation plan lines 550-558

17. **[Lines 101-104]** Implement STRING_LAST_INDEX_OF handler
    - Reference: Implementation plan lines 242-257

18. **[Lines 106-109]** Implement STRING_REPEAT handler
    - Reference: Implementation plan lines 266-283

### Phase 10: String Padding Methods Tests (TDD)

19. **[Lines 111-116]** Update `string-utility-methods.ts` for padding:
    - Add tests for padStart() and padEnd()
    - Test: 'Name'.padEnd(20, ' '), '42'.padStart(5, '0')
    - Reference: Implementation plan lines 612-619

### Phase 11: String Padding Methods Implementation

20. **[Lines 118-122]** Add compiler support for padding methods:
    - Add cases for padStart and padEnd
    - Reference: Implementation plan lines 560-571

21. **[Lines 124-127]** Implement STRING_PAD_START and STRING_PAD_END handlers
    - Reference: Implementation plan lines 294-336

### Phase 12: Array Methods Tests (TDD)

22. **[Lines 129-134]** Write test file `array-methods.ts`:
    - Test slice(), join(), indexOf()
    - Test: files.slice(0, 2), files.join(','), files.indexOf('README.md')
    - Reference: Implementation plan lines 624-635

### Phase 13: Array Methods Implementation

23. **[Lines 136-141]** Add compiler support for array methods:
    - Add cases for slice, join, indexOf
    - Note: slice needs special handling for optional second argument
    - Reference: Implementation plan lines 481-501

**File**: `/home/laco/cvm/packages/vm/src/lib/handlers/arrays.ts`

24. **[Lines 143-146]** Implement ARRAY_SLICE handler
    - Reference: Implementation plan lines 347-379

25. **[Lines 148-151]** Implement ARRAY_JOIN handler
    - Reference: Implementation plan lines 388-413

26. **[Lines 153-156]** Implement ARRAY_INDEX_OF handler
    - Reference: Implementation plan lines 422-446

### Phase 14: Comprehensive Integration Test

27. **[Lines 158-163]** Write comprehensive test file:
    - File: `/home/laco/cvm/test/programs/09-comprehensive/string-array-methods-all.ts`
    - Test all 15 methods together
    - Reference: Implementation plan lines 575-638

### Phase 15: Final Validation

28. **[Lines 165-167]** Run all VM package tests
    - Ensure no regressions

29. **[Lines 169-171]** Run all parser package tests
    - Ensure parser changes work correctly

30. **[Lines 173-176]** Update documentation:
    - Update `/home/laco/cvm/docs/API.md`
    - Mark all methods as 'Implemented & Tested'

## Summary

Total tasks: 30
- 1 opcode addition task
- 6 test writing tasks (TDD)
- 6 compiler support tasks
- 15 handler implementation tasks
- 2 final validation tasks

Each task references specific line numbers in this plan and the original implementation plan for precise implementation details.