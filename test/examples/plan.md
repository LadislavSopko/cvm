# TDDAB Plan: Hello World Mini Project
**Date:** 2026-05-25

<mission>
PROJECT: Mini TypeScript project to test CVM planexecutor pipeline.
Located in /home/laco/cvm/test/examples/src/

TECH STACK: Pure TypeScript files. No build system, no framework.
Tests are manual verification (check file exists, run with tsx).

WHAT WE ARE BUILDING: Two utility functions:
1. src/greet.ts — greeting function
2. src/farewell.ts — farewell function

Each block creates one file and verifies it works.
</mission>

<block id="01-greet">
## TDDAB-1: Create Greeting Function

<intro>
Create a greeting function that takes a name and returns "Hello, {name}!".
File to create: /home/laco/cvm/test/examples/src/greet.ts
</intro>

<red>
- test: greet.ts file exists
- test: greet("World") returns "Hello, World!"
- test: greet("") returns "Hello, !"
</red>

### Implementation
```typescript
export function greet(name: string): string {
  return "Hello, " + name + "!";
}
```

<success>
- [ ] src/greet.ts exists with greet function
- [ ] greet("World") returns "Hello, World!"
</success>
</block>

<block id="02-farewell">
## TDDAB-2: Create Farewell Function

<intro>
Create a farewell function that takes a name and returns "Goodbye, {name}!".
File to create: /home/laco/cvm/test/examples/src/farewell.ts
Depends on block 01.
</intro>

<red>
- test: farewell.ts file exists
- test: farewell("World") returns "Goodbye, World!"
- test: farewell("") returns "Goodbye, !"
</red>

### Implementation
```typescript
export function farewell(name: string): string {
  return "Goodbye, " + name + "!";
}
```

<success>
- [ ] src/farewell.ts exists with farewell function
- [ ] farewell("World") returns "Goodbye, World!"
</success>
</block>

## Execution Order
```
01-greet    → no dependencies
02-farewell → depends on 01
```
