/**
 * PROTOTYPE — throwaway. Ticket #200, slide 1 lab.
 *
 * The real thing, in place of the Skia stand-in: a graded, seamlessly looping
 * fire behind the same layout numbers. The clip here is Pexels stock run
 * through `grade-fire.sh` — a DIRECTION TEST, not the shipping asset.
 *
 * The load gap: `useVideoPlayer` decodes asynchronously, so for ~200-600ms
 * `VideoView` is a black rectangle. Fix is the oldest one in video: a poster
 * (literally frame 0 of this clip, so the swap is invisible) sits underneath,
 * and the video crossfades in once the player reports `readyToPlay`.
 */
import { useEvent } from 'expo';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

export const HearthVideo = ({ width, height }: { width: number; height: number }) => {
  const player = useVideoPlayer(require('@/assets/videos/hearth-test.mp4'), (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const ready = status === 'readyToPlay';

  const fade = useAnimatedStyle(() => ({
    opacity: withTiming(ready ? 1 : 0, { duration: 420 }),
  }));

  return (
    <>
      <Image
        source={require('@/assets/videos/hearth-poster.jpg')}
        style={{ width, height }}
        contentFit="cover"
        pointerEvents="none"
      />
      <Animated.View style={[{ position: 'absolute', width, height }, fade]}>
        <VideoView
          player={player}
          style={{ width, height }}
          contentFit="cover"
          nativeControls={false}
          pointerEvents="none"
        />
      </Animated.View>
    </>
  );
};
