import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { z } from 'zod';
import { VMManager } from '@cvm/vm';
import { readFile, writeFile, mkdir, rename } from 'fs/promises';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { parseTddabPlan, parseFilesTag } from './tddab-parser.js';

function toRedKey(test: string): string {
  return test.replace(/[^a-zA-Z0-9 ]/g, '').trim().substring(0, 40).trim().replace(/ +/g, '_').toLowerCase();
}

const BUILTIN_PROGRAMS: Record<string, string> = {
  '@planexecutor': 'planexecutor.ts',
};

/**
 * MCP Server - A thin interface layer for the CVM
 * All execution logic is handled by VMManager
 */
export class CVMMcpServer {
  private server: McpServer;
  private transport: Transport | null = null;
  private vmManager: VMManager;
  private version: string;

  constructor(version: string = '0.0.1') {
    this.version = version;
    this.vmManager = new VMManager();
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

  private setupTools(): void {
    this.server.tool(
      'server_info',
      {},
      async () => {
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
      }
    );

    this.server.tool(
      'load',
      {
        programId: z.string(),
        source: z.string()
      },
      async ({ programId, source }) => {
        try {
          await this.vmManager.loadProgram(programId, source);
          return {
            content: [{ type: 'text', text: `Program loaded successfully: ${programId}` }]
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
            isError: true
          };
        }
      }
    );

    // Load a CVM program from file path
    this.server.tool(
      'loadFile',
      {
        programId: z.string(),
        filePath: z.string()
      },
      async ({ programId, filePath }) => {
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
          if (error instanceof Error) {
            const nodeError = error as NodeJS.ErrnoException;
            if (nodeError.code === 'ENOENT') {
              return {
                content: [{ type: 'text', text: `Error: File not found: ${filePath}` }],
                isError: true
              };
            } else if (nodeError.code === 'EACCES') {
              return {
                content: [{ type: 'text', text: `Error: Permission denied: ${filePath}` }],
                isError: true
              };
            }
          }
          return {
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
            isError: true
          };
        }
      }
    );

    // Start execution of a program
    this.server.tool(
      'start',
      {
        programId: z.string(),
        executionId: z.string(),
        setCurrent: z.boolean().optional()
      },
      async ({ programId, executionId, setCurrent = true }) => {
        try {
          await this.vmManager.startExecution(programId, executionId);
          
          // Auto-set as current execution unless explicitly disabled
          if (setCurrent) {
            await this.vmManager.setCurrentExecutionId(executionId);
          }
          
          return {
            content: [{ type: 'text', text: `Execution started: ${executionId}${setCurrent ? ' (set as current)' : ''}` }]
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
            isError: true
          };
        }
      }
    );

    // Get next CC prompt or completion status
    this.server.tool(
      'getTask',
      {
        executionId: z.string().optional()
      },
      async ({ executionId }) => {
        try {
          // Use current execution if no ID provided
          let execId = executionId;
          if (!execId) {
            const currentId = await this.vmManager.getCurrentExecutionId();
            if (!currentId) {
              return {
                content: [{ type: 'text', text: 'No current execution set. Use list_executions to see available executions.' }]
              };
            }
            execId = currentId;
          }
          
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
              content: [{ type: 'text', text: result.message || 'Waiting for input' }]
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
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
            isError: true
          };
        }
      }
    );

    // Report CC result and continue execution
    this.server.tool(
      'submitTask',
      {
        executionId: z.string().optional(),
        result: z.string()
      },
      async ({ executionId, result }) => {
        try {
          // Use current execution if no ID provided
          let execId = executionId;
          if (!execId) {
            const currentId = await this.vmManager.getCurrentExecutionId();
            if (!currentId) {
              return {
                content: [{ type: 'text', text: 'Error: No current execution set' }],
                isError: true
              };
            }
            execId = currentId;
          }
          
          await this.vmManager.reportCCResult(execId, result);
          return {
            content: [{ type: 'text', text: 'Execution resumed' }]
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
            isError: true
          };
        }
      }
    );

    // Get current execution state
    this.server.tool(
      'status',
      {
        executionId: z.string().optional()
      },
      async ({ executionId }) => {
        try {
          // Use current execution if no ID provided
          let execId = executionId;
          if (!execId) {
            const currentId = await this.vmManager.getCurrentExecutionId();
            if (!currentId) {
              return {
                content: [{ type: 'text', text: 'Error: No current execution set' }],
                isError: true
              };
            }
            execId = currentId;
          }
          
          const status = await this.vmManager.getExecutionStatus(execId);
          return {
            content: [{ type: 'text', text: JSON.stringify(status, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
            isError: true
          };
        }
      }
    );

    // List all executions
    this.server.tool(
      'list_executions',
      {},
      async () => {
        try {
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
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
            isError: true
          };
        }
      }
    );

    // Get detailed execution info
    this.server.tool(
      'get_execution',
      {
        executionId: z.string().optional()
      },
      async ({ executionId }) => {
        try {
          // Use current execution if no ID provided
          let execId = executionId;
          if (!execId) {
            const currentId = await this.vmManager.getCurrentExecutionId();
            if (!currentId) {
              return {
                content: [{ type: 'text', text: 'Error: No current execution set' }],
                isError: true
              };
            }
            execId = currentId;
          }
          
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
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
            isError: true
          };
        }
      }
    );

    // Set current execution
    this.server.tool(
      'set_current',
      {
        executionId: z.string()
      },
      async ({ executionId }) => {
        try {
          await this.vmManager.setCurrentExecutionId(executionId);
          return {
            content: [{ type: 'text', text: `Current execution set to: ${executionId}` }]
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
            isError: true
          };
        }
      }
    );

    // Delete execution (with confirmation)
    this.server.tool(
      'delete_execution',
      {
        executionId: z.string(),
        confirmToken: z.string().optional()
      },
      async ({ executionId, confirmToken }) => {
        try {
          // Generate confirmation token
          const expectedToken = `delete-${executionId}-${Date.now()}`;
          
          if (!confirmToken) {
            return {
              content: [{ 
                type: 'text', 
                text: JSON.stringify({
                  confirmationRequired: true,
                  message: `To delete execution '${executionId}', call this tool again with the confirmation token`,
                  token: expectedToken
                }, null, 2)
              }]
            };
          }
          
          // Validate the token - it should start with "delete-{executionId}-"
          if (confirmToken && confirmToken.startsWith(`delete-${executionId}-`)) {
            await this.vmManager.deleteExecution(executionId);
            return {
              content: [{ type: 'text', text: `Execution deleted: ${executionId}` }]
            };
          }
          
          return {
            content: [{ type: 'text', text: 'Invalid confirmation token' }],
            isError: true
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
            isError: true
          };
        }
      }
    );

    // List all programs
    this.server.tool(
      'list_programs',
      {},
      async () => {
        try {
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
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
            isError: true
          };
        }
      }
    );

    // Delete program (with confirmation)
    this.server.tool(
      'delete_program',
      {
        programId: z.string(),
        confirmToken: z.string().optional()
      },
      async ({ programId, confirmToken }) => {
        try {
          // Generate confirmation token
          const expectedToken = `delete-${programId}-${Date.now()}`;
          
          if (!confirmToken) {
            return {
              content: [{ 
                type: 'text', 
                text: JSON.stringify({
                  confirmationRequired: true,
                  message: `To delete program '${programId}', call this tool again with the confirmation token`,
                  token: expectedToken
                }, null, 2)
              }]
            };
          }
          
          // Validate the token - it should start with "delete-{programId}-"
          if (confirmToken && confirmToken.startsWith(`delete-${programId}-`)) {
            await this.vmManager.deleteProgram(programId);
            return {
              content: [{ type: 'text', text: `Program deleted: ${programId}` }]
            };
          }
          
          return {
            content: [{ type: 'text', text: 'Invalid confirmation token' }],
            isError: true
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
            isError: true
          };
        }
      }
    );

    // Restart program (create new execution and set as current)
    this.server.tool(
      'restart',
      {
        programId: z.string(),
        executionId: z.string().optional()
      },
      async ({ programId, executionId }) => {
        try {
          const execId = await this.vmManager.restartExecution(programId, executionId);
          return {
            content: [{ type: 'text', text: `Execution started: ${execId} (set as current)` }]
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
            isError: true
          };
        }
      }
    );

    this.server.tool(
      'parsePlan',
      { filePath: z.string() },
      async ({ filePath }) => {
        try {
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
            uplanData = {
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

            const allBlocks: { id: string; title: string; intro: string; red: string; success: string; planRef: string }[] = [];
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
                allBlocks.push({
                  id: block.id,
                  title: block.title,
                  intro: block.intro,
                  red: block.redTests.map(t => '- ' + t).join('\n'),
                  redKeys: block.redTests.map(t => toRedKey(t)),
                  success: block.success.map(s => '- [ ] ' + s).join('\n'),
                  planRef: `See ${subPath} lines ${block.startLine}-${block.endLine}`,
                });
              }
            }

            uplanData = {
              mission,
              sourceFile: resolvedPath,
              sourceFiles,
              blocks: allBlocks,
            };
          }

          const dataDir = resolve(process.env['CVM_DATA_DIR'] || '.cvm');
          await mkdir(dataDir, { recursive: true });
          const uplanPath = resolve(dataDir, 'uplan.json');
          try { await rename(uplanPath, uplanPath + '.bak'); } catch {}
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
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
            isError: true
          };
        }
      }
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