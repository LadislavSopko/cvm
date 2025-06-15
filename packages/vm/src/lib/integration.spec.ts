import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoDBAdapter } from '@cvm/mongodb';
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
      expect(retrieved?.bytecode).toEqual(parseResult.bytecode);

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
});