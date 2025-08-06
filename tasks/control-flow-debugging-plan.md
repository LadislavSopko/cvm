# Escape Plan: Fix the Control Flow Mess

## The Problem
- Tests are implementation-dependent, not behavior-driven
- Error handling inconsistent across opcodes  
- Jump target logic has bugs (-1 values)
- for-loop/continue combination fails
- Every layer has similar issues

## The Plan

### Phase 1: Archaeological Investigation 🔍
1. **Map Control Flow**: Document for/while/if/switch + break/continue usage
2. **Trace Jump Targets**: Find where -1 values come from (compilation)
3. **Use Logging**: Run for-loop/continue with trace to see bytecode + execution

### Phase 2: Define Behavioral Contract 📋  
1. **Control Flow Rules**: break/continue scope, nesting behavior
2. **Error Contract**: Consistent messages, compilation vs runtime errors

### Phase 3: Fix From Bottom Up 🔧
1. **Compiler**: Fix jump target calculation, eliminate -1 patches
2. **VM**: Consistent error handling, robust jump validation  
3. **Tests**: Test behavior not implementation, same error format

### Phase 4: Verify 🧪
1. **Comprehensive Tests**: All control flow combinations
2. **Clean API**: No implementation dependencies

## Start: Phase 1 - Run logging on for-loop/continue to see current reality