import { useEffect } from 'react';
import { View } from 'react-native';
import { EaseView } from 'react-native-ease/uniwind';
import { Presets } from 'react-native-pulsar';
import { AppText } from '@/src/components/shared/app-text';
import { PillButton } from '@/src/components/shared/pill-button';

type Props = {
  onDone: () => void;
};

export const ContributedConfirmation = ({ onDone }: Props) => {
  useEffect(() => {
    Presets.dewdrop();
  }, []);

  return (
    <View className="flex-1 items-center justify-center px-8">
      <EaseView
        initialAnimate={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 600, easing: [0.455, 0.03, 0.515, 0.955] }}
      >
        <AppText className="text-center font-serif text-lg leading-8 text-foreground">
          Someone out there{'\n'}will feel less alone{'\n'}because of what
          {'\n'}you shared.
        </AppText>
      </EaseView>

      <EaseView
        initialAnimate={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 400, delay: 600, easing: [0.455, 0.03, 0.515, 0.955] }}
        className="mt-10"
      >
        <PillButton label="Done" onPress={onDone} />
      </EaseView>
    </View>
  );
};
