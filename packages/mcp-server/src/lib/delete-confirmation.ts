// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025-2026 Ladislav Sopko

import { randomUUID } from 'crypto';

export type DeleteKind = 'execution' | 'program';

export const DELETE_TOKEN_TTL_SECONDS = 300;

export class DeleteConfirmations {
  private readonly pending = new Map<string, { kind: DeleteKind; id: string; expiresAt: number }>();

  constructor(private readonly now: () => number = Date.now) {}

  issue(kind: DeleteKind, id: string): string {
    const token = randomUUID();
    this.pending.set(token, { kind, id, expiresAt: this.now() + DELETE_TOKEN_TTL_SECONDS * 1000 });
    return token;
  }

  consume(kind: DeleteKind, id: string, token: string): boolean {
    const entry = this.pending.get(token);
    if (!entry) return false;
    this.pending.delete(token);
    return entry.kind === kind && entry.id === id && entry.expiresAt > this.now();
  }
}
