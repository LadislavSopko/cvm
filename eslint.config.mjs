import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '.nx/**',
      'tmp/**',
      'test/programs/**',
      '.ai-agent/**',
      'wwwroot/**',
      'docs/**',
      'tasks/**',
      'apps/cvm-server/programs/**',
      '**/out-tsc/**',
      '**/test-output/**',
      '**/html/**',
      '**/coverage/**',
      '**/vite.config.*.timestamp*'
    ]
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: { require: 'readonly', module: 'writable', __dirname: 'readonly', process: 'readonly', console: 'readonly' } },
    rules: { '@typescript-eslint/no-require-imports': 'off' }
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-unreachable': 'error'
    }
  }
);
