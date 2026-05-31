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
  // Note: jsx-no-new-function-as-prop, jsx-no-bind, jsx-no-new-object-as-prop, and
  // jsx-no-new-array-as-prop are all omitted — React Compiler (reactCompiler: true)
  // memoizes inline functions, objects, and arrays automatically via useMemoCache.
  // These rules predate React Compiler and are false positives in this codebase.
  {
    plugins: { 'react-perf': reactPerfPlugin, 'react-native': reactNativePlugin },
    rules: {
      'react-perf/jsx-no-new-object-as-prop': 'off',
      'react-perf/jsx-no-new-array-as-prop': 'off',
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
