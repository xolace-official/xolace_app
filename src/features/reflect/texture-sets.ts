export type TextureSetId = 'flat' | 'tender' | 'bright' | 'charged';

export const TEXTURE_SET_IDS: readonly TextureSetId[] = [
  'flat',
  'tender',
  'bright',
  'charged',
];

export const TEXTURE_SETS: Record<TextureSetId, readonly string[]> = {
  flat: ['heavy', 'tight', 'foggy', 'buzzing', 'empty', 'scattered', 'numb', 'raw'],
  tender: ['aching', 'hollow', 'longing', 'bereft', 'weeping inside', 'closing off', 'tender', 'heavy-hearted'],
  bright: ['warm', 'open', 'grateful', 'hopeful', 'full', 'glowing', 'clear', 'lifted'],
  charged: ['racing', 'bracing', 'on-edge', 'restless', 'wound up', 'grinding', 'spinning', 'pressed'],
};

export const TEXTURE_SET_LABELS: Record<TextureSetId, string> = {
  flat: 'Flat',
  tender: 'Tender',
  bright: 'Bright',
  charged: 'Charged',
};

export function resolveTextureSetId(value: unknown): TextureSetId {
  if (typeof value === 'string' && TEXTURE_SET_IDS.includes(value as TextureSetId)) {
    return value as TextureSetId;
  }
  return 'flat';
}
