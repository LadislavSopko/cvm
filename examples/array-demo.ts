// Example: Using arrays in CVM
function main(): void {
  // Create arrays
  const colors = ["red", "green", "blue"];
  const numbers = [1, 2, 3, 4, 5];
  
  // Access array elements
  console.log("First color: " + colors[0]);
  console.log("Third number: " + numbers[2]);
  
  // Get array length
  console.log("Number of colors: " + colors.length);
  console.log("Number of numbers: " + numbers.length);
  
  // Add elements to array
  colors.push("yellow");
  console.log("After push, colors: " + colors.length);
  
  // Use CC to get JSON data and parse it
  const prompt = "Please provide a JSON array of 3 programming languages";
  const response = CC(prompt);
  const languages = JSON.parse(response);
  
  console.log("Languages count: " + languages.length);
  console.log("First language: " + languages[0]);
  
  // Check types
  console.log("Type of colors: " + typeof colors);
  console.log("Type of first color: " + typeof colors[0]);
  console.log("Type of numbers length: " + typeof numbers.length);
}

main();