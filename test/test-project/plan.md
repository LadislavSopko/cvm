# TDDAB Plan: Test Project
**Date:** 2026-05-25

<mission>
PROJECT: Mini TypeScript test project for validating CVM planexecutor pipeline.
Located in test/test-project/ within the CVM repository.

TECH STACK: TypeScript, Node.js, no build system needed — pure .ts files.
Tests are manual verification (check file exists, content correct).

WHAT WE ARE BUILDING: Two simple utility functions in separate files:
1. greet.ts — greeting function
2. farewell.ts — farewell function

Each block creates one file with a function and verifies it.
This plan is intentionally minimal — it exists to test the parsePlan → planexecutor pipeline.

FILES LOCATION: /home/laco/cvm/test/test-project/
</mission>

<block id="01-greet">
## TDDAB-1: Create Greeting Function

<intro>
Create a greeting function that takes a name and returns a formatted greeting string.
File to create: /home/laco/cvm/test/test-project/greet.ts

The function signature:
export function greet(name: string): string

It returns "Hello, " + name + "!" format.
</intro>

<red>
- test: greet.ts file exists at /home/laco/cvm/test/test-project/greet.ts
- test: greet function exported and returns "Hello, World!" for input "World"
- test: greet function returns "Hello, !" for empty string input
</red>

### Implementation
```typescript
export function greet(name: string): string {
  return "Hello, " + name + "!";
}
```

<success>
- [ ] greet.ts exists at /home/laco/cvm/test/test-project/greet.ts
- [ ] greet("World") returns "Hello, World!"
- [ ] greet("") returns "Hello, !"
</success>
</block>

<block id="02-farewell">
## TDDAB-2: Create Farewell Function

<intro>
Create a farewell function that takes a name and returns a formatted goodbye string.
File to create: /home/laco/cvm/test/test-project/farewell.ts

The function signature:
export function farewell(name: string): string

It returns "Goodbye, " + name + "!" format.
Depends on block 01 being complete.
</intro>

<red>
- test: farewell.ts file exists at /home/laco/cvm/test/test-project/farewell.ts
- test: farewell function exported and returns "Goodbye, World!" for input "World"
- test: farewell function returns "Goodbye, !" for empty string input
</red>

### Implementation
```typescript
export function farewell(name: string): string {
  return "Goodbye, " + name + "!";
}
```

<success>
- [ ] farewell.ts exists at /home/laco/cvm/test/test-project/farewell.ts
- [ ] farewell("World") returns "Goodbye, World!"
- [ ] farewell("") returns "Goodbye, !"
</success>
</block>

## Execution Order
```
01-greet    → no dependencies
02-farewell → depends on 01
```
