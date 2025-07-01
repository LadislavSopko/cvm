function main() {
  console.log("Starting comparison operators test...");
  
  // Test basic numeric comparisons
  const a = 10;
  const b = 20;
  const c = 10;
  
  const equal1 = a == c;
  console.log("10 == 10 is: " + equal1);
  
  const notEqual1 = a != b;
  console.log("10 != 20 is: " + notEqual1);
  
  const less1 = a < b;
  console.log("10 < 20 is: " + less1);
  
  const greater1 = b > a;
  console.log("20 > 10 is: " + greater1);
  
  // Test string comparisons
  const str1 = "hello";
  const str2 = "world";
  const str3 = "hello";
  
  const strEqual = str1 == str3;
  console.log("'hello' == 'hello' is: " + strEqual);
  
  const strNotEqual = str1 != str2;
  console.log("'hello' != 'world' is: " + strNotEqual);
  
  // Test type coercion (JavaScript-like ==)
  const num5 = 5;
  const str5 = "5";
  
  const coercionEqual = num5 == str5;
  console.log("5 == '5' is: " + coercionEqual);
  
  // Test with CC input
  const userNum = CC("Enter a number between 1 and 10:");
  console.log("You entered: " + userNum);
  
  const isLessThan5 = userNum < 5;
  console.log("Your number < 5 is: " + isLessThan5);
  
  const isGreaterThan5 = userNum > 5;
  console.log("Your number > 5 is: " + isGreaterThan5);
  
  const isEqual5 = userNum == 5;
  console.log("Your number == 5 is: " + isEqual5);
  
  // Test arithmetic with comparisons
  const x = 15;
  const y = 10;
  const sum = x + y;
  const diff = x - y;
  
  console.log("15 + 10 = " + sum);
  console.log("15 - 10 = " + diff);
  
  const sumGreater20 = sum > 20;
  console.log("(15 + 10) > 20 is: " + sumGreater20);
  
  const diffLess10 = diff < 10;
  console.log("(15 - 10) < 10 is: " + diffLess10);
  
  // Test nested/complex comparisons
  const result1 = (10 + 5) > (20 - 10);
  console.log("(10 + 5) > (20 - 10) is: " + result1);
  
  const result2 = (a == c) == true;
  console.log("(10 == 10) == true is: " + result2);
  
  // Test with arrays
  const arr = [1, 2, 3];
  const arrLen = arr.length;
  const lenEquals3 = arrLen == 3;
  console.log("Array length == 3 is: " + lenEquals3);
  
  arr.push(4);
  const newLen = arr.length;
  const lenGreater3 = newLen > 3;
  console.log("After push, length > 3 is: " + lenGreater3);
  
  console.log("Comparison operators test complete!");
}
main();