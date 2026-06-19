import { Platform, View } from "react-native";
import { Blur, Canvas, Group, Paint, Rect, Text, matchFont } from "@shopify/react-native-skia";
import { useTokenColor } from "../hooks/use-token-color";

const W = 44;
const H = 24;

// A representative count behind a static blur — readable as "a number lives
// here" without revealing it. Real counts stay premium-gated.
export function FrostedCount({ value }: { value: number }) {
  const accent = useTokenColor("accent");
  const muted = useTokenColor("muted");

  const font = matchFont({
    fontFamily: Platform.select({ ios: "Helvetica", default: "sans-serif" }) as string,
    fontSize: 13,
    fontStyle: "normal",
    fontWeight: "600",
  });

  const label = String(value);
  const textWidth = font.measureText ? font.measureText(label).width : label.length * 7;
  const x = (W - textWidth) / 2;
  const y = H / 2 + 4.5;

  return (
    <View
      className="rounded-lg overflow-hidden"
      style={{ width: W, height: H, borderWidth: 1, borderColor: muted + "1F" }}
    >
      <Canvas style={{ width: W, height: H }}>
        <Rect x={0} y={0} width={W} height={H} color={accent + "12"} />
        <Group layer={<Paint><Blur blur={2.8} /></Paint>}>
          <Text x={x} y={y} text={label} font={font} color={muted + "E6"} />
        </Group>
      </Canvas>
    </View>
  );
}
