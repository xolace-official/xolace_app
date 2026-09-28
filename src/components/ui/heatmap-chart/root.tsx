import { forwardRef, useMemo } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg from 'react-native-svg';
import { ChartAccessibilityData } from '@/src/components/ui/chart-accessibility';
import { cn } from '@/src/lib/cn';
import { DAYS_IN_WEEK, DEFAULT_AXIS_WIDTH } from './constants';
import { HeatmapContext, type HeatmapContextValue } from './context';
import { splitParts } from './parts';
import type { HeatmapChartProps } from './props';
import { useHeatmapModel } from './use-heatmap-model';

export const HeatmapChartRoot = forwardRef<View, HeatmapChartProps>(function HeatmapChartRoot(
  {
    className,
    data,
    layout = 'fluid',
    binSize = 12,
    gap = 3,
    cornerRadius = 2,
    weekStartDay = 0,
    rows = DAYS_IN_WEEK,
    levels,
    levelColors,
    color,
    emptyColor,
    levelOpacity,
    animationDuration = 900,
    inactiveOpacity = 1,
    onActiveCellChange,
    accessible,
    accessibilityLabel,
    accessibilityHint,
    accessibilityLabelForDatum,
    onAccessibilityDatumPress,
    children,
    ...props
  },
  ref
) {  const parts = useMemo(() => splitParts(children), [children]);
  // The y-axis is laid out beside the grid rather than over it, so its width
  // has to come out of the grid's before the cells are sized.
  const axisWidth = parts.y ? (parts.y.props.width ?? DEFAULT_AXIS_WIDTH) : 0;

  const {
    setWidth,
    grid,
    ramp,
    opacities,
    levelOf,
    cellAt,
    accessibilityCells,
    activeCell,
    setActiveCell,
    reveal,
  } = useHeatmapModel({
    data,
    layout,
    binSize,
    gap,
    rows,
    levels,
    levelColors,
    color,
    emptyColor,
    levelOpacity,
    animationDuration,
    onActiveCellChange,
    axisWidth,
  });

  const onLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    setWidth((current) => (Math.abs(current - next) < 1 ? current : next));
    props.onLayout?.(event);
  };

  const context = useMemo<HeatmapContextValue>(
    () => ({
      data,
      grid,
      ramp,
      opacities,
      levelOf,
      cellAt,
      cornerRadius,
      inactiveOpacity,
      weekStartDay,
      activeCell,
      setActiveCell,
    }),
    [
      data,
      grid,
      ramp,
      opacities,
      levelOf,
      cellAt,
      cornerRadius,
      inactiveOpacity,
      weekStartDay,
      activeCell,
      setActiveCell,
    ]
  );

  /*
   * One clip wiping left to right, rather than an animation per column. The
   * effect is the same — columns arriving in order — and it costs one animated
   * value instead of one per week, which for a year is fifty-two.
   */
  const revealStyle = useAnimatedStyle(() => ({ width: grid.width * reveal.get() }));

  return (
    <HeatmapContext.Provider value={context}>
      <View
        {...props}
        ref={ref}
        onLayout={onLayout}
        className={cn('w-full', className)}
      >
        {/* Above the axis gutter as well as the grid: the header is about the
            whole chart, so it starts at the chart's edge, not the grid's. */}
        {parts.header}

        <ChartAccessibilityData
          chart="Heatmap chart"
          data={accessibilityCells}
          disabled={accessible === false}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          accessibilityLabelForDatum={accessibilityLabelForDatum}
          onAccessibilityDatumPress={onAccessibilityDatumPress}
          valueOf={(cell) => [
            ['date', cell.date],
            ['column', cell.column],
            ['row', cell.row],
            ['count', cell.count],
          ]}
        />

        {parts.x ? (
          <View
            style={{ paddingLeft: axisWidth }}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {parts.x}
          </View>
        ) : null}

        <View
          className="flex-row"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {parts.y}
          <View style={{ width: grid.width, height: grid.height }}>
            {grid.width > 0 ? (
              <>
                {/*
                 * The reveal is a view that grows, not an SVG clip path.
                 *
                 * It used to be an animated `<Rect>` inside `<Defs>`, and on
                 * Android those animated props never reach the native clip, so
                 * the grid drew complete and the reveal did not play at all. A
                 * view with `overflow: 'hidden'` is clipped by the platform
                 * itself, which both platforms agree on.
                 *
                 * Animating `width` is normally a layout pass per frame. This
                 * view is absolutely positioned and its only child is an
                 * `<Svg>` with an explicit width and height, so it is one node
                 * and nothing around it moves.
                 */}
                <Animated.View
                  pointerEvents="none"
                  style={[styles.revealClip, revealStyle]}
                >
                  <Svg width={grid.width} height={grid.height}>
                    {parts.rules}
                    {parts.cells}
                  </Svg>
                </Animated.View>
                {parts.tooltip}
              </>
            ) : null}
          </View>
        </View>

        {parts.legend}
      </View>
    </HeatmapContext.Provider>
  );
});

const styles = StyleSheet.create({
  revealClip: { position: 'absolute', top: 0, bottom: 0, left: 0, overflow: 'hidden' },
});
