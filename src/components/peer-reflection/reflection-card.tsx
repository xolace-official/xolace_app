import { SymbolView } from "expo-symbols";
import { View, ColorValue } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Card, Chip, cn } from "heroui-native";
import { AppText } from "@/components/shared/app-text";
import * as Haptics from "expo-haptics";
import { useCSSVariable, withUniwind } from "uniwind";

const StyledSymbolView = withUniwind(SymbolView);

type Props = {
  text: string;
  index: number;
  resonanceCount: number;
  resonated: boolean;
  onToggleResonance: () => void;
};

export const ReflectionCard = ({
  text,
  index,
  resonanceCount,
  resonated,
  onToggleResonance,
}: Props) => {
  const resonanceColor = useCSSVariable("--color-resonance-foreground");

  const handleResonance = () => {
    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onToggleResonance();
  };

  return (
    <Animated.View entering={FadeInDown.delay(200 + index * 150).duration(500)}>
      <Card
        variant="tertiary"
        className="border border-foreground/10 rounded-2xl"
        style={{ borderCurve: "continuous" }}
      >
        <Card.Body className="gap-5 py-4 px-4">
          <AppText className="text-base italic leading-7 text-foreground">
            &ldquo;{text}&rdquo;
          </AppText>

          <View>
            <Chip
              size="sm"
              variant="tertiary"
              color={resonated ? "accent" : "default"}
              animation="disable-all"
              onPress={handleResonance}
              className={cn(
                "border border-foreground/10 p-2 self-end",
                resonated && "border-resonance-foreground bg-resonance",
              )}
            >
              <StyledSymbolView
                name={{
                  ios: resonated ? "heart.fill" : "heart",
                  android: resonated ? "favorite" : "favorite_border",
                  web: resonated ? "favorite" : "favorite_border",
                }}
                size={14}
                tintColor={resonanceColor as ColorValue}
              />
              <Chip.Label
                className={cn(
                  resonated
                    ? "text-resonance-foreground"
                    : "text-foreground/30",
                )}
              >
                {resonated
                  ? `${resonanceCount} resonated`
                  : "This resonates"}
              </Chip.Label>
            </Chip>
          </View>
        </Card.Body>
      </Card>
    </Animated.View>
  );
};
