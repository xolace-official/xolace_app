export interface TimelineEntry {
  id: string;
  userText: string;
  mirrorText: string;
  emotion: string;
  emotionEmoji: string;
  responseType: string;
  timestamp: Date;
}

export type TimelineFlatItem =
  | { type: "section"; id: string; label: string }
  | { type: "entry"; id: string; entry: TimelineEntry };
