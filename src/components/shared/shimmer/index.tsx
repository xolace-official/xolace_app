import React, { createContext, useContext, useCallback } from 'react';
import { View, type LayoutChangeEvent, StyleSheet } from 'react-native';
import Animated, {
  useDerivedValue,
  useSharedValue,
  useAnimatedReaction,
} from 'react-native-reanimated';
import MaskedView from '@react-native-masked-view/masked-view';
import type {
  ShimmerContextValue,
  ShimmerProps,
  ShimmerOverlayProps,
  ShimmerMaskProps,
} from './types';
import { styles } from './styles';
import { useShimmerAnimation } from './use-shimmer-animation';
import { useTrackDistance } from './use-track-distance';

const ShimmerContext = createContext<ShimmerContextValue | null>(null);

const useShimmer = (): ShimmerContextValue => {
  const ctx = useContext(ShimmerContext);
  if (!ctx) throw new Error('useShimmer must be used within Shimmer');
  return ctx;
};

// ── Root ────────────────────────────────────────────────────────────────

const ShimmerRoot = React.forwardRef<View, ShimmerProps>(
  ({ debug = false, children, style, onLayout, ...props }, ref) => {
    const containerWidth = useSharedValue(0);
    const containerHeight = useSharedValue(0);

    const containerDiagonal = useDerivedValue(() => {
      const w = containerWidth.get();
      const h = containerHeight.get();
      return w > 0 && h > 0 ? Math.sqrt(w * w + h * h) : 0;
    });

    const handleLayout = useCallback(
      (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        containerWidth.set(width);
        containerHeight.set(height);
        onLayout?.(e);
      },
      [containerWidth, containerHeight, onLayout],
    );

    return (
      <ShimmerContext value={{ containerWidth, containerHeight, containerDiagonal, debug }}>
        <View
          ref={ref}
          style={[styles.container, style, debug && styles.containerDebug]}
          onLayout={handleLayout}
          {...props}
        >
          {children}
        </View>
      </ShimmerContext>
    );
  },
);

ShimmerRoot.displayName = 'Shimmer';

// ── Overlay ─────────────────────────────────────────────────────────────

const ShimmerOverlay = React.forwardRef<Animated.View, ShimmerOverlayProps>(
  (
    {
      children,
      width,
      trackAngle = 0,
      overlayAngle = 0,
      duration,
      initialDelay,
      repeatDelay,
      animation,
      progress: externalProgress,
      onProgress,
    },
    ref,
  ) => {
    const { containerWidth, containerHeight, debug } = useShimmer();

    const overlayWidth = useDerivedValue(() => {
      if (typeof width === 'number') return width;
      return (containerWidth.get() * parseFloat(width)) / 100;
    });

    const internalProgress = useSharedValue(0);
    const activeProgress = externalProgress ?? internalProgress;

    const trackDistance = useTrackDistance({ containerWidth, containerHeight, trackAngle });

    const { animatedStyle, rotateContainerHeight } = useShimmerAnimation({
      trackAngle,
      overlayAngle,
      containerWidth,
      containerHeight,
      overlayWidth,
      trackDistance,
      progress: activeProgress,
      duration,
      initialDelay,
      repeatDelay,
      animation,
      autoPlay: externalProgress === undefined,
    });

    useAnimatedReaction(
      () => activeProgress.get(),
      (v) => { if (onProgress) onProgress.set(v); },
    );

    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ rotate: `${trackAngle}deg` }],
          },
        ]}
        pointerEvents="none"
      >
        <Animated.View style={[{ width: trackDistance }, debug && styles.trackDebug]}>
          <Animated.View
            ref={ref}
            style={[styles.translateContainer, animatedStyle, debug && styles.overlayDebug]}
          >
            <Animated.View
              style={[
                styles.rotateContainer,
                { width: overlayWidth, height: rotateContainerHeight },
                { transform: [{ rotate: `${overlayAngle}deg` }] },
              ]}
            >
              {children}
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </View>
    );
  },
);

ShimmerOverlay.displayName = 'Shimmer.Overlay';

// ── Mask ────────────────────────────────────────────────────────────────

const ShimmerMask = ({ children, overlay, background }: ShimmerMaskProps) => {
  const { debug } = useShimmer();

  return (
    <>
      <MaskedView maskElement={children}>
        <View
          style={styles.maskSizer}
          pointerEvents="none"
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {children}
        </View>
        {background !== undefined && <View style={StyleSheet.absoluteFill}>{background}</View>}
        {!debug && overlay}
      </MaskedView>
      {debug && overlay}
    </>
  );
};

ShimmerMask.displayName = 'Shimmer.Mask';

// ── Export ───────────────────────────────────────────────────────────────

const Shimmer = Object.assign(ShimmerRoot, {
  Overlay: ShimmerOverlay,
  Mask: ShimmerMask,
});

export default Shimmer;
