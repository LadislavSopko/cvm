import { describe, it, expect } from 'vitest';
import { DeleteConfirmations } from './delete-confirmation.js';

describe('DeleteConfirmations', () => {
  it('an issued token deletes the execution exactly once and a second use is rejected', () => {
    const confirmations = new DeleteConfirmations();
    const token = confirmations.issue('execution', 'exec-1');
    expect(confirmations.consume('execution', 'exec-1', token)).toBe(true);
    expect(confirmations.consume('execution', 'exec-1', token)).toBe(false);
  });

  it('a token issued for one execution id is rejected for another id', () => {
    const confirmations = new DeleteConfirmations();
    const token = confirmations.issue('execution', 'exec-1');
    expect(confirmations.consume('execution', 'exec-2', token)).toBe(false);
  });

  it('a token issued for delete_execution is rejected by delete_program for the same id', () => {
    const confirmations = new DeleteConfirmations();
    const token = confirmations.issue('execution', 'same-id');
    expect(confirmations.consume('program', 'same-id', token)).toBe(false);
  });

  it('a token older than 5 minutes is rejected', () => {
    let now = 1_000_000;
    const confirmations = new DeleteConfirmations(() => now);
    const token = confirmations.issue('execution', 'exec-1');
    now += 5 * 60 * 1000 + 1;
    expect(confirmations.consume('execution', 'exec-1', token)).toBe(false);
  });
});
