export type FrameStep = {
  id: string;
  action: string;
  detail: string;
};

export const FRAME_STEPS: FrameStep[] = [
  {
    id: 'share',
    action: 'You share',
    detail: "whatever's on your mind, raw, unfiltered",
  },
  {
    id: 'reflect',
    action: 'It reflects',
    detail: 'gently, without judgment or advice',
  },
  {
    id: 'clarity',
    action: 'You understand it',
    detail: 'a quiet mirror for your own thoughts',
  },
  {
    id: 'humanity',
    action: 'Not alone',
    detail: 'others have felt this too',
  },
];
