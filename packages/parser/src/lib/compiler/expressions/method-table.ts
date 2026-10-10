// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025-2026 Ladislav Sopko

import { OpCode } from '../../bytecode.js';

export type ArgDefault = { push: string | number } | 'undefined';

export interface MethodSpec {
  op: OpCode;
  args: ArgDefault[];
  required?: number;
  requiredMessage?: string;
}

const u = 'undefined' as const;
const zero = { push: 0 };
const empty = { push: '' };

export const METHODS: Record<string, MethodSpec> = {
  substring: { op: OpCode.STRING_SUBSTRING, args: [zero, u] },
  indexOf: { op: OpCode.STRING_INDEXOF, args: [empty] },
  split: { op: OpCode.STRING_SPLIT, args: [empty] },
  slice: { op: OpCode.STRING_SLICE, args: [zero, u] },
  join: { op: OpCode.ARRAY_JOIN, args: [{ push: ',' }] },
  charAt: { op: OpCode.STRING_CHARAT, args: [zero] },
  toUpperCase: { op: OpCode.STRING_TOUPPERCASE, args: [] },
  toLowerCase: { op: OpCode.STRING_TOLOWERCASE, args: [] },
  toString: { op: OpCode.TO_STRING, args: [] },
  includes: { op: OpCode.STRING_INCLUDES, args: [empty] },
  endsWith: { op: OpCode.STRING_ENDS_WITH, args: [empty] },
  startsWith: { op: OpCode.STRING_STARTS_WITH, args: [empty] },
  trim: { op: OpCode.STRING_TRIM, args: [] },
  trimStart: { op: OpCode.STRING_TRIM_START, args: [] },
  trimEnd: { op: OpCode.STRING_TRIM_END, args: [] },
  test: { op: OpCode.REGEX_TEST, args: [empty] },
  match: { op: OpCode.STRING_MATCH, args: [u], required: 1, requiredMessage: 'match() requires a regex argument' },
  replace: { op: OpCode.STRING_REPLACE_REGEX, args: [empty, empty] },
  replaceAll: { op: OpCode.STRING_REPLACE_ALL, args: [empty, empty] },
  lastIndexOf: { op: OpCode.STRING_LAST_INDEX_OF, args: [empty] },
  repeat: { op: OpCode.STRING_REPEAT, args: [zero] },
  padStart: { op: OpCode.STRING_PAD_START, args: [zero, { push: ' ' }] },
  padEnd: { op: OpCode.STRING_PAD_END, args: [zero, { push: ' ' }] },
  push: { op: OpCode.ARRAY_PUSH, args: [u] }
};
