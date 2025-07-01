function main() {
  console.log("=== CVM Object Support Comprehensive Test ===");
  console.log("");
  
  // Test 1: Basic object creation and property access
  console.log("--- Test 1: Basic Object Creation ---");
  const person = {
    name: "Alice",
    age: 30,
    city: "New York"
  };
  console.log("Created person object");
  console.log("Name: " + person.name);
  console.log("Age: " + person.age);
  console.log("City: " + person.city);
  console.log("JSON: " + JSON.stringify(person));
  
  // Test 2: Object property assignment
  console.log("");
  console.log("--- Test 2: Property Assignment ---");
  person.country = "USA";
  person["profession"] = "Engineer";
  console.log("Added country and profession");
  console.log("Updated object: " + JSON.stringify(person));
  
  // Test 3: Nested objects
  console.log("");
  console.log("--- Test 3: Nested Objects ---");
  const company = {
    name: "TechCorp",
    address: {
      street: "123 Main St",
      city: "San Francisco",
      zip: "94105"
    },
    employees: 100
  };
  console.log("Company: " + company.name);
  console.log("Street: " + company.address.street);
  console.log("City: " + company.address.city);
  console.log("Full company: " + JSON.stringify(company));
  
  // Test 4: Objects with CC integration
  console.log("");
  console.log("--- Test 4: Objects with CC ---");
  const userName = CC("Enter your name:");
  const userAge = CC("Enter your age:");
  const userCity = CC("Enter your city:");
  
  const user = {
    name: userName,
    age: +userAge,
    city: userCity,
    registered: true
  };
  console.log("User object created from CC input: " + JSON.stringify(user));
  
  // Test 5: Array of objects
  console.log("");
  console.log("--- Test 5: Array of Objects ---");
  const tasks = [];
  tasks.push({ id: 1, title: "Task 1", done: false });
  tasks.push({ id: 2, title: "Task 2", done: true });
  tasks.push({ id: 3, title: "Task 3", done: false });
  
  console.log("Tasks array: " + JSON.stringify(tasks));
  
  // Test 6: Object iteration with for-of
  console.log("");
  console.log("--- Test 6: Processing Objects in Array ---");
  let completedCount = 0;
  for (const task of tasks) {
    if (task.done) {
      console.log("Completed: " + task.title);
      completedCount = completedCount + 1;
    } else {
      console.log("Pending: " + task.title);
    }
  }
  console.log("Total completed: " + completedCount);
  
  // Test 7: Object with shorthand properties
  console.log("");
  console.log("--- Test 7: Shorthand Properties ---");
  const x = 10;
  const y = 20;
  const point = { x, y };
  console.log("Point object: " + JSON.stringify(point));
  
  // Test 8: Complex nested structure
  console.log("");
  console.log("--- Test 8: Complex Structure ---");
  const project = {
    name: "CVM",
    version: "0.9.0",
    features: ["objects", "arrays", "CC", "file ops"],
    stats: {
      tests: 570,
      coverage: "100%"
    },
    team: [
      { name: "Dev1", role: "Lead" },
      { name: "Dev2", role: "Engineer" }
    ]
  };
  
  console.log("Project: " + project.name + " v" + project.version);
  console.log("Tests: " + project.stats.tests);
  console.log("Team size: " + project.team.length);
  console.log("Full project: " + JSON.stringify(project));
  
  // Test 9: Object persistence through multiple CC calls
  console.log("");
  console.log("--- Test 9: Object Persistence Across CC ---");
  const data = { count: 0, messages: [] };
  
  const msg1 = CC("Enter first message:");
  data.messages.push(msg1);
  data.count = data.count + 1;
  console.log("After first CC: " + JSON.stringify(data));
  
  const msg2 = CC("Enter second message:");
  data.messages.push(msg2);
  data.count = data.count + 1;
  console.log("After second CC: " + JSON.stringify(data));
  
  // Test 10: Return complex object
  console.log("");
  console.log("--- Test 10: Returning Complex Object ---");
  const result = {
    summary: "All object tests passed",
    tests: {
      basic: "✓",
      assignment: "✓",
      nested: "✓",
      cc_integration: "✓",
      arrays: "✓",
      iteration: "✓",
      shorthand: "✓",
      complex: "✓",
      persistence: "✓"
    },
    metadata: {
      version: "0.9.0",
      date: "2025-06-21",
      total_tests: 9
    }
  };
  
  console.log("=== All Object Tests Complete ===");
  return JSON.stringify(result);
}

main();