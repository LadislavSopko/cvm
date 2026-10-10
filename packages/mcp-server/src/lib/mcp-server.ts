// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025-2026 Ladislav Sopko

import { McpServer, type CallToolResult, type Transport } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod';
import { VMManager, SandboxedFileSystem } from '@cvm/vm';
import { FileStorageAdapter } from '@cvm/storage';
import { readFile, writeFile, mkdir, rename } from 'fs/promises';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { parseTddabPlan, parseFilesTag } from './tddab-parser.js';
import { DeleteConfirmations, DELETE_TOKEN_TTL_SECONDS } from './delete-confirmation.js';

function deducePlanType(blocks: { isAction: boolean }[]): 'tddab' | 'step' {
  const hasAction = blocks.some(b => b.isAction);
  const hasTest = blocks.some(b => !b.isAction);
  if (hasAction && !hasTest) return 'step';
  return 'tddab';
}

function toRedKey(test: string): string {
  return test.replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/ +/g, '_').toLowerCase();
}

function findDuplicateRedKey(redTests: string[]): string | undefined {
  const seen = new Set<string>();
  for (const t of redTests) {
    const key = toRedKey(t);
    if (seen.has(key)) return key;
    seen.add(key);
  }
  return undefined;
}

const BUILTIN_PROGRAMS: Record<string, string> = {
  '@planexecutor': 'planexecutor.ts',
};

const SUBMIT_ACK = 'OK. Call getTask for the next task.';
const NO_CURRENT_ERROR: CallToolResult = { content: [{ type: 'text', text: 'Error: No current execution set' }], isError: true };
const NO_CURRENT_HINT: CallToolResult = { content: [{ type: 'text', text: 'No current execution set. Use list_executions to see available executions.' }] };
const SUBMIT_REMINDER = '\n\n--- When done, call submitTask with your result as requested.';

/**
 * MCP Server - A thin interface layer for the CVM
 * All execution logic is handled by VMManager
 */
export interface CVMServerOptions {
  dataDir?: string;
  sandboxPaths?: string[];
  maxInstructions?: number;
}

export class CVMMcpServer {
  private server: McpServer;
  private transport: Transport | null = null;
  private vmManager: VMManager;
  private version: string;
  private deleteConfirmations = new DeleteConfirmations();

  private dataDir: string;

  constructor(version: string = '0.0.1', options: CVMServerOptions = {}) {
    this.version = version;
    this.dataDir = options.dataDir ?? process.env['CVM_DATA_DIR'] ?? '.cvm';
    this.vmManager = new VMManager(new FileStorageAdapter(this.dataDir), new SandboxedFileSystem(options.sandboxPaths), { maxInstructions: options.maxInstructions });
    this.server = new McpServer({
      name: 'cvm-server',
      version: this.version
    });

    this.setupTools();
  }

  getName(): string {
    return 'cvm-server';
  }

  getVersion(): string {
    return this.version;
  }

  private withErrors<A>(fn: (args: A) => Promise<CallToolResult>): (args: A) => Promise<CallToolResult> {
    return async (args: A) => {
      try {
        return await fn(args);
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true
        };
      }
    };
  }

  private async resolveExecutionId(executionId: string | undefined, missing: CallToolResult = NO_CURRENT_ERROR): Promise<string | CallToolResult> {
    return executionId || (await this.vmManager.getCurrentExecutionId()) || missing;
  }

  private setupTools(): void {
    this.server.registerTool(
      'server_info',
      {
        description: 'Return the server name, version and the number of loaded programs and executions.',
        inputSchema: z.object({})
      },
      this.withErrors(async () => {
        const programs = await this.vmManager.listPrograms();
        const executions = await this.vmManager.listExecutions();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              name: 'cvm-server',
              version: this.version,
              programs: programs.length,
              executions: executions.length,
            }, null, 2)
          }]
        };
      })
    );

    this.server.registerTool(
      'load',
      {
        description: 'Compile a CVM program from source and store it under programId.',
        inputSchema: z.object({
          programId: z.string(),
          source: z.string()
        })
      },
      this.withErrors(async ({ programId, source }) => {
        await this.vmManager.loadProgram(programId, source);
        return {
          content: [{ type: 'text', text: `Program loaded successfully: ${programId}` }]
        };
      })
    );

    this.server.registerTool(
      'loadFile',
      {
        description: 'Compile a CVM program from a file (or the built-in @planexecutor) and store it under programId.',
        inputSchema: z.object({
          programId: z.string(),
          filePath: z.string()
        })
      },
      this.withErrors(async ({ programId, filePath }) => {
        try {
          let resolvedPath: string;
          const builtinFile = BUILTIN_PROGRAMS[filePath];
          if (builtinFile) {
            const serverDir = dirname(fileURLToPath(import.meta.url));
            resolvedPath = join(serverDir, 'programs', builtinFile);
          } else {
            resolvedPath = resolve(filePath);
          }

          const source = await readFile(resolvedPath, 'utf-8');
          
          // Load the program using existing VMManager method
          await this.vmManager.loadProgram(programId, source);
          
          return {
            content: [{ type: 'text', text: `Program loaded successfully from ${filePath}: ${programId}` }]
          };
        } catch (error) {
          const code = (error as NodeJS.ErrnoException).code;
          if (code === 'ENOENT') {
            return { content: [{ type: 'text', text: `Error: File not found: ${filePath}` }], isError: true };
          }
          if (code === 'EACCES') {
            return { content: [{ type: 'text', text: `Error: Permission denied: ${filePath}` }], isError: true };
          }
          throw error;
        }
      })
    );

    this.server.registerTool(
      'start',
      {
        description: 'Start a new execution of a loaded program; by default it becomes the current execution. Then call getTask.',
        inputSchema: z.object({
          programId: z.string(),
          executionId: z.string(),
          setCurrent: z.boolean().optional()
        })
      },
      this.withErrors(async ({ programId, executionId, setCurrent = true }) => {
        await this.vmManager.startExecution(programId, executionId);
        
        // Auto-set as current execution unless explicitly disabled
        if (setCurrent) {
          await this.vmManager.setCurrentExecutionId(executionId);
        }
        
        return {
          content: [{ type: 'text', text: `Execution started: ${executionId}${setCurrent ? ' (set as current)' : ''}` }]
        };
      })
    );

    this.server.registerTool(
      'getTask',
      {
        description: 'Return the next cognitive task (CC prompt) of the current or given execution, or its completion/error status. Loop: getTask, do the work, submitTask, then getTask again until the execution is completed.',
        inputSchema: z.object({
          executionId: z.string().optional()
        })
      },
      this.withErrors(async ({ executionId }) => {
        const execId = await this.resolveExecutionId(executionId, NO_CURRENT_HINT);
        if (typeof execId !== 'string') return execId;
        
        const result = await this.vmManager.getNext(execId);
        
        if (result.type === 'completed') {
          const response = result.result !== undefined 
            ? `Execution completed with result: ${JSON.stringify(result.result)}`
            : 'Execution completed';
          return {
            content: [{ type: 'text', text: response }]
          };
        } else if (result.type === 'waiting') {
          return {
            content: [{ type: 'text', text: (result.message || 'Waiting for input') + SUBMIT_REMINDER }]
          };
        } else if (result.type === 'error') {
          return {
            content: [{ type: 'text', text: `Error: ${result.error}` }],
            isError: true
          };
        }
        
        return {
          content: [{ type: 'text', text: 'Unexpected state' }],
          isError: true
        };
      })
    );

    this.server.registerTool(
      'submitTask',
      {
        description: 'Submit the result of the current task and resume the execution. Loop: getTask, do the work, submitTask, then getTask again until the execution is completed.',
        inputSchema: z.object({
          executionId: z.string().optional(),
          result: z.string()
        })
      },
      this.withErrors(async ({ executionId, result }) => {
        const execId = await this.resolveExecutionId(executionId);
        if (typeof execId !== 'string') return execId;
        
        const next = await this.vmManager.reportCCResult(execId, result);
        if (next && next.type === 'completed') {
          const text = next.result !== undefined
            ? `OK. Execution completed with result: ${JSON.stringify(next.result)}`
            : 'OK. Execution completed.';
          return {
            content: [{ type: 'text', text }]
          };
        }
        if (next && next.type === 'error') {
          return {
            content: [{ type: 'text', text: `Error: ${next.error}` }],
            isError: true
          };
        }
        return {
          content: [{ type: 'text', text: SUBMIT_ACK }]
        };
      })
    );

    this.server.registerTool(
      'status',
      {
        description: 'Return the state, pc, stack and variables of the current or given execution.',
        inputSchema: z.object({
          executionId: z.string().optional()
        })
      },
      this.withErrors(async ({ executionId }) => {
        const execId = await this.resolveExecutionId(executionId);
        if (typeof execId !== 'string') return execId;
        
        const status = await this.vmManager.getExecutionStatus(execId);
        return {
          content: [{ type: 'text', text: JSON.stringify(status, null, 2) }]
        };
      })
    );

    this.server.registerTool(
      'list_executions',
      {
        description: 'List all executions with their state and current prompt, marking the current one.',
        inputSchema: z.object({})
      },
      this.withErrors(async () => {
        const executions = await this.vmManager.listExecutions();
        const currentId = await this.vmManager.getCurrentExecutionId();
        
        const executionList = executions.map(exec => ({
          executionId: exec.id,
          programId: exec.programId,
          state: exec.state,
          created: exec.created,
          isCurrent: exec.id === currentId,
          summary: {
            currentPrompt: exec.state === 'AWAITING_COGNITIVE_RESULT' ? exec.ccPrompt : undefined,
            tasksCompleted: 0 // TODO: Track this in future
          }
        }));
        
        return {
          content: [{ type: 'text', text: JSON.stringify(executionList, null, 2) }]
        };
      })
    );

    this.server.registerTool(
      'get_execution',
      {
        description: 'Return details of the current or given execution, including the pending prompt and attempts.',
        inputSchema: z.object({
          executionId: z.string().optional()
        })
      },
      this.withErrors(async ({ executionId }) => {
        const execId = await this.resolveExecutionId(executionId);
        if (typeof execId !== 'string') return execId;
        
        const execution = await this.vmManager.getExecutionWithAttempts(execId);
        const currentId = await this.vmManager.getCurrentExecutionId();
        
        const response = {
          executionId: execution.id,
          programId: execution.programId,
          state: execution.state,
          created: execution.created,
          isCurrent: execution.id === currentId,
          currentTask: execution.state === 'AWAITING_COGNITIVE_RESULT' ? {
            prompt: execution.ccPrompt,
            attempts: execution.attempts || 1,
            firstAttemptAt: execution.firstAttemptAt || execution.created,
            lastAttemptAt: execution.lastAttemptAt || execution.created
          } : undefined,
          variables: execution.variables,
          stats: {
            tasksCompleted: 0 // TODO: Track this
          }
        };
        
        return {
          content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
        };
      })
    );

    this.server.registerTool(
      'set_current',
      {
        description: 'Make the given execution the current one used by tools called without executionId.',
        inputSchema: z.object({
          executionId: z.string()
        })
      },
      this.withErrors(async ({ executionId }) => {
        await this.vmManager.setCurrentExecutionId(executionId);
        return {
          content: [{ type: 'text', text: `Current execution set to: ${executionId}` }]
        };
      })
    );

    this.server.registerTool(
      'delete_execution',
      {
        description: 'Delete an execution in two steps: call without confirmToken to get a single-use token (valid 5 minutes), then call again with it.',
        inputSchema: z.object({
          executionId: z.string(),
          confirmToken: z.string().optional()
        })
      },
      this.withErrors(async ({ executionId, confirmToken }) => {
        if (!confirmToken) {
          return {
            content: [{ 
              type: 'text', 
              text: JSON.stringify({
                confirmationRequired: true,
                message: `To delete execution '${executionId}', call this tool again with the confirmation token`,
                token: this.deleteConfirmations.issue('execution', executionId),
                expiresInSeconds: DELETE_TOKEN_TTL_SECONDS
              }, null, 2)
            }]
          };
        }
        
        if (this.deleteConfirmations.consume('execution', executionId, confirmToken)) {
          await this.vmManager.deleteExecution(executionId);
          return {
            content: [{ type: 'text', text: `Execution deleted: ${executionId}` }]
          };
        }
        
        return {
          content: [{ type: 'text', text: 'Invalid or expired confirmation token' }],
          isError: true
        };
      })
    );

    this.server.registerTool(
      'list_programs',
      {
        description: 'List all loaded programs.',
        inputSchema: z.object({})
      },
      this.withErrors(async () => {
        const programs = await this.vmManager.listPrograms();
        
        if (programs.length === 0) {
          return {
            content: [{ type: 'text', text: 'No programs loaded' }]
          };
        }
        
        // Format program list
        const programList = programs.map(p => ({
          programId: p.id,
          name: p.name,
          created: p.created
        }));
        
        return {
          content: [{ type: 'text', text: JSON.stringify(programList, null, 2) }]
        };
      })
    );

    this.server.registerTool(
      'delete_program',
      {
        description: 'Delete a program in two steps: call without confirmToken to get a single-use token (valid 5 minutes), then call again with it.',
        inputSchema: z.object({
          programId: z.string(),
          confirmToken: z.string().optional()
        })
      },
      this.withErrors(async ({ programId, confirmToken }) => {
        if (!confirmToken) {
          return {
            content: [{ 
              type: 'text', 
              text: JSON.stringify({
                confirmationRequired: true,
                message: `To delete program '${programId}', call this tool again with the confirmation token`,
                token: this.deleteConfirmations.issue('program', programId),
                expiresInSeconds: DELETE_TOKEN_TTL_SECONDS
              }, null, 2)
            }]
          };
        }
        
        if (this.deleteConfirmations.consume('program', programId, confirmToken)) {
          await this.vmManager.deleteProgram(programId);
          return {
            content: [{ type: 'text', text: `Program deleted: ${programId}` }]
          };
        }
        
        return {
          content: [{ type: 'text', text: 'Invalid or expired confirmation token' }],
          isError: true
        };
      })
    );

    this.server.registerTool(
      'restart',
      {
        description: 'Start a fresh execution of a program and make it current.',
        inputSchema: z.object({
          programId: z.string(),
          executionId: z.string().optional()
        })
      },
      this.withErrors(async ({ programId, executionId }) => {
        const execId = await this.vmManager.restartExecution(programId, executionId);
        return {
          content: [{ type: 'text', text: `Execution started: ${execId} (set as current)` }]
        };
      })
    );

    this.server.registerTool(
      'parsePlan',
      {
        description: 'Validate a TDDAB or step plan (single file or index with <files>) and write .cvm/uplan.json for the @planexecutor program.',
        inputSchema: z.object({ filePath: z.string() })
      },
      this.withErrors(async ({ filePath }) => {
        const resolvedPath = resolve(filePath);
        const markdown = await readFile(resolvedPath, 'utf-8');
        const subFiles = parseFilesTag(markdown);

        let uplanData;

        if (subFiles.length === 0) {
          const result = parseTddabPlan(markdown, filePath);

          if (!result.valid) {
            const errorText = result.errors.map(e => `line ${e.line}: ${e.message}`).join('\n');
            return {
              content: [{ type: 'text', text: `Plan validation failed:\n${errorText}` }],
              isError: true
            };
          }

          const plan = result.plan!;
          for (const b of plan.blocks) {
            const dup = b.isAction ? undefined : findDuplicateRedKey(b.redTests);
            if (dup) {
              return {
                content: [{ type: 'text', text: `Plan validation failed:\nBlock "${b.id}" has duplicate red tests: ${dup}` }],
                isError: true
              };
            }
          }
          uplanData = {
            type: deducePlanType(plan.blocks),
            mission: plan.mission,
            sourceFile: plan.sourceFile,
            blocks: plan.blocks.map(b => ({
              id: b.id,
              title: b.title,
              intro: b.intro,
              red: b.redTests.map(t => '- ' + t).join('\n'),
              redKeys: b.redTests.map(t => toRedKey(t)),
              success: b.success.map(s => '- [ ] ' + s).join('\n'),
              planRef: `See ${plan.sourceFile} lines ${b.startLine}-${b.endLine}`,
            })),
          };
        } else {
          const baseDir = dirname(resolvedPath);
          const indexResult = parseTddabPlan(markdown, filePath, { requireBlocks: false });
          if (!indexResult.valid) {
            const errorText = indexResult.errors.map(e => `line ${e.line}: ${e.message}`).join('\n');
            return {
              content: [{ type: 'text', text: `Index plan validation failed:\n${errorText}` }],
              isError: true
            };
          }
          const mission = indexResult.plan!.mission;

          const allBlocks: { id: string; title: string; intro: string; red: string; redKeys: string[]; success: string; planRef: string; isAction: boolean }[] = [];
          const seenIds = new Set<string>();
          const sourceFiles = [resolvedPath];

          for (const subFile of subFiles) {
            const subPath = resolve(baseDir, subFile);
            let subMarkdown: string;
            try {
              subMarkdown = await readFile(subPath, 'utf-8');
            } catch {
              return {
                content: [{ type: 'text', text: `Error: Sub-file not found: ${subFile}` }],
                isError: true
              };
            }

            const subResult = parseTddabPlan(subMarkdown, subFile, { requireMission: false });
            if (!subResult.valid) {
              const errorText = subResult.errors.map(e => `${subFile} line ${e.line}: ${e.message}`).join('\n');
              return {
                content: [{ type: 'text', text: `Plan validation failed in ${subFile}:\n${errorText}` }],
                isError: true
              };
            }

            sourceFiles.push(subPath);

            for (const block of subResult.plan!.blocks) {
              if (seenIds.has(block.id)) {
                return {
                  content: [{ type: 'text', text: `Error: Duplicate block id "${block.id}" in ${subFile}` }],
                  isError: true
                };
              }
              seenIds.add(block.id);
              const dup = block.isAction ? undefined : findDuplicateRedKey(block.redTests);
              if (dup) {
                return {
                  content: [{ type: 'text', text: `Plan validation failed in ${subFile}:\nBlock "${block.id}" has duplicate red tests: ${dup}` }],
                  isError: true
                };
              }
              allBlocks.push({
                id: block.id,
                title: block.title,
                intro: block.intro,
                red: block.redTests.map(t => '- ' + t).join('\n'),
                redKeys: block.redTests.map(t => toRedKey(t)),
                success: block.success.map(s => '- [ ] ' + s).join('\n'),
                planRef: `See ${subPath} lines ${block.startLine}-${block.endLine}`,
                isAction: block.isAction,
              });
            }
          }

          uplanData = {
            type: deducePlanType(allBlocks),
            mission,
            sourceFile: resolvedPath,
            sourceFiles,
            blocks: allBlocks,
          };
        }

        const dataDir = resolve(this.dataDir);
        await mkdir(dataDir, { recursive: true });
        const uplanPath = resolve(dataDir, 'uplan.json');
        await rename(uplanPath, uplanPath + '.bak').catch(() => undefined);
        await writeFile(uplanPath, JSON.stringify(uplanData, null, 2), 'utf-8');

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              valid: true,
              blocks: uplanData.blocks.length,
              path: uplanPath,
              blockIds: uplanData.blocks.map(b => b.id),
            }, null, 2)
          }]
        };
      })
    );
  }

  async start(transport?: Transport): Promise<void> {
    await this.vmManager.initialize();
    // Allow transport injection for testing, default to stdio for production
    this.transport = transport || new StdioServerTransport();
    await this.server.connect(this.transport);
  }

  async stop(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
    await this.vmManager.dispose();
  }

  // For testing - expose VMManager for direct testing
  getVMManager(): VMManager {
    return this.vmManager;
  }
}