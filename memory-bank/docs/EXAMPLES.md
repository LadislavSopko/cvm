# CVM Program Examples

## Working Examples (Phase 1 Complete)

### Hello World
```javascript
function main() {
  console.log("Hello World");
}
main();
```

### Simple CC Call
```javascript
function main() {
  let answer = CC("What is 2 + 2?");
  console.log("The answer is: " + answer);
}
main();
```

### Arrays and JSON
```javascript
function main() {
  let prompt = "List 3 programming languages as a JSON array";
  let response = CC(prompt);
  let languages = JSON.parse(response);
  
  console.log("Found " + languages.length + " languages");
  console.log("First language: " + languages[0]);
}
main();
```

### Multiple CC Calls with Arrays
```javascript
function main() {
  let topics = ["AI", "quantum computing", "blockchain"];
  let definitions = [];
  
  definitions.push(CC("Define " + topics[0] + " in one sentence"));
  definitions.push(CC("Define " + topics[1] + " in one sentence"));
  definitions.push(CC("Define " + topics[2] + " in one sentence"));
  
  console.log(topics[0] + ": " + definitions[0]);
  console.log(topics[1] + ": " + definitions[1]);
  console.log(topics[2] + ": " + definitions[2]);
}
main();
```

## Coming Soon (Phase 2 - Branching)

### If Statement (Not Yet Implemented)
```javascript
function main() {
  let email = "URGENT: Server is down!";
  let priority = CC("Is this urgent? Reply yes or no: " + email);
  
  if (priority == "yes") {
    console.log("⚠️ URGENT EMAIL DETECTED");
    let response = CC("Write urgent response to: " + email);
    console.log("Response: " + response);
  }
}
main();
```

### While Loop (Not Yet Implemented)
```javascript
function main() {
  let count = 0;
  while (count < 3) {
    console.log("Count is: " + count);
    count = count + 1;
  }
}
main();
```

## Test Programs
Located in `/test/integration/`:
- `simple-test.ts` - Basic CC functionality
- `test-output.ts` - Console.log testing
- `array-demo.ts` - Array operations