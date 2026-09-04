import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useCSSVariable } from 'uniwind';
import { AppText } from '@/src/components/shared/app-text';
import { useFitFontSize } from '@/src/features/quotes/use-fit-font-size';

/** the body box is a fraction of the screen, not a literal 300 (SE 233, 17 Pro 306) */
const BODY_BOX_RATIO = 0.35;
const LINE_HEIGHT_RATIO = 1.5;

/**
 * The poster's body: a title plate over a fit-to-fill quote in a fixed box.
 *
 * The box height never depends on the text — a short quote grows to fill it and
 * a long one shrinks — so the poster is the same object at every quote length.
 * A titleless quote omits the plate and nothing else moves.
 */
export function PosterBody({ title, body }: { title?: string; body: string }) {
  const { height } = useWindowDimensions();
  const boxHeight = Math.round(height * BODY_BOX_RATIO);
  const shadow = useCSSVariable('--color-poster-shadow') as string;
  const fit = useFitFontSize(body);

  const bodyType = {
    fontSize: fit.fontSize,
    lineHeight: Math.round(fit.fontSize * LINE_HEIGHT_RATIO),
  };

  return (
    <View>
      {title ? (
        <View
          className="rounded-xl bg-poster-plate p-3"
          style={[styles.plate, { shadowColor: shadow }]}
        >
          <AppText
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            className="text-center font-poster-display text-[27px] tracking-[1.6px] text-poster-ink"
          >
            {title.toUpperCase()}
          </AppText>
        </View>
      ) : null}

      <View
        onLayout={fit.onBoxLayout}
        style={{ height: boxHeight }}
        className={title ? 'mt-4 overflow-hidden' : 'overflow-hidden'}
      >
        <AppText
          allowFontScaling
          className="font-poster-body text-poster-ink-soft"
          style={[bodyType, fit.settled ? null : styles.searching]}
        >
          {body}
        </AppText>
        {/* Unclipped twin: the visible Text is height-capped, so its own
            onTextLayout only ever reports the lines that already fit and the
            search settles at the ceiling with the text overflowing. Remounted
            per candidate so onTextLayout re-fires. */}
        {fit.settled ? null : (
          <AppText
            key={fit.measureKey}
            className="font-poster-body"
            onTextLayout={fit.onTextLayout}
            style={[styles.twin, { fontSize: fit.fontSize, lineHeight: bodyType.lineHeight }]}
          >
            {body}
          </AppText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  twin: { position: 'absolute', left: 0, right: 0, top: 0, opacity: 0 },
  /* the first candidate is the ceiling — don't paint it clipped before it settles */
  searching: { opacity: 0 },
});
