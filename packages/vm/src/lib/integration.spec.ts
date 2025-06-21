import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoDBAdapter } from '@cvm/storage';
import { compile } from '@cvm/parser';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';

describe('Parser-VM-MongoDB Integration', () => {
  let adapter: MongoDBAdapter;
  let vm: VM;

  beforeAll(async () => {
    adapter = new MongoDBAdapter('mongodb://root:example@localhost:27017/cvm_integration_test?authSource=admin');
    await adapter.connect();
    vm = new VM();
  });

  afterAll(async () => {
    await adapter.disconnect();
  });

  describe('full integration flow', () => {
    it('should parse, store, retrieve and execute a simple program', async () => {
      // Step 1: Parse a program
      const source = `
        function main() {
          const message = "Hello World";
          console.log(message);
        }
        main();
      `;

      const parseResult = compile(source);
      expect(parseResult.success).toBe(true);
      expect(parseResult.errors).toHaveLength(0);

      // Step 2: Store program in MongoDB
      const program = {
        id: 'integration-test-1',
        name: 'Integration Test Program',
        source,
        bytecode: parseResult.bytecode,
        created: new Date()
      };

      await adapter.saveProgram(program);

      // Step 3: Retrieve program from MongoDB
      const retrieved = await adapter.getProgram('integration-test-1');
      expect(retrieved).toBeDefined();
      // MongoDB converts undefined to null, so we need to handle that
      const normalizedBytecode = retrieved!.bytecode.map((instr: any) => ({
        ...instr,
        arg: instr.arg === null ? undefined : instr.arg
      }));
      expect(normalizedBytecode).toEqual(parseResult.bytecode);

      // Step 4: Execute the bytecode in VM
      const state = vm.execute(retrieved!.bytecode);
      expect(state.status).toBe('complete');
      expect(state.output).toContain('Hello World');
      expect(state.error).toBeUndefined();
    });

    it('should handle program with cognitive call (CC)', async () => {
      // Step 1: Parse a program with CC
      const source = `
        function main() {
          const name = "User";
          CC("What's your favorite color?");
          console.log("Nice to meet you, " + name);
        }
        main();
      `;

      const parseResult = compile(source);
      expect(parseResult.success).toBe(true);

      // Step 2: Store program
      const program = {
        id: 'integration-test-2',
        name: 'CC Test Program',
        source,
        bytecode: parseResult.bytecode,
        created: new Date()
      };

      await adapter.saveProgram(program);

      // Step 3: Create execution
      const execution: any = {
        id: 'exec-integration-1',
        programId: 'integration-test-2',
        state: 'ready',
        pc: 0,
        stack: [],
        variables: {},
        output: [],
        created: new Date()
      };

      await adapter.saveExecution(execution);

      // Step 4: Retrieve and execute
      const savedProgram = await adapter.getProgram('integration-test-2');
      expect(savedProgram).toBeDefined();

      const state = vm.execute(savedProgram!.bytecode);
      expect(state.status).toBe('waiting_cc');
      expect(state.ccPrompt).toBe("What's your favorite color?");

      // Step 5: Save execution state
      execution.pc = state.pc;
      execution.stack = state.stack;
      execution.variables = Object.fromEntries(state.variables);
      execution.output = state.output;
      execution.state = 'running';
      await adapter.saveExecution(execution);

      // Step 6: Resume with CC response
      const resumedState = vm.resume(state, "Blue", savedProgram!.bytecode);
      expect(resumedState.status).toBe('complete');
      expect(resumedState.output).toContain('Nice to meet you, User');
    });

  });

  describe('bytecode format validation', () => {
    it('should store Instructions with correct OpCode enum values', async () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: "Hello" },
        { op: OpCode.PUSH, arg: " World" },
        { op: OpCode.CONCAT },
        { op: OpCode.PRINT },
        { op: OpCode.HALT }
      ];

      const program = {
        id: 'bytecode-test-1',
        name: 'Bytecode Format Test',
        source: '// test',
        bytecode,
        created: new Date()
      };

      await adapter.saveProgram(program);
      const retrieved = await adapter.getProgram('bytecode-test-1');

      expect(retrieved?.bytecode).toEqual(bytecode);
      expect(retrieved?.bytecode[0].op).toBe(OpCode.PUSH);
      expect(retrieved?.bytecode[0].arg).toBe("Hello");
    });
  });

  describe('object support integration', () => {
    it('should compile and execute object literal creation', async () => {
      const source = `
        function main() {
          const person = {
            name: "Alice",
            age: 30,
            city: "New York"
          };
          console.log(JSON.stringify(person));
          return person;
        }
        main();
      `;

      const parseResult = compile(source);
      expect(parseResult.success).toBe(true);
      
      const state = vm.execute(parseResult.bytecode);
      expect(state.status).toBe('complete');
      expect(state.output[0]).toBe('{"name":"Alice","age":30,"city":"New York"}');
    });

    it('should handle property access and assignment', async () => {
      const source = `
        function main() {
          const obj = { x: 10 };
          obj.y = 20;
          obj["z"] = obj.x + obj.y;
          console.log("x: " + obj.x);
          console.log("y: " + obj.y);
          console.log("z: " + obj.z);
          return obj;
        }
        main();
      `;

      const parseResult = compile(source);
      expect(parseResult.success).toBe(true);
      
      const state = vm.execute(parseResult.bytecode);
      expect(state.status).toBe('complete');
      expect(state.output).toEqual([
        'x: 10',
        'y: 20',
        'z: 30'
      ]);
    });

    it('should handle nested objects', async () => {
      const source = `
        function main() {
          const company = {
            name: "Tech Corp",
            address: {
              street: "123 Main St",
              city: "San Francisco",
              zip: "94105"
            },
            employees: 100
          };
          console.log(company.name);
          console.log(company.address.city);
          return company;
        }
        main();
      `;

      const parseResult = compile(source);
      expect(parseResult.success).toBe(true);
      
      const state = vm.execute(parseResult.bytecode);
      expect(state.status).toBe('complete');
      expect(state.output).toEqual([
        'Tech Corp',
        'San Francisco'
      ]);
    });

    it('should handle JSON.parse with objects', async () => {
      const source = `
        function main() {
          const json = '{"name": "Bob", "scores": [95, 87, 92]}';
          const data = JSON.parse(json);
          console.log("Name: " + data.name);
          console.log("First score: " + data.scores[0]);
          return data;
        }
        main();
      `;

      const parseResult = compile(source);
      expect(parseResult.success).toBe(true);
      
      const state = vm.execute(parseResult.bytecode);
      expect(state.status).toBe('complete');
      expect(state.output).toEqual([
        'Name: Bob',
        'First score: 95'
      ]);
    });

    it('should handle object creation in CC tasks', async () => {
      const source = `
        function main() {
          const task = CC("What is your name?");
          const user = {
            name: task,
            timestamp: "2024-01-01"
          };
          console.log("Created user: " + JSON.stringify(user));
          return user;
        }
        main();
      `;

      const parseResult = compile(source);
      expect(parseResult.success).toBe(true);
      
      const state = vm.execute(parseResult.bytecode);
      expect(state.status).toBe('waiting_cc');
      expect(state.ccPrompt).toBe("What is your name?");
      
      const resumedState = vm.resume(state, "Charlie", parseResult.bytecode);
      expect(resumedState.status).toBe('complete');
      expect(resumedState.output[0]).toBe('Created user: {"name":"Charlie","timestamp":"2024-01-01"}');
    });
  });
});