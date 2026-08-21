/**
 * PROTOTYPE — throwaway. Ticket #200.
 *
 * Variant G's answer to "try real illustration instead of the glyph": one
 * small hand-drawn line scene per beat, reusing `react-native-svg` (already a
 * dependency) rather than a generated/sourced asset — a cheap concrete thing
 * to react to before committing to a real illustration brief. Deliberately
 * NOT the orb/ember mascot; each scene is specific to what its beat says.
 *
 * `proof` has no entry — that beat already shows a real artifact (ProofWell),
 * so it doesn't need a second illustration competing with it.
 */
import Svg, { Circle, Path } from 'react-native-svg';
import type { StoryBeat } from './story-slides';

type IllustrationProps = { color: string; size: number };

/** dusk — someone curled up, alone, a small flame still going at their feet. */
const Dusk = ({ color, size }: IllustrationProps) => (
  <Svg width={size} height={size} viewBox="0 0 160 160" fill="none">
    <Path
      d="M58 108 C50 96 50 80 62 70 C70 63 72 52 66 44"
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
    />
    <Path
      d="M58 108 C58 92 70 84 82 84 C96 84 104 96 102 110"
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
    />
    <Circle cx={66} cy={44} r={11} stroke={color} strokeWidth={2.4} />
    <Path
      d="M112 122 C108 114 116 108 114 100 C121 106 124 116 118 122 C116 125 113 125 112 122 Z"
      stroke={color}
      strokeWidth={2}
      strokeLinejoin="round"
    />
  </Svg>
);

/** vent — a voice going out into rings, the outer ones breaking into embers. */
const Vent = ({ color, size }: IllustrationProps) => (
  <Svg width={size} height={size} viewBox="0 0 160 160" fill="none">
    <Circle cx={80} cy={80} r={10} stroke={color} strokeWidth={2.4} />
    <Circle cx={80} cy={80} r={30} stroke={color} strokeWidth={1.6} opacity={0.75} />
    <Circle cx={80} cy={80} r={52} stroke={color} strokeWidth={1.2} opacity={0.5} strokeDasharray="1 10" strokeLinecap="round" />
    <Circle cx={30} cy={54} r={2.2} fill={color} opacity={0.6} />
    <Circle cx={132} cy={98} r={1.8} fill={color} opacity={0.5} />
    <Circle cx={112} cy={30} r={2} fill={color} opacity={0.5} />
    <Circle cx={40} cy={122} r={1.6} fill={color} opacity={0.45} />
  </Svg>
);

/** mirror — two arcs held apart, facing each other, a small spark between. */
const Mirror = ({ color, size }: IllustrationProps) => (
  <Svg width={size} height={size} viewBox="0 0 160 160" fill="none">
    <Path d="M56 30 C30 50 30 110 56 130" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    <Path d="M104 30 C130 50 130 110 104 130" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    <Path
      d="M80 72 C84 76 84 84 80 88 C76 84 76 76 80 72 Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
  </Svg>
);

/** xolacers — two people sitting a small distance apart, both facing the fire. */
const Xolacers = ({ color, size }: IllustrationProps) => (
  <Svg width={size} height={size} viewBox="0 0 160 160" fill="none">
    <Circle cx={56} cy={54} r={10} stroke={color} strokeWidth={2.2} />
    <Path d="M40 112 C40 92 50 80 56 80 C62 80 72 92 72 112" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    <Circle cx={106} cy={62} r={8} stroke={color} strokeWidth={2.2} opacity={0.75} />
    <Path
      d="M92 112 C92 94 100 84 106 84 C112 84 120 94 120 112"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      opacity={0.75}
    />
    <Path d="M78 118 L84 106 L90 118" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
  </Svg>
);

/** plus — an ember kept safe inside a simple lantern, not just left in the open. */
const Plus = ({ color, size }: IllustrationProps) => (
  <Svg width={size} height={size} viewBox="0 0 160 160" fill="none">
    <Path d="M68 34 L92 34 L86 46 L74 46 Z" stroke={color} strokeWidth={2.2} strokeLinejoin="round" />
    <Circle cx={80} cy={92} r={40} stroke={color} strokeWidth={2.2} />
    <Path
      d="M80 74 C86 82 88 90 82 98 C78 92 74 92 74 98 C68 90 72 80 80 74 Z"
      stroke={color}
      strokeWidth={2}
      strokeLinejoin="round"
      fill={color}
      fillOpacity={0.18}
    />
  </Svg>
);

const BY_BEAT: Partial<Record<string, (p: IllustrationProps) => ReturnType<typeof Svg>>> = {
  dusk: Dusk,
  vent: Vent,
  mirror: Mirror,
  xolacers: Xolacers,
  plus: Plus,
};

export const BeatIllustration = ({
  beat,
  color,
  size = 128,
}: {
  beat: StoryBeat;
  color: string;
  size?: number;
}) => {
  const Illustration = BY_BEAT[beat.id];
  if (!Illustration) return null;
  return <Illustration color={color} size={size} />;
};
