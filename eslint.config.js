/* eslint-env node */
import convexPlugin from "@convex-dev/eslint-plugin";
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');


module.exports = defineConfig([
  expoConfig,
  ...convexPlugin.configs.recommended,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      'react/display-name': 'off',
    },
  },
]);