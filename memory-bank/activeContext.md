# Active Context

## Current Work Focus

### String & Array Methods Implementation Ready
- Test cleanup completed ✅
- Created comprehensive implementation plan for 15 methods
- Implementation plans available in tasks directory
- 15 methods ready: 12 string methods + 3 array methods

## Recent Changes

### Test Suite Organization (Completed)
- Reorganized 60+ tests into 42 tests across 9 categories
- Removed 20+ redundant tests
- Set up test artifacts to write to tmp/ directory
- Updated API.md with current implementation status

### String & Array Methods Planning (Completed)
- Created /home/laco/cvm/tasks/string-array-methods-implementation-plan.md
- Created /home/laco/cvm/tasks/string-array-methods-ordered-plan.md
- 15 methods ready: 12 string methods + 3 array methods

## Next Steps

### Immediate
1. Implement 15 string/array methods following TDD approach
2. Each method will be: test written → compiler support → handler implementation
3. Use implementation plans in tasks directory as reference

### After String/Array Methods
1. Create integration test README
2. Update main project README if needed
3. Add examples directory with documented samples

### Medium Term
1. Function parameters support
2. Traditional for(;;) loops
3. Better error recovery mechanisms
4. Performance optimizations

## Active Decisions and Considerations

### Design Principles
- **Passive architecture** - CVM never initiates, only responds
- **State preservation first** - Never lose user progress
- **Clean boundaries** - Each package has single responsibility
- **No exceptions** - Operations return success/failure states

### Documentation Standards
- Every package needs README
- Examples required for all features
- Cross-references for navigation
- Testing instructions mandatory

## Important Patterns and Preferences

### Code Organization
- Nx monorepo with clear package boundaries
- Handler pattern for VM opcodes
- Visitor pattern for compiler
- Storage adapter pattern for persistence

### Development Workflow
- Always rebuild after changes (`npx nx reset && npx nx run-many --target=build --all`)
- Use E2E tests to verify functionality
- Document as you go
- Memory Bank is source of truth

## Learnings and Project Insights

### Key Insights from Documentation Work
1. Package dependency order matters for understanding
2. Handler architecture is well-designed and extensible
3. Test coverage is good (83%+ in core packages)
4. E2E testing critical for catching integration issues

### What Makes CVM Special
- Inversion of control - AI drives, CVM responds
- Perfect state preservation between calls
- Observable execution at any point
- Designed specifically for AI task orchestration

### Current Understanding
CVM is mature and well-architected. The core is solid, with room for feature additions like function parameters and better error handling. The passive MCP server design is elegant and enables the unique execution model.