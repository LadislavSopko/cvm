# Parser Layer

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
