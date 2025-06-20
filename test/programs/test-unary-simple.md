# CVM Simple Unary Test Analysis

## 1. Purpose Summary

This TypeScript program is the minimal test case for the unary minus operator (-) in the CVM. It validates that the basic unary negation works correctly by negating a positive number and storing the result. This serves as the simplest possible verification that unary operators are implemented in the VM.

## 2. Key Functions/Features

### Unary Negation
- Tests unary minus operator
- Negates a positive integer (42)
- Stores result in a variable
- Outputs the negated value

### Minimal Implementation
- Single operator test
- No complex expressions
- Direct variable negation
- Simple output verification

## 3. Code Patterns Used

### Basic Negation Pattern
```typescript
const x = 42;
const y = -x;
```
Simplest form of unary minus operation.

### Direct Output Pattern
```typescript
console.log("y = " + y);
```
Shows result with minimal formatting.

### Minimal Test Case Pattern
Absolute minimum code to test unary minus functionality.

### Positive to Negative Pattern
Uses positive value (42) to clearly show negation to -42.

This minimal test validates:
1. Unary minus operator is recognized
2. Negation produces correct result
3. Result can be stored in variable
4. Basic unary functionality before complex tests
5. Fundamental operator implementation