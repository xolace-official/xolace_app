import { View } from 'react-native';
import { PressableFeedback, useThemeColor } from 'heroui-native';
import { AppText } from '@/src/components/shared/app-text';
import {
  TEXTURE_SET_IDS,
  TEXTURE_SET_LABELS,
  type TextureSetId,
} from '@/src/features/reflect/texture-sets';

type Props = {
  activeSet: TextureSetId;
  onSelect: (id: TextureSetId) => void;
  disabled?: boolean;
};

export const TextureSetTabs = ({ activeSet, onSelect, disabled }: Props) => {
  const accentColor = useThemeColor('accent') as string;

  return (
    <View className="flex-row gap-2 mb-3">
      {TEXTURE_SET_IDS.map((id) => {
        const isActive = id === activeSet;
        return (
          <PressableFeedback
            key={id}
            onPress={() => onSelect(id)}
            isDisabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={TEXTURE_SET_LABELS[id]}
            className={[
              'rounded-full px-3 py-1 border',
              isActive
                ? 'bg-accent/10 border-accent/30'
                : 'bg-transparent border-foreground/10',
            ].join(' ')}
          >
            <AppText
              className={`text-xs font-medium ${isActive ? 'text-accent' : 'text-foreground/40'}`}
            >
              {TEXTURE_SET_LABELS[id]}
            </AppText>
            {isActive && (
              <View
                className="absolute bottom-0 left-3 right-3 h-px rounded-full"
                // accent-colored underline using inline style since color must come from theme
                style={{ backgroundColor: accentColor, opacity: 0.6 }}
              />
            )}
          </PressableFeedback>
        );
      })}
    </View>
  );
};
