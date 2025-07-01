// Test undefined value type

function main() {
  // Test 1: Basic undefined
  const x = undefined;
  console.log("x is: " + x);
  console.log("typeof x: " + typeof x);
  
  // Test 2: undefined == null
  const isEqualNull = x == null;
  console.log("undefined == null: " + isEqualNull);
  
  // Test 3: undefined === null
  const isStrictEqualNull = x === null;
  console.log("undefined === null: " + isStrictEqualNull);
  
  // Test 4: undefined in logical operations
  const result = undefined || "default";
  console.log("undefined || 'default': " + result);
  
  // Test 5: !undefined
  const notUndefined = !undefined;
  console.log("!undefined: " + notUndefined);
  
  // Test 6: undefined + 5
  const sum = undefined + 5;
  console.log("undefined + 5: " + sum);
  
  // Test 7: return undefined
  return undefined;
}

main();