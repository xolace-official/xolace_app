import { View } from 'react-native';
import { Card, cn } from 'heroui-native';
import { AppText } from '@/components/shared/app-text';
import type { TimelineEntry } from '@/interfaces/timeline';

type Props = {
  entry: TimelineEntry;
  className?: string;
};

export const TimelineEntryCard = ({ entry, className }: Props) => (
  <View className={cn('mx-5 mb-3', className)}>
    <Card
      variant="tertiary"
      className="border border-foreground/10 rounded-2xl"
      style={{ borderCurve: 'continuous' }}
    >
      <Card.Body className="gap-4 py-3 px-3">
        {/* Quote */}
        <AppText className="text-base italic leading-7 text-foreground">
          &ldquo;{entry.quote}&rdquo;
        </AppText>

        {/* Emotion + response type row */}
        <View className="flex-row items-center gap-2">
          <AppText className="text-base">{entry.emotionEmoji}</AppText>
          <AppText className="text-sm text-foreground/60">{entry.emotion}</AppText>
          <AppText className="text-sm text-foreground/25">·</AppText>
          <AppText className="text-sm text-foreground/40">{entry.responseType}</AppText>
        </View>
      </Card.Body>
    </Card>
  </View>
);
