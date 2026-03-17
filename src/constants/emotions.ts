const EMOTION_EMOJI: Record<string, string> = {
  anger: '😤',
  sadness: '😢',
  anxiety: '😰',
  joy: '😊',
  fear: '😨',
  disgust: '🤢',
  surprise: '😲',
  calm: '🟢',
  frustration: '😔',
  grief: '🥀',
  loneliness: '🫥',
  shame: '😶',
  hope: '🌱',
  relief: '😮‍💨',
  confusion: '🌀',
  numbness: '🧊',
  guilt: '😞',
  overwhelm: '🌊',
  contentment: '☀️',
  love: '💛',
};

export function getEmotionEmoji(emotion: string | null): string {
  console.log("emotion", emotion)
  if (!emotion) return '💭';
  return EMOTION_EMOJI[emotion.toLowerCase()] ?? '💭';
}

export function getEmotionLabel(emotion: string | null): string {
  if (!emotion) return 'Reflection';
  return emotion.charAt(0).toUpperCase() + emotion.slice(1);
}

const PATH_LABELS: Record<string, string> = {
  solo: 'Sat with this',
  peers: "You're not alone",
  exit: 'Just needed to say it',
};

export function getPathLabel(pathChosen: string | null): string {
  if (!pathChosen) return 'Reflected';
  return PATH_LABELS[pathChosen] ?? 'Reflected';
}
