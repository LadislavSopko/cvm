#!/usr/bin/env npx tsx
/// <reference no-default-lib="true"/>

interface TddabBlock {
  id: string;
  title: string;
  intro: string;
  redTests: string[];
  success: string[];
  startLine: number;
  endLine: number;
}

interface TddabPlan {
  mission: string;
  blocks: TddabBlock[];
  sourceFile: string;
}

interface ValidationError {
  line: number;
  message: string;
}

function parseTddabPlan(markdown: string, sourceFile: string): { plan: TddabPlan | null; errors: ValidationError[] } {
  const lines = markdown.split('\n');
  const errors: ValidationError[] = [];
  let mission = '';
  let missionStart = -1;
  let missionEnd = -1;
  const blocks: TddabBlock[] = [];
  const seenIds = new Set<string>();

  let i = 0;

  // find <mission>
  while (i < lines.length) {
    if (lines[i].trim().startsWith('<mission>')) {
      missionStart = i;
      const sameLine = lines[i].trim().replace('<mission>', '').replace('</mission>', '').trim();
      if (lines[i].trim().endsWith('</mission>')) {
        mission = sameLine;
        missionEnd = i;
        i++;
        break;
      }
      const missionLines: string[] = [];
      if (sameLine) missionLines.push(sameLine);
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('</mission>')) {
        missionLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) {
        missionEnd = i;
        i++;
      }
      mission = missionLines.join('\n').trim();
      break;
    }
    i++;
  }

  if (missionStart === -1) {
    errors.push({ line: 0, message: 'Missing <mission> tag' });
  } else if (!mission) {
    errors.push({ line: missionStart + 1, message: '<mission> tag is empty' });
  }

  // find blocks
  while (i < lines.length) {
    const blockMatch = lines[i].trim().match(/^<block\s+id="([^"]+)">/);
    if (!blockMatch) { i++; continue; }

    const blockId = blockMatch[1];
    const blockStartLine = i;

    if (!/^\d{2}-[a-z0-9]+(-[a-z0-9]+)*$/.test(blockId)) {
      errors.push({ line: i + 1, message: `Block id "${blockId}" must be NN-kebab-case format` });
    }
    if (seenIds.has(blockId)) {
      errors.push({ line: i + 1, message: `Duplicate block id "${blockId}"` });
    }
    seenIds.add(blockId);

    let title = '';
    let intro = '';
    let redTests: string[] = [];
    let successItems: string[] = [];
    let blockEndLine = -1;
    let hasIntro = false;
    let hasRed = false;
    let hasSuccess = false;

    i++;
    while (i < lines.length) {
      const line = lines[i].trim();

      if (line.startsWith('</block>')) {
        blockEndLine = i;
        i++;
        break;
      }

      // title
      const titleMatch = line.match(/^##\s+TDDAB-\d+:\s+(.+)/);
      if (titleMatch) {
        title = titleMatch[1];
        i++;
        continue;
      }

      // <intro>
      if (line.startsWith('<intro>')) {
        hasIntro = true;
        const introLines: string[] = [];
        const sameLine = line.replace('<intro>', '').replace('</intro>', '').trim();
        if (line.includes('</intro>')) {
          intro = sameLine;
          i++;
          continue;
        }
        if (sameLine) introLines.push(sameLine);
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('</intro>')) {
          introLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) i++; // skip </intro>
        intro = introLines.join('\n').trim();
        continue;
      }

      // <red>
      if (line.startsWith('<red>')) {
        hasRed = true;
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('</red>')) {
          const testMatch = lines[i].trim().match(/^-\s*test:\s*(.+)/);
          if (testMatch) {
            redTests.push(testMatch[1].trim());
          }
          i++;
        }
        if (i < lines.length) i++; // skip </red>
        continue;
      }

      // <success>
      if (line.startsWith('<success>')) {
        hasSuccess = true;
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('</success>')) {
          const checkMatch = lines[i].trim().match(/^-\s*\[\s*\]\s*(.+)/);
          if (checkMatch) {
            successItems.push(checkMatch[1].trim());
          }
          i++;
        }
        if (i < lines.length) i++; // skip </success>
        continue;
      }

      i++;
    }

    if (blockEndLine === -1) {
      errors.push({ line: blockStartLine + 1, message: `Block "${blockId}" never closed with </block>` });
      blockEndLine = lines.length - 1;
    }
    if (!title) {
      errors.push({ line: blockStartLine + 1, message: `Block "${blockId}" missing ## TDDAB-N: title` });
    }
    if (!hasIntro) {
      errors.push({ line: blockStartLine + 1, message: `Block "${blockId}" missing <intro> tag` });
    } else if (!intro) {
      errors.push({ line: blockStartLine + 1, message: `Block "${blockId}" has empty <intro>` });
    }
    if (!hasRed) {
      errors.push({ line: blockStartLine + 1, message: `Block "${blockId}" missing <red> tag` });
    } else if (redTests.length === 0) {
      errors.push({ line: blockStartLine + 1, message: `Block "${blockId}" has <red> but no "- test:" lines` });
    }
    if (!hasSuccess) {
      errors.push({ line: blockStartLine + 1, message: `Block "${blockId}" missing <success> tag` });
    } else if (successItems.length === 0) {
      errors.push({ line: blockStartLine + 1, message: `Block "${blockId}" has <success> but no "- [ ]" items` });
    }

    blocks.push({
      id: blockId,
      title,
      intro,
      redTests,
      success: successItems,
      startLine: blockStartLine + 1,
      endLine: blockEndLine + 1,
    });
  }

  if (blocks.length === 0) {
    errors.push({ line: 0, message: 'No <block> tags found' });
  }

  if (errors.length > 0) {
    return { plan: null, errors };
  }

  return {
    plan: { mission, blocks, sourceFile },
    errors: [],
  };
}

function escapeString(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

function generatePlanData(plan: TddabPlan): object {
  return {
    mission: plan.mission,
    sourceFile: plan.sourceFile,
    blocks: plan.blocks.map(b => ({
      id: b.id,
      title: b.title,
      intro: b.intro,
      red: b.redTests.map(t => '- ' + t).join('\n'),
      success: b.success.map(s => '- [ ] ' + s).join('\n'),
      planRef: `See ${plan.sourceFile} lines ${b.startLine}-${b.endLine}`,
    })),
  };
}

function generateExecutorSource(plan: TddabPlan): string {
  const blockEntries = plan.blocks.map(b => {
    const redJoined = b.redTests.map(t => '- ' + t).join('\\n');
    const successJoined = b.success.map(s => '- [ ] ' + s).join('\\n');
    return `    { id: "${escapeString(b.id)}", title: "${escapeString(b.title)}", intro: "${escapeString(b.intro)}", red: "${escapeString(redJoined)}", success: "${escapeString(successJoined)}", planRef: "See ${escapeString(plan.sourceFile)} lines ${b.startLine}-${b.endLine}" }`;
  });

  const src = `/// <reference no-default-lib="true"/>
declare function CC(prompt: string): string;

function main() {
  var blocks = [
${blockEntries.join(',\n')}
  ];

  CC("MISSION: ${escapeString(plan.mission)} You have " + blocks.length + " blocks to implement. Respond done to start.");

  var blockIndex = 0;

  while (blockIndex < blocks.length) {
    var block = blocks[blockIndex];

    CC("RED phase for block " + block.id + ": " + block.intro + " Write ONLY the failing tests. RED TESTS: " + block.red + " " + block.planRef + " Do NOT implement yet. Respond done.");

    CC("GREEN phase for block " + block.id + ". Implement code to make the failing tests pass. Respond done.");

    var testResult = CC("VERIFY block " + block.id + ". Run all tests. SUCCESS CRITERIA: " + block.success + " Respond passed or failed.");

    while (testResult === "failed") {
      CC("Tests failed for block " + block.id + ". Debug and fix. Respond done.");
      testResult = CC("Re-run tests for block " + block.id + ". SUCCESS CRITERIA: " + block.success + " Respond passed or failed.");
    }

    CC("COMMIT block " + block.id + ". All tests pass. Commit and push. Respond done.");

    console.log("Block " + block.id + " completed");
    blockIndex = blockIndex + 1;
  }

  console.log("All " + blocks.length + " blocks completed!");
}
`;

  return src;
}

// --- CLI ---

import { readFileSync, writeFileSync } from 'fs';
import { resolve, basename } from 'path';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: npx tsx validate-plan.ts <plan.md> [--output <file.ts>]');
  process.exit(1);
}

const inputFile = resolve(args[0]);
const outputIdx = args.indexOf('--output');
const outputFile = outputIdx !== -1 && args[outputIdx + 1]
  ? resolve(args[outputIdx + 1])
  : null;

let markdown: string;
try {
  markdown = readFileSync(inputFile, 'utf-8');
} catch (e) {
  console.error(`Cannot read file: ${inputFile}`);
  process.exit(1);
}

console.log(`Parsing: ${inputFile}\n`);

const { plan, errors } = parseTddabPlan(markdown, args[0]);

if (errors.length > 0) {
  console.error('VALIDATION FAILED:\n');
  for (const err of errors) {
    console.error(`  line ${err.line}: ${err.message}`);
  }
  process.exit(1);
}

if (!plan) process.exit(1);

console.log(`OK: mission found (${plan.mission.length} chars)`);
console.log(`OK: ${plan.blocks.length} blocks parsed:\n`);
for (const b of plan.blocks) {
  console.log(`  ${b.id} - "${b.title}" (lines ${b.startLine}-${b.endLine})`);
  console.log(`    ${b.redTests.length} red tests, ${b.success.length} success criteria`);
}

const planData = generatePlanData(plan);
const jsonOutput = outputFile
  ? outputFile.replace(/\.(ts|js)$/, '.json')
  : inputFile.replace(/\.md$/, '-data.json');
writeFileSync(jsonOutput, JSON.stringify(planData, null, 2), 'utf-8');
console.log(`\nPlan data written to: ${jsonOutput}`);

console.log('\nDone. Plan is valid, data generated.');
