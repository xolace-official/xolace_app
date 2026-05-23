import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';
import convexPlugin from "@convex-dev/eslint-plugin";
import reactPerfPlugin from 'eslint-plugin-react-perf';
import reactNativePlugin from 'eslint-plugin-react-native';

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
  // Performance sweep rules
  // Note: jsx-no-new-function-as-prop and jsx-no-bind are omitted — React Compiler
  // (reactCompiler: true) memoizes inline functions automatically via useMemoCache.
  {
    plugins: { 'react-perf': reactPerfPlugin, 'react-native': reactNativePlugin },
    rules: {
      'react-perf/jsx-no-new-object-as-prop': 'warn',
      'react-perf/jsx-no-new-array-as-prop': 'warn',
      'react-perf/jsx-no-jsx-as-prop': 'warn',
      'react/no-array-index-key': 'warn',
      'react/jsx-no-constructed-context-values': 'warn',
      'react/no-unstable-nested-components': 'warn',
      'react/no-object-type-as-default-prop': 'warn',
      'react-native/no-inline-styles': 'warn',
      'react-native/no-unused-styles': 'warn',
      'react-native/no-color-literals': 'warn',
      'react-native/no-single-element-style-arrays': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'no-empty': ['warn', { allowEmptyCatch: false }],
    },
  },
]);
