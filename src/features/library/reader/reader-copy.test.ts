import { describe, expect, it } from 'vitest';

import { creditLine, metaLine, prepareBody } from './reader-copy';

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

describe('creditLine', () => {
  it('says how the source text was reused', () => {
    expect(creditLine('verbatim')).toBe('Published as they wrote it');
    expect(creditLine('adapted')).toBe('Adapted from their original');
    expect(creditLine('original')).toBe('Written for Lantern');
  });
});

describe('metaLine', () => {
  it('reads kind · time', () => {
    expect(metaLine('explainer', 6)).toBe('Explainer · 6 min read');
  });

  it('puts a story teller between kind and time', () => {
    expect(metaLine('story', 4, 'a first-year student, 19')).toBe('Story · a first-year student, 19 · 4 min read');
  });
});
