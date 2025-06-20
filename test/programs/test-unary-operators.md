# CVM Unary Operators Test Analysis

## 1. Purpose Summary

This TypeScript program comprehensively tests unary operators in the CVM including unary minus (-), unary plus (+), pre-increment (++x), post-increment (x++), pre-decrement (--x), and post-decrement (x--). It validates type conversion behavior, operator precedence, and the critical difference between pre and post increment/decrement operations. The test includes practical applications in loops and user input processing.

## 2. Key Functions/Features

### Unary Operators Tested

#### Unary Minus (-)
- Negates numeric values
- Works with expressions
- Preserves type as number

#### Unary Plus (+)
- Type conversion to number
- Converts strings, booleans, and empty strings
- Useful for input validation

#### Increment Operators
- **Pre-increment (++x)**: Increments then returns
- **Post-increment (x++)**: Returns then increments
- Used in loops and expressions

#### Decrement Operators
- **Pre-decrement (--x)**: Decrements then returns
- **Post-decrement (x--)**: Returns then decrements
- Common in countdown patterns

### Advanced Features
- Type conversion demonstrations
- Pre vs post operator differences
- Integration with loops
- User input conversion
- Complex expressions

## 3. Code Patterns Used

### Unary Minus Pattern
```typescript
const positive = 42;
const negative = -positive;
```
Simple negation of variables.

### Expression Negation Pattern
```typescript
const expr = -(10 + 5);  // -15
```
Negates entire expression result.

### Type Conversion Pattern
```typescript
const str = "123";
const num = +str;  // 123 as number
```
Converts string to number using unary plus.

### Boolean to Number Pattern
```typescript
const boolAsNum = +true;  // 1
const emptyAsNum = +"";   // 0
```
Shows JavaScript-style type coercion.

### Pre-increment Pattern
```typescript
let i = 5;
const j = ++i;  // j = 6, i = 6
```
Increment before use - both values updated.

### Post-increment Pattern
```typescript
let m = 5;
const n = m++;  // n = 5, m = 6
```
Use original value, then increment.

### Loop Increment Pattern
```typescript
while (count < 3) {
    console.log("count: " + count);
    count++;
}
```
Classic loop counter pattern.

### Expression Conversion Pattern
```typescript
const result2 = +(x > 3);  // Convert boolean to 1 or 0
```
Converts comparison result to number.

### User Input Conversion Pattern
```typescript
const userInput = CC("Enter a number:");
const userNumber = +userInput;
```
Practical pattern for ensuring numeric input.

### Pre vs Post Comparison Pattern
```typescript
const preResult = 10 + ++a;   // Increment first
const postResult = 10 + b++;  // Use original value
```
Demonstrates critical timing difference.

### Countdown Pattern
```typescript
while (countdown > 0) {
    console.log("T-" + countdown);
    countdown--;
}
```
Common countdown using post-decrement.

### Type Verification Pattern
```typescript
console.log("Type: " + typeof userNumber);
```
Confirms type conversion success.

This comprehensive test ensures:
1. All unary operators work correctly
2. Type conversion behaves as expected
3. Pre/post increment/decrement timing is correct
4. Operators integrate properly in expressions
5. Common patterns can be implemented