import { SymbolView } from "expo-symbols";
import { View, ColorValue, Pressable } from "react-native";
import { EaseView } from "react-native-ease/uniwind";
import { Card, Chip, cn } from "heroui-native";
import { TruncatedText } from "@/src/features/peer-reflection/components/truncated-text";
import { playResonanceToggle } from "@/src/lib/haptics";
import { useCSSVariable, withUniwind } from "uniwind";

const StyledSymbolView = withUniwind(SymbolView);


type Props = {
  text: string;
  index: number;
  resonanceCount: number;
  resonated: boolean;
  onToggleResonance: () => void | Promise<void>;
  onRequestReport: () => void;
};

export const ReflectionCard = ({
  text,
  index,
  resonanceCount,
  resonated,
  onToggleResonance,
  onRequestReport,
}: Props) => {
  const resonanceColor = useCSSVariable("--color-resonance-foreground");

  const handleResonance = () => {
    playResonanceToggle();
    onToggleResonance();
  };

  return (
    <EaseView
      initialAnimate={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500, delay: 200 + index * 150, easing: [0.455, 0.03, 0.515, 0.955] }}
    >
      <Pressable onLongPress={onRequestReport} delayLongPress={400}>
      <Card
        variant="tertiary"
        className="border border-foreground/10 rounded-2xl"
        style={{ borderCurve: "continuous" }}
      >
        <Card.Body className="gap-5 py-4 px-4">
          <View>
            <TruncatedText
              text={text}
              className="text-base italic leading-7 text-foreground"
            />
          </View>

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
      </Pressable>
    </EaseView>
  );
};
