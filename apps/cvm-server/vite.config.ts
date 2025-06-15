// Copyright 2024 Ladislav Sopko
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
        'dotenv'
      ]
    },
  },
});