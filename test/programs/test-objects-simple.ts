function main() {
  console.log("Creating simple object...");
  
  const person = {
    name: "Alice",
    age: 30
  };
  
  console.log("Object created");
  console.log("Name: " + person.name);
  console.log("Age: " + person.age);
  console.log("Full object: " + JSON.stringify(person));
  
  // Test property assignment
  person.city = "New York";
  console.log("After adding city: " + JSON.stringify(person));
  
  // Test bracket notation
  person["country"] = "USA";
  console.log("After adding country: " + JSON.stringify(person));
  
  return JSON.stringify(person);
}

main();