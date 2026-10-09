export interface ClientArgs {
  programPath: string;
  responses: string[];
  expectError?: string;
}

export interface OutcomeInput {
  loadError?: string;
  startError?: string;
  finalText: string;
  outputFound: boolean;
  expectError?: string;
}

export interface Outcome {
  exitCode: 0 | 1;
  reason: string;
}

const EXPECT_ERROR_FLAG = '--expect-error=';

export function parseClientArgs(argv: string[]): ClientArgs {
  let expectError: string | undefined;
  const rest: string[] = [];
  for (const arg of argv) {
    if (arg.startsWith(EXPECT_ERROR_FLAG)) {
      expectError = arg.slice(EXPECT_ERROR_FLAG.length);
    } else {
      rest.push(arg);
    }
  }
  return { programPath: rest[0], responses: rest.slice(1), expectError };
}

export function decideOutcome(input: OutcomeInput): Outcome {
  if (input.loadError) {
    return { exitCode: 1, reason: `load failed: ${input.loadError}` };
  }
  if (input.startError) {
    return { exitCode: 1, reason: `start failed: ${input.startError}` };
  }
  if (input.finalText.startsWith('Error:')) {
    if (input.expectError && input.finalText.includes(input.expectError)) {
      return { exitCode: 0, reason: 'expected error' };
    }
    return { exitCode: 1, reason: `execution error: ${input.finalText}` };
  }
  if (input.expectError) {
    return { exitCode: 1, reason: `expected error not raised: ${input.expectError}` };
  }
  return { exitCode: 0, reason: input.outputFound ? 'completed' : 'completed (no output)' };
}
