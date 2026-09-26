import { describe, expect, it } from 'vitest';

import { prepareBody } from './reader-copy';

describe('prepareBody', () => {
  it('drops a leading h1 — the cover already carries the title', () => {
    expect(prepareBody('# What burnout is\n\nBody text.')).toBe('Body text.');
  });

  it('keeps an h1 that is not the first line', () => {
    expect(prepareBody('Intro.\n\n# Later')).toBe('Intro.\n\n# Later');
  });

  it('turns a GFM alert marker into a bold label on its own line inside the quote', () => {
    expect(prepareBody('> [!TIP]\n> Write it down.')).toBe('> **Tip**\n>\n> Write it down.');
    expect(prepareBody('>[!caution]\n> Careful.')).toBe('> **Caution**\n>\n> Careful.');
  });

  it('leaves ordinary blockquotes alone', () => {
    expect(prepareBody('> Just a quote.')).toBe('> Just a quote.');
  });
});
