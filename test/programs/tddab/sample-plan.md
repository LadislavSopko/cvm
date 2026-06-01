# TDDAB Plan: Sample Test Plan
**Date:** 2026-05-25

<mission>
Test project for E2E validation. TypeScript project with Vitest.
Build: npx nx test sample. Files in src/.
</mission>

<block id="01-greeting">
## TDDAB-1: Add Greeting Function

<intro>
Create a greeting function that returns a formatted greeting string.
File: src/greeting.ts + src/greeting.spec.ts
</intro>

<red>
- test: greet("World") returns "Hello, World!"
- test: greet("") returns "Hello, !"
</red>

### Implementation
export function greet(name: string): string { return "Hello, " + name + "!"; }

<success>
- [ ] greet function exists and returns correct format
- [ ] all tests pass
</success>
</block>

<block id="02-farewell">
## TDDAB-2: Add Farewell Function

<intro>
Create a farewell function that returns a formatted goodbye string.
File: src/farewell.ts + src/farewell.spec.ts
</intro>

<red>
- test: farewell("World") returns "Goodbye, World!"
- test: farewell("") returns "Goodbye, !"
</red>

### Implementation
export function farewell(name: string): string { return "Goodbye, " + name + "!"; }

<success>
- [ ] farewell function exists and returns correct format
- [ ] all tests pass
</success>
</block>

<block id="03-summary">
## TDDAB-3: Add Summary Function

<intro>
Create a summary function that combines greeting and farewell.
File: src/summary.ts + src/summary.spec.ts
Depends on blocks 01 and 02.
</intro>

<red>
- test: summarize("World") returns "Hello, World! Goodbye, World!"
- test: summarize("") returns "Hello, ! Goodbye, !"
</red>

### Implementation
import { greet } from './greeting';
import { farewell } from './farewell';
export function summarize(name: string): string { return greet(name) + " " + farewell(name); }

<success>
- [ ] summarize function exists and combines greet + farewell
- [ ] all tests pass
</success>
</block>

## Execution Order
```
01-greeting → no dependencies
02-farewell → no dependencies
03-summary  → depends on 01, 02
```
