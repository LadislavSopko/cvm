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

<block id="01-require-mission-option">
## TDDAB-1: Make Mission Optional in Parser

<intro>
Add options parameter to parseTddabPlan so the mission tag can be optional.
This allows sub-files (blocks-only) to be parsed without error.
File to modify: /home/laco/cvm/packages/mcp-server/src/lib/tddab-parser.ts
Test file: /home/laco/cvm/packages/mcp-server/src/lib/tddab-parser.spec.ts
</intro>

<red>
- test: parseTddabPlan with requireMission:false and no mission tag returns valid:true with empty mission
- test: parseTddabPlan with requireMission:true (default) and no mission tag returns valid:false
- test: parseTddabPlan with requireMission:false still parses blocks correctly
- test: existing tests still pass (backward compat)
</red>

### Implementation

Change function signature from:
```typescript
export function parseTddabPlan(markdown: string, sourceFile: string): ParseResult
```
To:
```typescript
export interface ParseOptions {
  requireMission?: boolean;
}

export function parseTddabPlan(markdown: string, sourceFile: string, options?: ParseOptions): ParseResult
```

In the mission validation block (around line 62-67), check `options?.requireMission !== false` before adding the error:
```typescript
if (missionStart === -1) {
  if (options?.requireMission !== false) {
    errors.push({ line: 0, message: 'Missing <mission> tag' });
  }
}
```

Also need to fix the block search: when mission is not found, `i` is at end of file.
Reset `i = 0` before block search when requireMission is false and no mission found.

<success>
- [ ] parseTddabPlan accepts optional third parameter ParseOptions
- [ ] requireMission:false + no mission → valid:true, mission empty string
- [ ] requireMission:true + no mission → valid:false (existing behavior)
- [ ] Default behavior unchanged (requireMission defaults to true)
- [ ] All existing parser tests pass: npx nx test mcp-server -- tddab-parser
</success>
</block>

<block id="02-parse-files-tag">
## TDDAB-2: Parse Files Tag from Index

<intro>
Add parseFilesTag function to extract the file list from the files tag in index.md.
This is a pure parsing function — no file I/O, just extracts filenames from markdown.
File to modify: /home/laco/cvm/packages/mcp-server/src/lib/tddab-parser.ts
Test file: /home/laco/cvm/packages/mcp-server/src/lib/tddab-parser.spec.ts
</intro>

<red>
- test: parseFilesTag extracts filenames from files tag
- test: parseFilesTag returns empty array if no files tag
- test: parseFilesTag trims whitespace from filenames
- test: parseFilesTag ignores empty lines inside files tag
</red>

### Implementation

Add new exported function:
```typescript
export function parseFilesTag(markdown: string): string[] {
  const lines = markdown.split('\n');
  let i = 0;
  while (i < lines.length) {
    if (lines[i].trim().startsWith('<files>')) {
      const files: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('</files>')) {
        const match = lines[i].trim().match(/^-\s+(.+)/);
        if (match) {
          const filename = match[1].trim();
          if (filename) files.push(filename);
        }
        i++;
      }
      return files;
    }
    i++;
  }
  return [];
}
```

<success>
- [ ] parseFilesTag exported from tddab-parser.ts
- [ ] parseFilesTag with files tag containing 2 entries returns ["01-a.md", "02-b.md"]
- [ ] parseFilesTag with no files tag returns []
- [ ] parseFilesTag trims whitespace and ignores blank lines
- [ ] All tests pass: npx nx test mcp-server -- tddab-parser
</success>
</block>

<block id="03-parseplan-multifile">
## TDDAB-3: Multi-File Support in parsePlan Tool

<intro>
Modify the parsePlan MCP tool handler to detect the files tag and parse multiple sub-files.
When the files tag is found, the tool reads each listed sub-file, parses blocks from each,
merges them into a single uplan.json with correct per-block planRef.

File to modify: /home/laco/cvm/packages/mcp-server/src/lib/mcp-server.ts (parsePlan handler, line 523)
Test file: /home/laco/cvm/packages/mcp-server/src/lib/mcp-server-parseplan.spec.ts
Depends on blocks 01-require-mission-option and 02-parse-files-tag.
</intro>

<red>
- test: parsePlan with single-file plan works exactly as before (backward compat)
- test: parsePlan with index.md containing files tag reads sub-files and merges blocks
- test: parsePlan multi-file produces correct planRef per block pointing to sub-file
- test: parsePlan multi-file sets sourceFiles array in uplan.json
- test: parsePlan multi-file with duplicate block ID across files returns error
- test: parsePlan multi-file with missing sub-file returns error
- test: parsePlan multi-file ignores mission tag in sub-files
</red>

### Implementation

In the parsePlan handler (mcp-server.ts line 523+), after reading the markdown:

```typescript
async ({ filePath }) => {
  try {
    const resolvedPath = resolve(filePath);
    const markdown = await readFile(resolvedPath, 'utf-8');
    const subFiles = parseFilesTag(markdown);

    if (subFiles.length === 0) {
      // SINGLE-FILE MODE — existing behavior, unchanged
      const result = parseTddabPlan(markdown, filePath);
      // ... rest of existing single-file logic ...
    } else {
      // MULTI-FILE MODE
      const baseDir = dirname(resolvedPath);

      // Parse index.md for mission only
      const indexResult = parseTddabPlan(markdown, filePath);
      if (!indexResult.valid) {
        // return error
      }
      const mission = indexResult.plan!.mission;

      const allBlocks = [];
      const seenIds = new Set<string>();
      const sourceFiles = [filePath];

      for (const subFile of subFiles) {
        const subPath = resolve(baseDir, subFile);
        const subMarkdown = await readFile(subPath, 'utf-8');
        const subResult = parseTddabPlan(subMarkdown, subFile, { requireMission: false });

        if (!subResult.valid) {
          // return errors prefixed with filename
        }

        sourceFiles.push(subPath);

        for (const block of subResult.plan!.blocks) {
          if (seenIds.has(block.id)) {
            // return duplicate ID error
          }
          seenIds.add(block.id);
          allBlocks.push({
            id: block.id,
            title: block.title,
            intro: block.intro,
            red: block.redTests.map(t => '- ' + t).join('\n'),
            success: block.success.map(s => '- [ ] ' + s).join('\n'),
            planRef: `See ${subPath} lines ${block.startLine}-${block.endLine}`,
          });
        }
      }

      const uplanData = {
        mission,
        sourceFile: filePath,
        sourceFiles,
        blocks: allBlocks,
      };

      // write uplan.json (same as single-file)
    }
  }
}
```

Import parseFilesTag and dirname at top of file.

<success>
- [ ] Single-file parsePlan unchanged — all existing tests pass
- [ ] Multi-file parsePlan merges blocks from all sub-files into one uplan.json
- [ ] Each block's planRef points to its sub-file with correct line numbers
- [ ] uplan.json has sourceFile (index.md) and sourceFiles (all files) fields
- [ ] Duplicate block ID across files produces clear error
- [ ] Missing sub-file produces clear error with filename
- [ ] Mission tag in sub-files is silently ignored
- [ ] All tests pass: npx nx test mcp-server
</success>
</block>

<block id="04-parseplan-e2e-test">
## TDDAB-4: E2E Test with Real Multi-File Plan

<intro>
Create an integration test that uses the actual multi-file plan in test/examples/multi-file-plan/
to verify the full pipeline: parsePlan reads index.md, processes sub-files, produces correct uplan.json.

Test file: /home/laco/cvm/packages/mcp-server/src/lib/mcp-server-parseplan.spec.ts
Test data: /home/laco/cvm/test/examples/multi-file-plan/ (already created)
Depends on block 03-parseplan-multifile.
</intro>

<red>
- test: parsePlan with test/examples/multi-file-plan/index.md produces valid uplan.json
- test: uplan.json contains 4 blocks from 2 sub-files
- test: block IDs are 01-task-interface, 02-task-helpers, 03-task-store, 04-task-summary
- test: blocks from 01-models.md have planRef pointing to 01-models.md
- test: blocks from 02-services.md have planRef pointing to 02-services.md
- test: sourceFiles array contains index.md, 01-models.md, 02-services.md
</red>

### Implementation

Add test in mcp-server-parseplan.spec.ts:
```typescript
it('should parse multi-file plan from test/examples', async () => {
  const indexPath = resolve(__dirname, '../../../../test/examples/multi-file-plan/index.md');
  // call parsePlan with indexPath
  // verify uplan.json has 4 blocks
  // verify planRef per block points to correct sub-file
  // verify sourceFiles array
});
```

<success>
- [ ] E2E test passes with real multi-file plan from test/examples/multi-file-plan/
- [ ] uplan.json has exactly 4 blocks in correct order
- [ ] Block planRefs point to respective sub-files
- [ ] sourceFiles contains all 3 paths (index + 2 sub-files)
- [ ] All tests pass: npx nx test mcp-server
</success>
</block>

<block id="05-executor-sourcefiles">
## TDDAB-5: PlanExecutor Multi-Source Display

<intro>
Update planexecutor.ts to handle the new sourceFiles array field in uplan.json.
Display all source files at startup. The block loop is unchanged since planRef
per block already points to the correct sub-file.

File to modify: /home/laco/cvm/test/programs/tddab/planexecutor.ts
Depends on block 03-parseplan-multifile.
</intro>

<red>
- test: planexecutor displays all source files when sourceFiles is present
- test: planexecutor falls back to sourceFile when sourceFiles is absent (backward compat)
- test: planexecutor runs blocks from multi-file plan in correct order
</red>

### Implementation

In planexecutor.ts around line 14, change:
```typescript
// FROM:
var sourceFile = data.sourceFile;
console.log("Plan: " + sourceFile);

// TO:
var sourceFile = data.sourceFile;
var sourceFiles = data.sourceFiles;
if (sourceFiles !== undefined && sourceFiles !== null) {
  console.log("Plan: " + sourceFiles.length + " files");
  var fi = 0;
  while (fi < sourceFiles.length) {
    console.log("  - " + sourceFiles[fi]);
    fi = fi + 1;
  }
} else {
  console.log("Plan: " + sourceFile);
}
```

Note: CVM language does not support for-of or forEach, use while loop with index.

<success>
- [ ] planexecutor displays file list when sourceFiles present in uplan.json
- [ ] planexecutor displays single file when only sourceFile present (backward compat)
- [ ] Block execution unchanged — planRef per block already correct
- [ ] Build passes: npx nx build cvm-server (planexecutor is copied to dist via viteStaticCopy)
</success>
</block>

<block id="06-full-cycle-test">
## TDDAB-6: Full Cycle Verification

<intro>
Run the complete pipeline with the multi-file test plan:
1. parsePlan with index.md
2. loadFile @planexecutor
3. start execution
4. Verify getTask returns correct prompts from blocks across both sub-files

This is a manual verification block — run the MCP tools and check the output.
No new test files needed, just verify the existing E2E tests still pass
and the multi-file plan works end-to-end.
</intro>

<red>
- test: parsePlan with multi-file-plan/index.md succeeds with 4 blocks
- test: loadFile @planexecutor succeeds
- test: start execution succeeds
- test: getTask returns MISSION BRIEFING with correct mission text
- test: existing E2E tests in tddab-e2e.spec.ts still pass
</red>

### Verification steps
```bash
# 1. Parse the multi-file plan
mcp__cvm__parsePlan filePath="test/examples/multi-file-plan/index.md"
# Expected: valid:true, blocks:4

# 2. Check uplan.json
cat .cvm/uplan.json | jq '.blocks | length'
# Expected: 4

# 3. Verify planRefs
cat .cvm/uplan.json | jq '.blocks[].planRef'
# Expected: 01-models.md for first 2, 02-services.md for last 2

# 4. Run existing tests
npx nx test mcp-server
# Expected: all pass

# 5. Run E2E tests
./test/programs/run-category.sh 11-tddab
# Expected: all pass
```

<success>
- [ ] parsePlan multi-file produces valid uplan.json with 4 blocks
- [ ] planRef per block points to correct sub-file
- [ ] sourceFiles array present in uplan.json
- [ ] All unit tests pass: npx nx test mcp-server
- [ ] All E2E tests pass: ./test/programs/run-category.sh 11-tddab
- [ ] Build passes: npx nx build cvm-server
</success>
</block>
