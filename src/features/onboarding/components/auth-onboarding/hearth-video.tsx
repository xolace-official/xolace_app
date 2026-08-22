/**
 * The fire behind the whole deck: a graded, seamlessly looping clip.
 *
 * PLACEHOLDER ASSET: `hearth-test.mp4` is Pexels stock run through
 * `grade-fire.sh`, kept from the #200 direction test. Swap it (and its poster)
 * for the real graded clip when it lands — nothing else here changes.
 *
 * The load gap: `useVideoPlayer` decodes asynchronously, so for ~200-600ms
 * `VideoView` is a black rectangle. Fix is the oldest one in video: a poster
 * (literally frame 0 of this clip, so the swap is invisible) sits underneath,
 * and the video crossfades in once the player reports `readyToPlay`.
 *
 * Backgrounding pauses the player and it does not resume on its own, so an app
 * that was left in recents comes back to a frozen frame. Hence the AppState
 * listener.
 */
import { useEffect } from 'react';
import { AppState } from 'react-native';

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

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && !player.playing) player.play();
    });
    return () => sub.remove();
  }, [player]);

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
          // Leave `surfaceType` at its default `surfaceView`. `textureView`
          // looks like the fix for a video under an animated, blended parent,
          // but on the API 35 emulator it renders NOTHING at all — verified by
          // toggling it alone against a healthy player. SurfaceView composites
          // this deck's opacity, transform and `screen` blend correctly.
        />
      </Animated.View>
    </>
  );
};
