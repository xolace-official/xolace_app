export type FrameStep = {
  id: string;
  action: string;
  detail: string;
};

export const STEP_BASE_DELAY = 800;
export const STEP_INTERVAL = 900;
export const STEP_DURATION = 800;

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
    action: "You choose what's next",
    detail: 'sit with it, see others, or simply go',
  },
  {
    id: 'humanity',
    action: 'Not alone',
    detail: 'others have felt this too',
  },
];
