const js = require('@eslint/js');
const globals = require('globals');
const hooks = require('eslint-plugin-react-hooks');

module.exports = [
  { ignores: ['node_modules/**', 'android/**', '.expo/**', 'dist/**', 'coverage/**', 'eas-*/**', 'scripts/push-verification/**'] },
  {
    files: ['App.{js,jsx}', 'src/**/*.{js,jsx,cjs}', 'plugins/**/*.js', 'scripts/**/*.cjs', 'scripts/apply-native-patches.js', 'tests/**/*.cjs', '*.config.{js,cjs}', 'tailwind.config.js'],
    ...js.configs.recommended,
    plugins: { 'react-hooks': hooks },
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    languageOptions: {
      ecmaVersion: 'latest', sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node, __DEV__: 'readonly', global: 'readonly' },
    },
    rules: {
      // Legacy JS + automatic JSX runtime: unused imports are advisory cleanup,
      // not a reason to change working screens while introducing CI.
      'no-unused-vars': 'off',
      'react-hooks/rules-of-hooks': 'error',
    },
  },
  { files: ['**/*.cjs', '*.config.js', 'plugins/**/*.js', 'scripts/apply-native-patches.js'], languageOptions: { sourceType: 'commonjs' } },
  // The component harness invokes mocked hooks as ordinary test functions.
  { files: ['tests/**/*.cjs'], rules: { 'react-hooks/rules-of-hooks': 'off' } },
];
