const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    ignores: ['.expo/*', 'coverage/*', 'dist/*'],
  },
  {
    files: ['**/*.test.{ts,tsx}', 'jest.setup.js'],
    languageOptions: {
      globals: {
        beforeEach: 'readonly',
        describe: 'readonly',
        expect: 'readonly',
        it: 'readonly',
        jest: 'readonly',
        require: 'readonly',
      },
    },
  },
]);
