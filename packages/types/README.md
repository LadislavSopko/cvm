# @cvm/types

Shared type definitions and value system for the CVM ecosystem. This package defines the core data structures used throughout CVM.

## Overview

This package provides:
- **CVMValue**: The type system for all values in the VM
- **Type Guards**: Runtime type checking functions
- **Core Interfaces**: Program and Execution state definitions

## Value System

CVM uses a tagged union type system to represent all values:

```typescript
type CVMValue = 
  | string 
  | number 
  | boolean 
  | null
  | CVMUndefined
  | CVMArray
  | CVMObject
  | CVMArrayRef
  | CVMObjectRef
```

### Primitive Values
- **string**, **number**, **boolean**, **null**: Stored directly
- **undefined**: Represented as `{ type: 'undefined' }` for serialization

### Reference Types
- **CVMArray**: `{ type: 'array', elements: CVMValue[] }`
- **CVMObject**: `{ type: 'object', properties: Record<string, CVMValue> }`
- **CVMArrayRef/CVMObjectRef**: References to heap-allocated objects

## Core Interfaces

### Program
```typescript
interface Program {
  id: string;
  name: string;
  source: string;
  bytecode: Instruction[];
  created: Date;
  updated?: Date;
}
```

### Execution
```typescript
interface Execution {
  id: string;
  programId: string;
  state: 'READY' | 'RUNNING' | 'AWAITING_COGNITIVE_RESULT' | 'COMPLETED' | 'ERROR';
  pc: number;                              // Program counter
  stack: CVMValue[];                       // Execution stack
  variables: Record<string, CVMValue>;     // Variable storage
  heap?: {                                 // Reference type storage
    objects: Record<number, { type: 'array' | 'object'; data: CVMValue }>;
    nextId: number;
  };
  ccPrompt?: string;                       // Current CC() prompt
  returnValue?: CVMValue;                  // Result from main()
}
```

## Type Guards

The package provides type guards for safe runtime type checking:

```typescript
import { isCVMString, isCVMArray, cvmToString } from '@cvm/types';

function processValue(value: CVMValue) {
  if (isCVMString(value)) {
    console.log("String:", value.toUpperCase());
  } else if (isCVMArray(value)) {
    console.log("Array length:", value.elements.length);
  } else {
    console.log("Other:", cvmToString(value));
  }
}
```

## Key Design Decisions

1. **Tagged Unions**: All non-primitive values use explicit type tags for safe serialization
2. **Reference Types**: Arrays/objects can be stored by reference in the heap
3. **Undefined Handling**: Special object representation allows JSON serialization
4. **Type Guards**: Comprehensive runtime type checking for all value types

## Usage Example

```typescript
import { CVMValue, isCVMNumber, Program, Execution } from '@cvm/types';

// Working with values
const values: CVMValue[] = [
  42,
  "hello",
  { type: 'array', elements: [1, 2, 3] },
  { type: 'undefined' },
  null
];

// Type checking
values.forEach(val => {
  if (isCVMNumber(val)) {
    console.log("Number:", val * 2);
  }
});

// Creating execution state
const execution: Execution = {
  id: 'exec-123',
  programId: 'prog-456',
  state: 'RUNNING',
  pc: 0,
  stack: [],
  variables: {},
  created: new Date()
};
```

## Testing

Run tests:
```bash
npx nx test types
```

## Dependencies

- **mongodb**: Type definitions for MongoDB storage (types only)