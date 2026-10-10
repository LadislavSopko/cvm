// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025-2026 Ladislav Sopko

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig, Config } from './config.js';
import { resolve } from 'path';

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.CVM_STORAGE_TYPE;
    delete process.env.CVM_DATA_DIR;
    delete process.env.CVM_LOG_LEVEL;
    delete process.env.CVM_SANDBOX_PATHS;
    delete process.env.CVM_SANDBOX_ROOT;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('loadConfig reads CVM_DATA_DIR and CVM_SANDBOX_PATHS into dataDir and sandboxPaths with defaults .cvm and the working directory', () => {
    const defaults = loadConfig();
    expect(defaults.dataDir).toBe('.cvm');
    expect(defaults.sandboxPaths).toEqual([process.cwd()]);

    process.env.CVM_DATA_DIR = '/tmp/cvm-data';
    process.env.CVM_SANDBOX_PATHS = 'a, /tmp/b';
    const config = loadConfig();
    expect(config.dataDir).toBe('/tmp/cvm-data');
    expect(config.sandboxPaths).toEqual([resolve('a'), '/tmp/b']);
  });

  it('defaults storage.type to file when CVM_STORAGE_TYPE is unset', () => {
    const config = loadConfig();
    expect(config.storage.type).toBe('file');
  });

  it('uses CVM_DATA_DIR and has no mongoUri key', () => {
    process.env.CVM_STORAGE_TYPE = 'file';
    process.env.CVM_DATA_DIR = '/tmp/x';
    const config = loadConfig();
    expect(config.dataDir).toBe('/tmp/x');
    expect(config.storage).not.toHaveProperty('mongoUri');
  });

  it('throws for an invalid CVM_LOG_LEVEL mentioning valid levels', () => {
    process.env.CVM_LOG_LEVEL = 'bogus';
    expect(() => loadConfig()).toThrow(/trace.*debug.*info.*warn.*error/i);
  });

  it('Config.storage type has no mongoUri member', () => {
    const storage: Config['storage'] = { type: 'file' };
    expect(storage).not.toHaveProperty('mongoUri');
  });
});
