import type { TimelineEntry } from '@/interfaces/timeline';

const now = new Date();
const daysAgo = (n: number) =>
  new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

// TODO: replace with real data from backend/store
export const MOCK_ENTRIES: TimelineEntry[] = [
  {
    id: '1',
    userText:
      'I just feel so heavy today like nothing I do matters and everyone around me is just going through the motions',
    mirrorText:
      "There's something heavy sitting in your chest today. Not sharp — more like a weight you've been carrying so long you forgot it wasn't always there.",
    emotion: 'Frustration',
    emotionEmoji: '😔',
    responseType: 'Just needed to say it',
    timestamp: daysAgo(0),
  },
  {
    id: '2',
    userText:
      "Today felt different. I wasn't chasing anything, just sitting with the quiet and actually feeling okay.",
    mirrorText: 'A quiet, steady day. Solid ground.',
    emotion: 'Calm',
    emotionEmoji: '🟢',
    responseType: 'Sat with this',
    timestamp: daysAgo(2),
  },
  {
    id: '3',
    userText:
      'I keep hoping things will change but they never really do. Same patterns, different day.',
    mirrorText:
      "A pattern you keep hoping will change. There's grief in watching something repeat itself — and still showing up anyway.",
    emotion: 'Frustration',
    emotionEmoji: '😤',
    responseType: "You're not alone",
    timestamp: daysAgo(5),
  },
];
