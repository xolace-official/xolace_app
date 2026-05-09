import React from 'react';
import { View } from 'react-native';
import type { EmberSlide } from '@/src/features/onboarding/components/ember-carousel-item';

const A = (o: number) => `rgba(217,171,111,${o})`;
const C = (o: number) => `rgba(180,90,20,${o})`;

const BgShare = (
  <>
    <View style={{ position: 'absolute', width: 170, height: 170, borderRadius: 85, top: -50, left: -45, backgroundColor: C(0.11) }} />
    <View style={{ position: 'absolute', width: 95, height: 95, borderRadius: 48, bottom: -28, right: -18, backgroundColor: A(0.08) }} />
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C(0.05), transform: [{ rotate: '-22deg' }, { scaleX: 1.5 }] }} />
  </>
);

const BgReflect = (
  <>
    <View style={{ position: 'absolute', left: '4%', top: '8%', width: '52%', height: '82%', borderRadius: 999, backgroundColor: A(0.09) }} />
    <View style={{ position: 'absolute', right: '4%', bottom: '8%', width: '52%', height: '82%', borderRadius: 999, backgroundColor: C(0.07) }} />
    <View style={{ position: 'absolute', top: '30%', left: '22%', right: '22%', bottom: '30%', borderRadius: 999, backgroundColor: A(0.05) }} />
  </>
);

const BgClarity = (
  <>
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 999, borderWidth: 1, borderColor: A(0.11) }} />
    <View style={{ position: 'absolute', top: '13%', left: '13%', right: '13%', bottom: '13%', borderRadius: 999, borderWidth: 1, borderColor: A(0.17) }} />
    <View style={{ position: 'absolute', top: '29%', left: '29%', right: '29%', bottom: '29%', borderRadius: 999, borderWidth: 1, borderColor: A(0.24) }} />
    <View style={{ position: 'absolute', top: '43%', left: '43%', right: '43%', bottom: '43%', borderRadius: 999, backgroundColor: A(0.08) }} />
  </>
);

const BgTogether = (
  <>
    <View style={{ position: 'absolute', top: '16%', left: '20%', width: 6, height: 6, borderRadius: 3, backgroundColor: A(0.55) }} />
    <View style={{ position: 'absolute', top: '22%', right: '16%', width: 4, height: 4, borderRadius: 2, backgroundColor: A(0.38) }} />
    <View style={{ position: 'absolute', bottom: '25%', left: '30%', width: 7, height: 7, borderRadius: 4, backgroundColor: A(0.42) }} />
    <View style={{ position: 'absolute', bottom: '18%', right: '26%', width: 4, height: 4, borderRadius: 2, backgroundColor: A(0.3) }} />
    <View style={{ position: 'absolute', top: '44%', left: '12%', width: 5, height: 5, borderRadius: 3, backgroundColor: A(0.25) }} />
    <View style={{ position: 'absolute', top: '38%', right: '10%', width: 3, height: 3, borderRadius: 2, backgroundColor: A(0.2) }} />
    <View style={{ position: 'absolute', top: '50%', left: '46%', width: 10, height: 10, borderRadius: 5, backgroundColor: A(0.12) }} />
  </>
);

export const EMBER_SLIDES: EmberSlide[] = [
  {
    id: 'share',
    action: 'You share',
    detail: "whatever's on your mind, raw, unfiltered",
    backgroundElement: BgShare,
  },
  {
    id: 'reflect',
    action: 'It reflects',
    detail: 'gently, without judgment or advice',
    backgroundElement: BgReflect,
  },
  {
    id: 'clarity',
    action: 'You understand it',
    detail: 'a quiet mirror for your own thoughts',
    backgroundElement: BgClarity,
  },
  {
    id: 'humanity',
    action: 'Not alone',
    detail: 'others have felt this too',
    backgroundElement: BgTogether,
  },
];
