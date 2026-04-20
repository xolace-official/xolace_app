import { useRef, useState } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';
import { TextArea, TextField } from 'heroui-native';
import { AppText } from '@/src/components/shared/app-text';
import { PillButton } from '@/src/components/reflect/pill-button';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

// Input never leaves the device. It is never stored, logged, or sent.
type Props = {
  content: string;
  placeholder?: string;
  onComplete: () => void;
};

export function PrivatePromptBeat({ content, placeholder, onComplete }: Props) {
  const [text, setText] = useState('');
  const clearedRef = useRef(false);

  const handleDone = () => {
    if (clearedRef.current) return;
    clearedRef.current = true;
    // Clear before advancing to ensure text is not held in memory.
    setText('');
    onComplete();
  };

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={50}
      className="flex-1 px-6 pt-4"
    >
      <Animated.View
        entering={FadeIn.duration(500)}
        className="w-full items-center gap-6 px-8"
      >
      
        <AppText className="text-center text-xl font-medium leading-relaxed text-foreground">
          {content}
        </AppText>
  
        <TextField className="w-full">
          <TextArea
            value={text}
            onChangeText={setText}
            placeholder={placeholder ?? 'Write what needs to be said...'}
            autoFocus
          />
        </TextField>
  
        <AppText className="text-center text-xs text-foreground/40">
          This stays on your phone.
        </AppText>
  
          <PillButton label="Done" onPress={handleDone} />
      </Animated.View>
    </KeyboardAvoidingView>
  );
}
