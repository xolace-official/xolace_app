import { ScrollView, StyleSheet, View } from "react-native";
import { RadioGroup, Separator } from "heroui-native";
import { EaseView } from "react-native-ease/uniwind";
import { AppText } from "@/src/components/shared/app-text";
import { SettingsSection } from "@/src/features/settings/components/settings-section";
import { RadioIconIndicator } from "@/src/features/settings/components/radio-icon-indicator";
import { useMirrorSettings, type MirrorTone } from "@/src/features/settings/hooks/use-mirror-settings";
import type { CrossPlatformSymbol } from "@/src/features/settings/components/settings-icons";

type ToneOption = {
  value: MirrorTone;
  label: string;
  description: string;
  symbol: CrossPlatformSymbol;
};

const TONE_OPTIONS: ToneOption[] = [
  {
    value: "adaptive",
    label: "Adaptive",
    description: "Reads your writing style and mirrors it back",
    symbol: { ios: "waveform", android: "graphic_eq", web: "graphic_eq" },
  },
  {
    value: "poetic",
    label: "Poetic",
    description: "Evocative, metaphor-rich language",
    symbol: { ios: "moon.stars", android: "auto_awesome", web: "auto_awesome" },
  },
  {
    value: "gentle",
    label: "Gentle",
    description: "Warm, simple language",
    symbol: { ios: "heart", android: "favorite", web: "favorite" },
  },
  {
    value: "direct",
    label: "Direct",
    description: "Clear, minimal — no metaphors",
    symbol: { ios: "arrow.right", android: "arrow_forward", web: "arrow_forward" },
  },
  {
    value: "witnessed",
    label: "Witnessed",
    description: "Begins with a moment of recognition, then mirrors",
    symbol: { ios: "eye", android: "visibility", web: "visibility" },
  },
];

const EASE: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];

const styles = StyleSheet.create({
  contentContainer: { paddingTop: 20, paddingBottom: 48 },
});

export const MirrorScreen = () => {
  const { mirrorTone, setMirrorTone } = useMirrorSettings();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      <EaseView
        initialAnimate={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 300, easing: EASE }}
      >
        <SettingsSection title="Tone">
          <RadioGroup
            value={mirrorTone}
            onValueChange={(v) => setMirrorTone(v as MirrorTone)}
          >
            {TONE_OPTIONS.map((opt, index) => (
              <View key={opt.value}>
                <RadioGroup.Item value={opt.value} className="px-5 py-4">
                  {({ isSelected }) => (
                    <>
                      <View className="flex-1 gap-0.5 pr-3">
                        <AppText className="text-base font-medium text-foreground">
                          {opt.label}
                        </AppText>
                        <AppText className="text-sm text-foreground/55">
                          {opt.description}
                        </AppText>
                      </View>
                      <RadioIconIndicator
                        symbol={opt.symbol}
                        isSelected={isSelected}
                      />
                    </>
                  )}
                </RadioGroup.Item>
                {index < TONE_OPTIONS.length - 1 && <Separator className="mx-5" />}
              </View>
            ))}
          </RadioGroup>
        </SettingsSection>
      </EaseView>
    </ScrollView>
  );
};
