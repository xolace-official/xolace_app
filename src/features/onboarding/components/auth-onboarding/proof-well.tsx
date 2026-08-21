/**
 * The odd-one-out beat. Every other beat is words on the dark; this one holds
 * up a real in-app artifact — the weekly cohort card from Discovery — so the
 * "you are not alone" claim is shown rather than asserted.
 *
 * This is where #198's card question re-opens, and the answer is NARROW: the
 * card comes back for exactly this beat, because an artifact needs an edge to
 * read as an artifact. The tale beats stay cardless.
 *
 * The number is illustrative here. In production this renders the same shipped
 * rule as Discovery: real matches only, and below a floor of three, no number
 * at all — a warm line runs without one. Never a fabricated count.
 */
import { View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useDeckColor } from './deck-color';

import { AppText } from '@/src/components/shared/app-text';

export const ProofWell = () => {
  const ember = useDeckColor('ember');

  return (
    <View
      className="rounded-[26px] border px-6 py-6 gap-3"
      style={{ borderColor: `${ember}33`, backgroundColor: `${ember}0d` }}
    >
      <View className="flex-row items-center gap-2">
        <SymbolView name="flame" size={13} tintColor={ember} type="hierarchical" />
        <AppText className="text-ember/70 text-[10px] uppercase" style={{ letterSpacing: 2 }}>
          By the fire this week
        </AppText>
      </View>

      <AppText
        className="text-foreground/95 text-[20px] leading-[30px]"
        style={{ fontFamily: 'Poppins-Medium' }}
      >
        <AppText style={{ fontFamily: 'Poppins-Medium', color: ember }}>22 campers</AppText>
        {' sat with the same feeling you did.'}
      </AppText>

      <AppText className="text-foreground/45 text-[13px] leading-5">
        Nobody sees who. Nobody sees what you said.
      </AppText>
    </View>
  );
};
