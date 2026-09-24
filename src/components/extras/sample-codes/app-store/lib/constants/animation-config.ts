// app-store-header-animation 🔽

export const APP_STORE_CONSTANTS = {
  // Height of the large title text in header. Used to align fade/translation math around typography.
  APP_TITLE_HEIGHT: 24,
  // ScrollY where main app hero begins to fade out. Tuned to finish before header controls fade in.
  CONTENT_DISAPPEAR_OFFSET: 120,
  // Start adding header background at very top to avoid a hard cut when nudging the list.
  BLUR_START_OFFSET: 4,
  // Full opacity/blur achieved quickly for crisp App Store feel without long fade tails.
  BLUR_END_OFFSET: 20,
} as const;

// app-store-header-animation 🔼
