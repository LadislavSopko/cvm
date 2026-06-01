// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025-2026 Ladislav Sopko

// Re-export all visitor types and registries
export * from './visitor-types.js';
export { statementVisitors } from './statements/index.js';
export { expressionVisitors } from './expressions/index.js';