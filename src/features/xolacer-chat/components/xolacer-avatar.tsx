import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { AppText } from '@/src/components/shared/app-text';
import { getInitials } from '@/src/helpers/utils/strings';
import { cn } from '@/src/lib/utils';

const SIZES = {
  sm: { box: 'h-9 w-9', text: 'text-xs' },
  md: { box: 'h-11 w-11', text: 'text-[15px]' },
  lg: { box: 'h-[76px] w-[76px]', text: 'text-2xl' },
} as const;

/**
 * Initial-or-photo avatar. `muted` renders the resting/unavailable look
 * (grey surface instead of accent) per the mockup.
 */
export function XolacerAvatar({
  name,
  photoUrl,
  size = 'md',
  muted = false,
}: {
  name: string;
  photoUrl?: string;
  size?: keyof typeof SIZES;
  muted?: boolean;
}) {
  const { box, text } = SIZES[size];

  if (photoUrl) {
    return (
      <View className={cn(box, 'rounded-full overflow-hidden bg-surface-secondary')}>
        <Image source={{ uri: photoUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
      </View>
    );
  }
  return (
    <View
      className={cn(
        box,
        'rounded-full items-center justify-center',
        muted ? 'bg-surface-tertiary' : 'bg-accent',
      )}
    >
      <AppText
        className={cn(text, 'font-semibold', muted ? 'text-muted' : 'text-accent-foreground')}
      >
        {getInitials(name)}
      </AppText>
    </View>
  );
}
