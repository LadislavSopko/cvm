// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025-2026 Ladislav Sopko

import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve, join } from 'path';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/cvm-server',

  plugins: [
    nxViteTsPaths(),
    viteStaticCopy({
      targets: [
        {
          src: join(__dirname, 'package.json'),
          dest: '.',
        },
        {
          src: join(__dirname, 'README.md'),
          dest: '.',
        },
        {
          src: join(__dirname, 'LICENSE'),
          dest: '.',
        },
        {
          src: join(__dirname, 'bin/*'),
          dest: 'bin',
        },
        {
          src: join(__dirname, '../../test/programs/tddab/planexecutor.ts'),
          dest: 'programs',
        },
      ],
    }),
  ],

  build: {
    target: 'node18',
    ssr: true,
    outDir: '../../apps/cvm-server/dist',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      name: 'cvm-server',
      fileName: 'main',
      formats: ['cjs'],
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      // Third-party dependencies are automatically externalized by @nx/vite:build
      external: [
        '@modelcontextprotocol/sdk',
        'zod',
        'mongodb',
        'dotenv',
        'typescript',
        'fs',
        'path',
        'os'
      ]
    },
  },
});