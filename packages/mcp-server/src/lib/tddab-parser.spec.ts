import { describe, it, expect } from 'vitest';
import { parseTddabPlan, parseFilesTag } from './tddab-parser.js';

const validPlan = `# TDDAB Plan: Test
**Date:** 2026-05-25

<mission>
Project context for testing. TypeScript project.
Build: npx nx test sample.
</mission>

<block id="01-greeting">
## TDDAB-1: Add Greeting Function

<intro>
Create a greeting function.
File: src/greeting.ts
</intro>

<red>
- test: greet("World") returns "Hello, World!"
- test: greet("") returns "Hello, !"
</red>

### Implementation
export function greet(name: string): string { return "Hello, " + name + "!"; }

<success>
- [ ] greet function exists
- [ ] all tests pass
</success>
</block>

<block id="02-farewell">
## TDDAB-2: Add Farewell Function

<intro>
Create a farewell function.
File: src/farewell.ts
</intro>

<red>
- test: farewell("World") returns "Goodbye, World!"
- test: farewell("") returns "Goodbye, !"
</red>

### Implementation
export function farewell(name: string): string { return "Goodbye, " + name + "!"; }

<success>
- [ ] farewell function exists
- [ ] all tests pass
</success>
</block>
`;

describe('parseTddabPlan', () => {
  describe('happy path', () => {
    it('should extract mission text from mission tag', () => {
      const result = parseTddabPlan(validPlan, 'test-plan.md');
      expect(result.valid).toBe(true);
      expect(result.plan?.mission).toContain('Project context for testing');
    });

    it('should extract all blocks with correct ids', () => {
      const result = parseTddabPlan(validPlan, 'test-plan.md');
      expect(result.valid).toBe(true);
      expect(result.plan?.blocks).toHaveLength(2);
      expect(result.plan?.blocks[0].id).toBe('01-greeting');
      expect(result.plan?.blocks[1].id).toBe('02-farewell');
    });

    it('should extract block titles', () => {
      const result = parseTddabPlan(validPlan, 'test-plan.md');
      expect(result.plan?.blocks[0].title).toBe('Add Greeting Function');
      expect(result.plan?.blocks[1].title).toBe('Add Farewell Function');
    });

    it('should extract intro content for each block', () => {
      const result = parseTddabPlan(validPlan, 'test-plan.md');
      expect(result.plan?.blocks[0].intro).toContain('Create a greeting function');
      expect(result.plan?.blocks[1].intro).toContain('Create a farewell function');
    });

    it('should extract redTests array for each block', () => {
      const result = parseTddabPlan(validPlan, 'test-plan.md');
      expect(result.plan?.blocks[0].redTests).toEqual([
        'greet("World") returns "Hello, World!"',
        'greet("") returns "Hello, !"',
      ]);
      expect(result.plan?.blocks[1].redTests).toEqual([
        'farewell("World") returns "Goodbye, World!"',
        'farewell("") returns "Goodbye, !"',
      ]);
    });

    it('should extract success array for each block', () => {
      const result = parseTddabPlan(validPlan, 'test-plan.md');
      expect(result.plan?.blocks[0].success).toEqual([
        'greet function exists',
        'all tests pass',
      ]);
      expect(result.plan?.blocks[1].success).toEqual([
        'farewell function exists',
        'all tests pass',
      ]);
    });

    it('should set accurate startLine and endLine (1-indexed)', () => {
      const result = parseTddabPlan(validPlan, 'test-plan.md');
      const lines = validPlan.split('\n');
      const block1Start = lines.findIndex(l => l.includes('<block id="01-greeting">'));
      const block1End = lines.findIndex(l => l.includes('</block>'));
      expect(result.plan?.blocks[0].startLine).toBe(block1Start + 1);
      expect(result.plan?.blocks[0].endLine).toBe(block1End + 1);
    });

    it('should set sourceFile from parameter', () => {
      const result = parseTddabPlan(validPlan, 'my-plan.md');
      expect(result.plan?.sourceFile).toBe('my-plan.md');
    });

    it('should handle multi-line mission content', () => {
      const md = `<mission>
Line one.
Line two.
Line three.
</mission>

<block id="01-test">
## TDDAB-1: Test Block

<intro>
Some intro text.
</intro>

<red>
- test: something works
</red>

<success>
- [ ] it works
</success>
</block>`;
      const result = parseTddabPlan(md, 'test.md');
      expect(result.valid).toBe(true);
      expect(result.plan?.mission).toBe('Line one.\nLine two.\nLine three.');
    });

    it('should handle multi-line intro, red, and success tags', () => {
      const md = `<mission>Context</mission>

<block id="01-multi">
## TDDAB-1: Multi-line Content

<intro>
First line of intro.
Second line of intro.
Third line of intro.
</intro>

<red>
- test: first test behavior
- test: second test behavior
- test: third test behavior
</red>

<success>
- [ ] first criterion
- [ ] second criterion
- [ ] third criterion
</success>
</block>`;
      const result = parseTddabPlan(md, 'test.md');
      expect(result.valid).toBe(true);
      expect(result.plan?.blocks[0].intro).toContain('First line of intro');
      expect(result.plan?.blocks[0].intro).toContain('Third line of intro');
      expect(result.plan?.blocks[0].redTests).toHaveLength(3);
      expect(result.plan?.blocks[0].success).toHaveLength(3);
    });
  });

  describe('validation errors', () => {
    it('should return valid=false with error on missing mission tag', () => {
      const md = `<block id="01-test">
## TDDAB-1: Test
<intro>intro</intro>
<red>
- test: x
</red>
<success>
- [ ] y
</success>
</block>`;
      const result = parseTddabPlan(md, 'test.md');
      expect(result.valid).toBe(false);
      expect(result.plan).toBeNull();
      expect(result.errors).toContainEqual(
        expect.objectContaining({ message: expect.stringContaining('mission') })
      );
    });

    it('should return valid=false with error on empty mission tag', () => {
      const md = `<mission>
</mission>

<block id="01-test">
## TDDAB-1: Test
<intro>intro</intro>
<red>
- test: x
</red>
<success>
- [ ] y
</success>
</block>`;
      const result = parseTddabPlan(md, 'test.md');
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ message: expect.stringContaining('empty') })
      );
    });

    it('should return valid=false with error on duplicate block ids', () => {
      const md = `<mission>Context</mission>

<block id="01-test">
## TDDAB-1: Test
<intro>intro</intro>
<red>
- test: x
</red>
<success>
- [ ] y
</success>
</block>

<block id="01-test">
## TDDAB-2: Duplicate
<intro>intro</intro>
<red>
- test: z
</red>
<success>
- [ ] w
</success>
</block>`;
      const result = parseTddabPlan(md, 'test.md');
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ message: expect.stringContaining('Duplicate') })
      );
    });

    it('should return valid=false on missing intro tag inside block', () => {
      const md = `<mission>Context</mission>

<block id="01-test">
## TDDAB-1: Test
<red>
- test: x
</red>
<success>
- [ ] y
</success>
</block>`;
      const result = parseTddabPlan(md, 'test.md');
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ message: expect.stringContaining('intro') })
      );
    });

    it('should return valid=false on missing red tag inside block', () => {
      const md = `<mission>Context</mission>

<block id="01-test">
## TDDAB-1: Test
<intro>intro</intro>
<success>
- [ ] y
</success>
</block>`;
      const result = parseTddabPlan(md, 'test.md');
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ message: expect.stringContaining('red') })
      );
    });

    it('should return valid=false on missing success tag inside block', () => {
      const md = `<mission>Context</mission>

<block id="01-test">
## TDDAB-1: Test
<intro>intro</intro>
<red>
- test: x
</red>
</block>`;
      const result = parseTddabPlan(md, 'test.md');
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ message: expect.stringContaining('success') })
      );
    });

    it('should return valid=false when plan has zero blocks', () => {
      const md = `<mission>Context here</mission>`;
      const result = parseTddabPlan(md, 'test.md');
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ message: expect.stringContaining('block') })
      );
    });

    it('should reject invalid block id format', () => {
      const md = `<mission>Context</mission>

<block id="invalid-no-number">
## TDDAB-1: Test
<intro>intro</intro>
<red>
- test: x
</red>
<success>
- [ ] y
</success>
</block>`;
      const result = parseTddabPlan(md, 'test.md');
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ message: expect.stringContaining('NN-kebab-case') })
      );
    });

    it('should reject block id with uppercase letters', () => {
      const md = `<mission>Context</mission>

<block id="01-MyBlock">
## TDDAB-1: Test
<intro>intro</intro>
<red>
- test: x
</red>
<success>
- [ ] y
</success>
</block>`;
      const result = parseTddabPlan(md, 'test.md');
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ message: expect.stringContaining('NN-kebab-case') })
      );
    });
  });

  describe('requireMission option', () => {
    const blocksOnly = `<block id="01-test">
## TDDAB-1: Test
<intro>intro text</intro>
<red>
- test: something works
</red>
<success>
- [ ] it works
</success>
</block>`;

    it('should return valid:true with empty mission when requireMission is false', () => {
      const result = parseTddabPlan(blocksOnly, 'sub.md', { requireMission: false });
      expect(result.valid).toBe(true);
      expect(result.plan?.mission).toBe('');
      expect(result.plan?.blocks).toHaveLength(1);
      expect(result.plan?.blocks[0].id).toBe('01-test');
    });

    it('should return valid:false when requireMission is true (default) and no mission', () => {
      const result = parseTddabPlan(blocksOnly, 'sub.md');
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ message: expect.stringContaining('mission') })
      );
    });

    it('should return valid:false when requireMission is explicitly true and no mission', () => {
      const result = parseTddabPlan(blocksOnly, 'sub.md', { requireMission: true });
      expect(result.valid).toBe(false);
    });

    it('should parse blocks correctly when requireMission is false', () => {
      const result = parseTddabPlan(blocksOnly, 'sub.md', { requireMission: false });
      expect(result.valid).toBe(true);
      expect(result.plan?.blocks[0].intro).toContain('intro text');
      expect(result.plan?.blocks[0].redTests).toEqual(['something works']);
      expect(result.plan?.blocks[0].success).toEqual(['it works']);
    });
  });

  describe('actions tag (step plans)', () => {
    it('should parse actions tag with action lines', () => {
      const md = `<mission>Cleanup context</mission>

<block id="01-cleanup">
## TDDAB-1: Remove Legacy Config

<intro>
Remove v1 config entries.
</intro>

<actions>
- action: Remove v1 entries from .env
- action: Clean v1 refs from config
</actions>

<success>
- [ ] no v1 references in config
</success>
</block>`;
      const result = parseTddabPlan(md, 'step.md');
      expect(result.valid).toBe(true);
      expect(result.plan?.blocks[0].isAction).toBe(true);
      expect(result.plan?.blocks[0].redTests).toEqual([
        'Remove v1 entries from .env',
        'Clean v1 refs from config',
      ]);
    });

    it('should set isAction false for red tag with test lines', () => {
      const result = parseTddabPlan(validPlan, 'test.md');
      expect(result.plan?.blocks[0].isAction).toBe(false);
    });

    it('should error when block has neither red nor actions tag', () => {
      const md = `<mission>Context</mission>

<block id="01-missing">
## TDDAB-1: Missing
<intro>intro</intro>
<success>
- [ ] done
</success>
</block>`;
      const result = parseTddabPlan(md, 'test.md');
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ message: expect.stringContaining('<actions>') })
      );
    });
  });

  describe('strict red validation (issue #10)', () => {
    function planWithRedLines(redLines: string[]): string {
      return `<mission>Context for strict red tests. TypeScript project.</mission>

<block id="01-strict">
## TDDAB-1: Strict Red

<intro>
Testing strict red validation.
</intro>

<red>
${redLines.join('\n')}
</red>

<success>
- [ ] it works
</success>
</block>`;
    }

    it('should reject red line with tag before colon', () => {
      const md = planWithRedLines(['- test: ok line', '- test @local-only: dropped line']);
      const result = parseTddabPlan(md, 'plan.md');
      const expectedLine =
        md.split('\n').findIndex(l => l.trim() === '- test @local-only: dropped line') + 1;
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].line).toBe(expectedLine);
      expect(result.errors[0].message).toContain('01-strict');
      expect(result.errors[0].message).toContain('unparseable line in red');
      expect(result.errors[0].message).toContain(String(expectedLine));
      expect(result.errors[0].message).toContain('- test @local-only: dropped line');
    });

    it('should reject a prose line inside red', () => {
      const md = planWithRedLines(['- test: ok line', 'these cover the auth flows']);
      const result = parseTddabPlan(md, 'plan.md');
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('unparseable line in red');
      expect(result.errors[0].message).toContain('these cover the auth flows');
    });

    it('should allow blank and whitespace-only lines between valid tests', () => {
      const md = planWithRedLines(['- test: first', '', '   ', '- test: second']);
      const result = parseTddabPlan(md, 'plan.md');
      expect(result.valid).toBe(true);
      expect(result.plan?.blocks[0].redTests).toEqual(['first', 'second']);
    });

    it('should report exactly three errors for three malformed lines among six valid (issue #10 repro)', () => {
      const md = planWithRedLines([
        '- test: valid one',
        '- test @local-only: bad one',
        '- test: valid two',
        'a prose line describing coverage',
        '- test: valid three',
        '- test: valid four',
        '- test @manual: bad two',
        '- test: valid five',
        '- test: valid six',
      ]);
      const result = parseTddabPlan(md, 'plan.md');
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors.every(e => e.message.includes('unparseable line in red'))).toBe(true);
    });

    it('should parse a tag written after the colon as a normal test line', () => {
      const md = planWithRedLines(['- test: register happy @local-only — details']);
      const result = parseTddabPlan(md, 'plan.md');
      expect(result.valid).toBe(true);
      expect(result.plan?.blocks[0].redTests).toEqual([
        'register happy @local-only — details',
      ]);
    });

    it('should keep a fully valid existing-style plan valid with unchanged redTests', () => {
      const result = parseTddabPlan(validPlan, 'test-plan.md');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.plan?.blocks[0].redTests).toEqual([
        'greet("World") returns "Hello, World!"',
        'greet("") returns "Hello, !"',
      ]);
    });

    it('should report both a malformed red line and a missing success tag', () => {
      const md = `<mission>Context</mission>

<block id="01-strict">
## TDDAB-1: Strict Red
<intro>intro</intro>
<red>
- test: ok line
these cover the auth flows
</red>
</block>`;
      const result = parseTddabPlan(md, 'plan.md');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('unparseable line in red'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('success'))).toBe(true);
    });
  });

  describe('parseFilesTag', () => {
    it('should extract filenames from files tag', () => {
      const md = `<mission>Context</mission>\n\n<files>\n- 01-models.md\n- 02-services.md\n</files>`;
      expect(parseFilesTag(md)).toEqual(['01-models.md', '02-services.md']);
    });

    it('should return empty array if no files tag', () => {
      const md = `<mission>Context</mission>\n\n<block id="01-test">stuff</block>`;
      expect(parseFilesTag(md)).toEqual([]);
    });

    it('should trim whitespace from filenames', () => {
      const md = `<files>\n-   01-models.md   \n-  02-services.md  \n</files>`;
      expect(parseFilesTag(md)).toEqual(['01-models.md', '02-services.md']);
    });

    it('should ignore empty lines inside files tag', () => {
      const md = `<files>\n- 01-models.md\n\n\n- 02-services.md\n</files>`;
      expect(parseFilesTag(md)).toEqual(['01-models.md', '02-services.md']);
    });
  });
});
