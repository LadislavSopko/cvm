# MCP Server Layer

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
to verify the full pipeline: parsePlan reads index.md → processes sub-files → produces correct uplan.json.

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
