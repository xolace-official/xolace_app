import { useState } from 'react';
import { View } from 'react-native';
import { EaseView } from 'react-native-ease/uniwind';
import { AppText } from '@/src/components/shared/app-text';
import { PillButton } from '@/src/components/shared/pill-button';

type Props = {
  onBegin: () => void;
};

export function PreRollCard({ onBegin }: Props) {
  const [visible, setVisible] = useState(true);

  const handleBegin = () => {
    setVisible(false);
  };

  return (
    <EaseView
      initialAnimate={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={visible
        ? { type: 'timing', duration: 600, easing: [0.455, 0.03, 0.515, 0.955] }
        : { type: 'timing', duration: 300, easing: [0.455, 0.03, 0.515, 0.955] }
      }
      onTransitionEnd={({ finished }) => {
        if (finished && !visible) onBegin();
      }}
      className="flex-1 items-center justify-center px-8"
    >
      <View className="items-center gap-6">
        <AppText className="text-center text-2xl font-semibold text-foreground">
          Sit with this
        </AppText>
        <AppText className="text-center text-base text-foreground/50">
          This takes about 90 seconds.{'\n'}Stay with it.
        </AppText>
        <EaseView
          initialAnimate={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 400, delay: 600, easing: [0.455, 0.03, 0.515, 0.955] }}
        >
          <PillButton label="Begin" onPress={handleBegin} />
        </EaseView>
      </View>
    </EaseView>
  );
}
