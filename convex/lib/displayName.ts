const NAMES = [
  'Wren', 'River', 'Sage', 'Cedar', 'Vale', 'Fern', 'Lumen', 'Mist',
  'Dusk', 'Ash', 'Reed', 'Birch', 'Lyra', 'Haze', 'Cloud', 'Stone',
  'Cove', 'Flint', 'Glen', 'Sable', 'Haven', 'Soleil', 'Briar', 'Crest',
];

export function generateDisplayName(): string {
  return NAMES[Math.floor(Math.random() * NAMES.length)];
}
