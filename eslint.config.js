import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';
import convexPlugin from "@convex-dev/eslint-plugin";

export default defineConfig([
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
