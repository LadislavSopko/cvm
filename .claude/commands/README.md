# CVM Command Hierarchy

## Command Structure

```
cvm-senior.md (BASE MINDSET)
    ├── check-cvm-issue.md (inherits + adds debugging)
    └── generate-cvm-program.md (inherits + adds program generation)
```

## 1. `/user:cvm-senior` - Base Mindset
**Purpose**: Sets TypeScript/Node.js senior developer mindset for CVM
**First Action**: 
1. Read memory-bank/README.md
2. Follow README's instructions
3. WAIT for user instruction

**Key Rules**:
- NX commands only (no npm/yarn directly)
- BTLT process (Build, TypeCheck, Lint, Test)
- .js extension in imports
- Operations return null on error (never throw)
- TDDAB methodology
- Memory Bank is single source of truth

## 2. `/check-cvm-issue` - Debugging Expert
**Purpose**: Debug CVM program execution issues
**Inherits**: All rules from cvm-senior
**First Action**: 
1. Apply cvm-senior mindset
2. Read the problematic program
3. Begin systematic debugging

**Additional Rules**:
- Use mcp__cvm__ tools only
- Inspect .cvm/ state files
- Interactive execution for large programs
- Logger writes to files, not console
- Empirical debugging only (no guessing)

## 3. `/generate-cvm-program` - Program Generator
**Purpose**: Generate CVM programs from TDDAB plans
**Inherits**: All rules from cvm-senior
**First Action**:
1. Apply cvm-senior mindset
2. Read specified plan file
3. Generate CVM program

**Additional Rules**:
- Plan back-references required
- Self-sufficient CC() prompts
- Simple result words (done/passed/failed)
- Atomic commits after each TDDAB
- Follow existing program patterns

## Usage Flow

### For General Development:
```
/user:cvm-senior
[waits for instruction]
"Implement parseInt function"
[proceeds with TDDAB methodology]
```

### For Debugging:
```
/check-cvm-issue program.ts "execution stops at task 3"
[applies cvm-senior + debugging rules]
[begins systematic investigation]
```

### For Program Generation:
```
/generate-cvm-program /tasks/plan.md
[applies cvm-senior + generation rules]
[creates CVM program from plan]
```

## Key Principles

1. **Hierarchy**: Base mindset (cvm-senior) is always applied first
2. **Memory Bank**: Always read first to understand context
3. **No Assumptions**: Wait for explicit instructions
4. **Consistency**: All commands follow same patterns
5. **Traceability**: Everything references source documents