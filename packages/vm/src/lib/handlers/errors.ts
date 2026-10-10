// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025-2026 Ladislav Sopko

import { Instruction } from '@cvm/parser';
import { VMState } from '../vm.js';
import { VMError } from './types.js';

export function runtimeError(state: VMState, instruction: Instruction, message: string): VMError {
  return { type: 'RuntimeError', message, pc: state.pc, opcode: instruction.op };
}
