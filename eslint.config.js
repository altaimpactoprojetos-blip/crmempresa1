'use strict';
const js = require('@eslint/js');
const globals = require('globals');
const prettier = require('eslint-config-prettier');

const rules = {
  'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
  eqeqeq: ['error', 'always', { null: 'ignore' }],
  'prefer-const': 'error',
  'no-var': 'error',
};

module.exports = [
  { ignores: ['node_modules/', 'backups/'] },
  js.configs.recommended,
  {
    // Backend, scripts e testes (Node.js, CommonJS)
    files: ['src/**/*.js', 'scripts/**/*.js', 'tests/**/*.js', '*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals: globals.node },
    rules,
  },
  {
    // Frontend: scripts clássicos carregados em ordem pelo index.html, compartilhando globais.
    files: ['public/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.browser, CRM: 'writable', UI: 'writable', api: 'writable', ApiError: 'writable' },
    },
    rules: {
      ...rules,
      // Cada script declara um global compartilhado (api, UI, CRM) usado pelos demais.
      'no-redeclare': ['error', { builtinGlobals: false }],
      'no-unused-vars': ['error', { vars: 'local', argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    },
  },
  prettier,
];
