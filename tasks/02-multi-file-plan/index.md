# TDDAB Plan: Multi-File Plan Support
**Date:** 2026-05-26

<mission>
PROJECT: Add multi-file TDDAB plan support to CVM.
Located in /home/laco/cvm/packages/mcp-server/src/lib/

TECH STACK: TypeScript, Vitest, Nx monorepo.
Tests with `npx nx test mcp-server`.

WHAT WE ARE BUILDING:
Currently parsePlan accepts a single .md file with mission + block tags.
We need to support an index.md that has the mission and a files tag listing sub-files.
Each sub-file contains only block tags (no mission).

The result is a single uplan.json with all blocks merged, each block's planRef
pointing to its own source sub-file and line numbers.

RULES:
1. Mission in index.md is authoritative. Mission in sub-files is silently ignored.
2. The files tag in index.md signals multi-file mode.
3. Block IDs must be globally unique across all files.
4. File order in files list = execution order.
5. No files tag + mission present = single-file plan (full backward compat).

FILES TO MODIFY:
- packages/mcp-server/src/lib/tddab-parser.ts
- packages/mcp-server/src/lib/tddab-parser.spec.ts
- packages/mcp-server/src/lib/mcp-server.ts
- packages/mcp-server/src/lib/mcp-server-parseplan.spec.ts
- test/programs/tddab/planexecutor.ts
</mission>

<files>
- 01-parser.md
- 02-mcp-server.md
- 03-planexecutor.md
</files>
