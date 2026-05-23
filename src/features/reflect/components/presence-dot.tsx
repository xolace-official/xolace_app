import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useThemeColor } from "heroui-native";

export const PresenceDot = () => {
  const accentColor = useThemeColor("accent");
  const dotStyle = useMemo(
    () => ({
      ...styles.base,
      shadowColor: accentColor,
    }),
    [accentColor],
  );

  return <View className="h-3 w-3 rounded-full bg-accent" style={dotStyle} />;
};

const styles = StyleSheet.create({
  base: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
});
