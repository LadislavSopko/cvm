export interface TddabBlock {
  id: string;
  title: string;
  intro: string;
  redTests: string[];
  success: string[];
  startLine: number;
  endLine: number;
}

export interface TddabPlan {
  mission: string;
  blocks: TddabBlock[];
  sourceFile: string;
}

export interface ParseError {
  line: number;
  message: string;
}

export interface ParseResult {
  valid: boolean;
  plan: TddabPlan | null;
  errors: ParseError[];
}

export interface ParseOptions {
  requireMission?: boolean;
  requireBlocks?: boolean;
}

const BLOCK_ID_PATTERN = /^\d{2}-[a-z0-9]+(-[a-z0-9]+)*$/;

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

export function parseTddabPlan(markdown: string, sourceFile: string, options?: ParseOptions): ParseResult {
  const lines = markdown.split('\n');
  const errors: ParseError[] = [];
  let mission = '';
  let missionStart = -1;
  const blocks: TddabBlock[] = [];
  const seenIds = new Set<string>();

  let i = 0;

  while (i < lines.length) {
    if (lines[i].trim().startsWith('<mission>')) {
      missionStart = i;
      const sameLine = lines[i].trim().replace('<mission>', '').replace('</mission>', '').trim();
      if (lines[i].trim().endsWith('</mission>')) {
        mission = sameLine;
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
      if (i < lines.length) i++;
      mission = missionLines.join('\n').trim();
      break;
    }
    i++;
  }

  if (missionStart === -1) {
    if (options?.requireMission !== false) {
      errors.push({ line: 0, message: 'Missing <mission> tag' });
    }
    i = 0;
  } else if (!mission) {
    errors.push({ line: missionStart + 1, message: '<mission> tag is empty' });
  }

  while (i < lines.length) {
    const blockMatch = lines[i].trim().match(/^<block\s+id="([^"]+)">/);
    if (!blockMatch) { i++; continue; }

    const blockId = blockMatch[1];
    const blockStartLine = i;

    if (!BLOCK_ID_PATTERN.test(blockId)) {
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

      const titleMatch = line.match(/^##\s+TDDAB-\d+:\s+(.+)/);
      if (titleMatch) {
        title = titleMatch[1];
        i++;
        continue;
      }

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
        if (i < lines.length) i++;
        intro = introLines.join('\n').trim();
        continue;
      }

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
        if (i < lines.length) i++;
        continue;
      }

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
        if (i < lines.length) i++;
        continue;
      }

      i++;
    }

    if (blockEndLine === -1) {
      errors.push({ line: blockStartLine + 1, message: `Block "${blockId}" never closed with </block>` });
      blockEndLine = lines.length - 1;
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

  if (blocks.length === 0 && options?.requireBlocks !== false && !errors.some(e => e.message.includes('block'))) {
    errors.push({ line: 0, message: 'No <block> tags found' });
  }

  if (errors.length > 0) {
    return { valid: false, plan: null, errors };
  }

  return {
    valid: true,
    plan: { mission, blocks, sourceFile },
    errors: [],
  };
}
