const { withUniwindConfig } = require('uniwind/metro');
const {
  getSentryExpoConfig
} = require("@sentry/react-native/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getSentryExpoConfig(__dirname);

module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',

  // Register custom themes here so Uniwind can resolve them at build time.
  // When adding a new theme:
  //   1. Create a CSS file in src/themes/ with @variant <name>-light and @variant <name>-dark
  //   2. Import it in src/global.css
  //   3. Add both variant names to this array
  //   4. Add the variant names to ThemeName in src/context/app-theme-context.tsx
  extraThemes: [
    'quiet-light',
    'quiet-dark',
    'reverie-light',
    'reverie-dark',
    'human-light',
    'human-dark',
    'nightly-light',
    'nightly-dark',
  ],
});