function main() {
  const obj = { x: 5 };
  console.log("Created object");
  console.log("x = " + obj.x);
  const json = JSON.stringify(obj);
  console.log("JSON: " + json);
  return json;
}

main();