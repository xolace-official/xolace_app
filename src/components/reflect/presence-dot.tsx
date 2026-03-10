import { View } from 'react-native';
import { useThemeColor } from 'heroui-native';

export const PresenceDot = () => {
  const accentColor = useThemeColor('accent');

  return (
    <View
      className="h-3 w-3 rounded-full bg-accent"
      style={{
        shadowColor: accentColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
        elevation: 4,
      }}
    />
  );
};
