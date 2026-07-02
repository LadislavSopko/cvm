// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025-2026 Ladislav Sopko

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig, Config } from './config.js';

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.CVM_STORAGE_TYPE;
    delete process.env.CVM_DATA_DIR;
    delete process.env.CVM_LOG_LEVEL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('defaults storage.type to file when CVM_STORAGE_TYPE is unset', () => {
    const config = loadConfig();
    expect(config.storage.type).toBe('file');
  });

  it('uses CVM_DATA_DIR and has no mongoUri key', () => {
    process.env.CVM_STORAGE_TYPE = 'file';
    process.env.CVM_DATA_DIR = '/tmp/x';
    const config = loadConfig();
    expect(config.storage.dataDir).toBe('/tmp/x');
    expect(config.storage).not.toHaveProperty('mongoUri');
  });

  it('throws for an invalid CVM_LOG_LEVEL mentioning valid levels', () => {
    process.env.CVM_LOG_LEVEL = 'bogus';
    expect(() => loadConfig()).toThrow(/trace.*debug.*info.*warn.*error/i);
  });

  it('Config.storage type has no mongoUri member', () => {
    const storage: Config['storage'] = { type: 'file', dataDir: '/tmp' };
    expect(storage).not.toHaveProperty('mongoUri');
  });
});
