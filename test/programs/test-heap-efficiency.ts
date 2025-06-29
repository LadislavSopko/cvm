// Test heap efficiency with large arrays and nested objects
function testLargeArray() {
  console.log("=== Testing 10,000 element array ===");
  
  var arr = [];
  
  // Create array with 10k elements
  var i = 0;
  while (i < 10000) {
    arr.push(i);
    i = i + 1;
  }
  
  console.log("Array length: " + arr.length);
  
  // Test serialization through CC
  CC("Array created with " + arr.length + " elements");
  
  // Verify array still works after CC
  console.log("First element: " + arr[0]);
  console.log("Last element: " + arr[9999]);
  console.log("Element at 5000: " + arr[5000]);
  console.log("Element at 7500: " + arr[7500]);
  
  return true;
}

function testDeeplyNested() {
  console.log("");
  console.log("=== Testing deeply nested object (1000 levels) ===");
  
  var obj = {};
  var current = obj;
  
  // Create deeply nested structure
  var i = 0;
  while (i < 1000) {
    current.child = { level: i, data: "level_" + i };
    current = current.child;
    i = i + 1;
  }
  
  console.log("Created nested object with 1000 levels");
  
  // This should not cause stack overflow
  CC("Nested object ready");
  
  // Verify we can still traverse
  var test = obj;
  var depth = 0;
  while (test.child && depth < 10) {
    test = test.child;
    depth = depth + 1;
  }
  console.log("Verified " + depth + " levels still accessible");
  
  // Check specific level
  if (obj.child && obj.child.child && obj.child.child.child && obj.child.child.child.child && obj.child.child.child.child.child) {
    console.log("Level 5 data: " + obj.child.child.child.child.child.data);
  }
  
  return true;
}

function testMixedLargeStructure() {
  console.log("");
  console.log("=== Testing mixed large structure ===");
  
  var data = {
    arrays: [],
    objects: {},
    stats: { count: 0, totalElements: 0 }
  };
  
  // Add 100 arrays with 100 elements each
  var i = 0;
  while (i < 100) {
    var arr = [];
    var j = 0;
    while (j < 100) {
      arr.push({ 
        id: i * 100 + j, 
        value: "item_" + i + "_" + j
      });
      j = j + 1;
    }
    data.arrays.push(arr);
    i = i + 1;
  }
  
  // Add nested objects
  var k = 0;
  while (k < 100) {
    data.objects["key_" + k] = {
      id: k,
      nested: {
        values: [k, k*2, k*3],
        more: { 
          deep: true,
          data: "value_" + k
        }
      }
    };
    k = k + 1;
  }
  
  data.stats.count = data.arrays.length;
  data.stats.totalElements = data.arrays.length * 100;
  
  console.log("Created structure with " + data.stats.totalElements + " array elements");
  console.log("Plus 100 nested objects");
  
  // Measure checkpoint
  CC("Large structure checkpoint");
  
  // Verify data integrity
  console.log("First array first element id: " + data.arrays[0][0].id);
  console.log("Last array last element id: " + data.arrays[99][99].id);
  
  var obj50 = data.objects["key_50"];
  if (obj50 && obj50.nested && obj50.nested.values) {
    console.log("Object key_50 nested values: [" + obj50.nested.values[0] + ", " + obj50.nested.values[1] + ", " + obj50.nested.values[2] + "]");
  }
  
  return true;
}

function main() {
  console.log("Starting heap efficiency tests...");
  
  var test1 = testLargeArray();
  var test2 = testDeeplyNested();  
  var test3 = testMixedLargeStructure();
  
  console.log("");
  console.log("=== Results ===");
  console.log("Large array test: " + (test1 ? "PASSED" : "FAILED"));
  console.log("Deeply nested test: " + (test2 ? "PASSED" : "FAILED"));
  console.log("Mixed structure test: " + (test3 ? "PASSED" : "FAILED"));
  
  var allPassed = test1 && test2 && test3;
  console.log("");
  console.log("All tests passed: " + allPassed);
  
  return allPassed;
}

main();