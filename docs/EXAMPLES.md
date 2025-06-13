# CVM Program Examples

## Phase 1 Examples (Basic)

### Hello World
```javascript
print("Hello World");
```

### Simple CC Call
```javascript
let answer = CC("What is 2 + 2?");
print("The answer is: " + answer);
```

### String Concatenation
```javascript
let name = "Claude";
let greeting = "Hello, " + name + "!";
print(greeting);
```

### Multiple CC Calls
```javascript
let topic = "artificial intelligence";
let definition = CC("Define " + topic + " in one sentence");
let example = CC("Give a simple example of " + topic);
print("Definition: " + definition);
print("Example: " + example);
```

## Phase 2 Examples (Control Flow)

### Simple If Statement
```javascript
let email = "URGENT: Server is down!";
let priority = CC("Is this email urgent? Reply only 'yes' or 'no': " + email);

if (priority == "yes") {
  print("⚠️ URGENT EMAIL DETECTED");
  let response = CC("Write a brief urgent response to: " + email);
  print("Response: " + response);
}
```

### If-Else
```javascript
let message = "Hello there";
let sentiment = CC("Is this message positive or negative? " + message);

if (sentiment == "positive") {
  print("😊 Positive message detected");
} else {
  print("😐 Non-positive message");
}
```

### Nested Conditions
```javascript
let text = "Important: Meeting tomorrow at 3pm";
let hasDate = CC("Does this text mention a date or time? yes/no: " + text);

if (hasDate == "yes") {
  let isUrgent = CC("Is this time-sensitive? yes/no: " + text);
  if (isUrgent == "yes") {
    print("📅 URGENT: Time-sensitive message");
  } else {
    print("📅 Contains date/time information");
  }
}
```

## Phase 3 Examples (Loops)

### While Loop
```javascript
let count = "0";
let target = "3";

while (count != target) {
  print("Count is: " + count);
  count = CC("What comes after " + count + "? Reply with just the number");
}
print("Reached target!");
```

### Process Until Done
```javascript
let text = "Make this text perfect";
let quality = "poor";

while (quality != "excellent") {
  text = CC("Improve this text: " + text);
  quality = CC("Rate this text quality (poor/good/excellent): " + text);
  print("Current quality: " + quality);
}

print("Final text: " + text);
```

## Phase 4 Examples (Functions)

### Simple Function
```javascript
function analyzeEmail(email) {
  let urgency = CC("Is this urgent? (yes/no): " + email);
  let category = CC("Categorize this email (work/personal/spam): " + email);
  return "Urgency: " + urgency + ", Category: " + category;
}

let email1 = "Meeting tomorrow at 9am";
let result = analyzeEmail(email1);
print(result);
```

### Function with Logic
```javascript
function generateResponse(message, tone) {
  let prompt = "Reply to this message in a " + tone + " tone: " + message;
  let response = CC(prompt);
  
  let appropriate = CC("Is this response appropriate? yes/no: " + response);
  if (appropriate != "yes") {
    response = CC("Make this response more appropriate: " + response);
  }
  
  return response;
}

let msg = "I need help with my project";
let reply = generateResponse(msg, "helpful");
print("Reply: " + reply);
```

### Recursive Function (Future)
```javascript
function improveUntilGood(text, attempts) {
  if (attempts == "0") {
    return text;
  }
  
  let quality = CC("Rate 1-10: " + text);
  if (quality == "10") {
    return text;
  }
  
  let improved = CC("Improve this: " + text);
  let newAttempts = CC("What is " + attempts + " minus 1?");
  return improveUntilGood(improved, newAttempts);
}

let draft = "This is my text";
let final = improveUntilGood(draft, "3");
print("Final version: " + final);
```

## Phase 5 Examples (Collections)

### Array Processing
```javascript
let items = ["apple", "banana", "orange"];
let descriptions = [];

foreach (item in items) {
  let desc = CC("Describe " + item + " in 3 words");
  descriptions.push(desc);
}

foreach (desc in descriptions) {
  print(desc);
}
```

### Map/Object Usage
```javascript
let person = {
  "name": "John",
  "occupation": "developer",
  "hobby": "reading"
};

let bio = CC("Write a one-sentence bio using: " + 
  "name=" + person["name"] + 
  ", job=" + person["occupation"] + 
  ", hobby=" + person["hobby"]);

print(bio);
```

## Complete Program Examples

### Email Processor
```javascript
function processEmail(email) {
  // Analyze email
  let urgency = CC("Is this urgent? (yes/no): " + email);
  let sentiment = CC("What's the sentiment? (positive/negative/neutral): " + email);
  
  // Generate response based on analysis
  let responseType = "standard";
  if (urgency == "yes") {
    responseType = "urgent";
  }
  if (sentiment == "negative") {
    responseType = "empathetic";
  }
  
  let response = CC("Write a " + responseType + " response to: " + email);
  
  // Validate response
  let appropriate = CC("Is this response professional? yes/no: " + response);
  if (appropriate != "yes") {
    response = CC("Make this more professional: " + response);
  }
  
  return response;
}

// Main program
let email = "I'm very frustrated with the service delay!";
print("Processing email: " + email);

let response = processEmail(email);
print("Generated response: " + response);

let summary = CC("Summarize this interaction in one line");
print("Summary: " + summary);
```

### Document Analyzer
```javascript
function analyzeSection(section, criteria) {
  let score = CC("Score this text on " + criteria + " (1-10): " + section);
  let feedback = CC("Give specific feedback on " + criteria + ": " + section);
  return "Score: " + score + "\nFeedback: " + feedback;
}

function improveSection(section, feedback) {
  let prompt = "Improve this text based on feedback.\nText: " + section + "\nFeedback: " + feedback;
  return CC(prompt);
}

// Main analysis
let document = "Our product revolutionizes workflow management through AI.";

print("Analyzing document...");
let clarity = analyzeSection(document, "clarity");
let impact = analyzeSection(document, "impact");

print("Clarity Analysis:\n" + clarity);
print("Impact Analysis:\n" + impact);

// Improve if needed
let clarityScore = CC("Extract just the number from: " + clarity);
if (clarityScore != "10") {
  document = improveSection(document, clarity);
  print("Improved version: " + document);
}
```

## Test Cases for Each Phase

### Phase 1 Test
```javascript
// Tests: variable assignment, CC call, string concat, print
let name = "Test";
let result = CC("Say hello to " + name);
print(result);
```

### Phase 2 Test  
```javascript
// Tests: comparison, if/else, CC in conditional
let num = CC("Pick a number 1-10");
if (num == "5") {
  print("You picked 5!");
} else {
  print("You picked " + num);
}
```

### Phase 3 Test
```javascript
// Tests: while loop with CC calls
let word = "cat";
while (word != "dog") {
  print("Current word: " + word);
  word = CC("Change one letter in '" + word + "' to get closer to 'dog'");
}
print("Reached dog!");
```

### Phase 4 Test
```javascript
// Tests: function definition, call, return, parameters
function double(text) {
  return text + " " + text;
}

let input = "hello";
let doubled = double(input);
print(doubled);  // Should print: hello hello
```

### Phase 5 Test
```javascript
// Tests: array creation, iteration, modification
let words = ["hello", "world"];
let translated = [];

foreach (word in words) {
  let french = CC("Translate to French: " + word);
  translated.push(french);
}

print("Translations: " + translated[0] + ", " + translated[1]);
```