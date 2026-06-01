# PlanExecutor Layer

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
mcp__cvm__parsePlan filePath="/home/laco/cvm/test/examples/multi-file-plan/index.md"
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
