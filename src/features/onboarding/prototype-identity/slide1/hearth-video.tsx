/**
 * PROTOTYPE — throwaway. Ticket #200, slide 1 lab.
 *
 * The real thing, in place of the Skia stand-in: a graded, seamlessly looping
 * fire behind the same layout numbers. The clip here is Pexels stock run
 * through `grade-fire.sh` — it is a DIRECTION TEST, not the shipping asset
 * (logs and ground are still visible, which the brief forbids).
 */
import { useVideoPlayer, VideoView } from 'expo-video';

export const HearthVideo = ({ width, height }: { width: number; height: number }) => {
  const player = useVideoPlayer(require('@/assets/videos/hearth-test.mp4'), (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <VideoView
      player={player}
      style={{ width, height }}
      contentFit="cover"
      nativeControls={false}
      pointerEvents="none"
    />
  );
};
