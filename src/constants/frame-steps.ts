export type FrameStep = {
  id: string;
  action: string;
  detail: string;
};

export const FRAME_STEPS: FrameStep[] = [
  {
    id: 'share',
    action: 'You share',
    detail: "whatever's on your mind — raw, unfiltered",
  },
  {
    id: 'reflect',
    action: 'AI reflects',
    detail: 'gently, without judgment or advice',
  },
  {
    id: 'clarity',
    action: 'Just clarity',
    detail: 'a quiet mirror for your own thoughts',
  },
];
