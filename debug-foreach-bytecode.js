import { compile } from './packages/parser/dist/index.js';

const source = `
function main() {
  console.log("Before loop");
  for (const x of [1, 2, 3]) {
    console.log("Item: " + x);
  }
  console.log("After loop");
}
main();
`;

const result = compile(source);

if (result.success) {
  console.log('Compilation successful!');
  console.log('\nBytecode:');
  result.bytecode.forEach((instr, i) => {
    console.log(`${i.toString().padStart(2, '0')}: ${instr.op}${instr.arg !== undefined ? ' ' + JSON.stringify(instr.arg) : ''}`);
  });
} else {
  console.log('Compilation failed:');
  console.log(result.errors);
}