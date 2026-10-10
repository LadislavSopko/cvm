// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025-2026 Ladislav Sopko

import { OpCode } from '@cvm/parser';
import { OpcodeHandler } from './types.js';
import { cvmToBoolean } from '@cvm/types';

export const logicalHandlers: Partial<Record<OpCode, OpcodeHandler>> = {
  [OpCode.AND]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state) => {
      const right = state.stack.pop()!;
      const left = state.stack.pop()!;
      
      // JavaScript short-circuit evaluation
      // If left is falsy, return left, otherwise return right
      const result = cvmToBoolean(left) ? right : left;
      state.stack.push(result);
      return undefined;
    }
  },

  [OpCode.OR]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state) => {
      const right = state.stack.pop()!;
      const left = state.stack.pop()!;
      
      // JavaScript short-circuit evaluation  
      // If left is truthy, return left, otherwise return right
      const result = cvmToBoolean(left) ? left : right;
      state.stack.push(result);
      return undefined;
    }
  },

  [OpCode.NOT]: {
    stackIn: 1,
    stackOut: 1,
    execute: (state) => {
      const value = state.stack.pop()!;
      
      const result = !cvmToBoolean(value);
      state.stack.push(result);
      return undefined;
    }
  }
};