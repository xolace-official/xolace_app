import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { EaseView } from 'react-native-ease/uniwind';
import { BottomSheet, LinkButton, PressableFeedback } from 'heroui-native';
import { useQuery } from 'convex/react';
import { BottomSheetBlurOverlay } from '@/src/components/bottom-sheet-blur-overlay';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { AppText } from '@/src/components/shared/app-text';
import { Presets } from 'react-native-pulsar';
import { ContributedConfirmation } from '@/src/features/session-end/components/contributed-confirmation';
import { HeavierFeedbackPrompt } from '@/src/features/session-end/components/heavier-feedback-prompt';
import { NIGHT_SESSION_END_ACTIVITY } from '@/src/features/reflect/night-copy';

type PostSessionMood = 'lighter' | 'same' | 'heavier' | 'unsure';
type Phase = 'acknowledge' | 'mood' | 'offer' | 'close' | 'contributed';

type Props = {
  sessionId?: Id<'sessions'>;
  distilledText: string | null;
  contributeByDefault: boolean;
  onDismiss: (contributedReflection?: boolean, mood?: PostSessionMood) => void;
  onHaveMore: (contributedReflection?: boolean, mood?: PostSessionMood) => void;
  isNight?: boolean;
};

const MOODS = ['lighter', 'same', 'heavier', 'unsure'] as const;

const MOOD_LABELS: Record<PostSessionMood, string> = {
  lighter: 'lighter',
  same: 'the same',
  heavier: 'heavier',
  unsure: 'not sure',
};

const MOOD_HAPTICS: Record<PostSessionMood, () => void> = {
  lighter: () => Presets.chirp(),
  same: () => Presets.plink(),
  heavier: () => Presets.plunk(),
  unsure: () => Presets.murmur(),
};

const HEAVIER_SHEET_SNAP = ['52%'];

const EASING: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];
const EASE_SLOW = { type: 'timing' as const, duration: 600, easing: EASING };
const EASE_IN = { type: 'timing' as const, duration: 400, delay: 200, easing: EASING };
const FADE_OUT = { opacity: 0 };
const FADE_IN = { opacity: 1 };
const SLIDE_OUT = { opacity: 0, translateY: 24 };
const SLIDE_IN = { opacity: 1, translateY: 0 };

const SCROLL_CONTENT = { flexGrow: 1 as const };

export const ActivityVariant = ({
  sessionId,
  distilledText,
  contributeByDefault,
  onDismiss,
  onHaveMore,
  isNight = false,
}: Props) => {
  const [phase, setPhase] = useState<Phase>('acknowledge');
  const [selectedMood, setSelectedMood] = useState<PostSessionMood | null>(null);
  const [heavierSheetOpen, setHeavierSheetOpen] = useState(false);
  const canAsk = useQuery(api.feedback.canAskContextual);

  const advancePhase = () => {
    if (phase === 'acknowledge') setPhase(isNight ? (distilledText ? 'offer' : 'close') : 'mood');
    else if (phase === 'mood') setPhase(distilledText ? 'offer' : 'close');
    else if (phase === 'offer') setPhase('close');
  };

  useEffect(() => {
    if (phase !== 'acknowledge') return;
    const timer = setTimeout(() => {
      setPhase(isNight ? (distilledText ? 'offer' : 'close') : 'mood');
    }, 4000);
    return () => clearTimeout(timer);
  }, [phase, isNight, distilledText]);

  const handleMoodPress = (mood: PostSessionMood) => {
    MOOD_HAPTICS[mood]();
    setSelectedMood(mood);
    // Open the heavier feedback sheet without blocking phase flow
    if (mood === 'heavier' && canAsk === true) {
      setHeavierSheetOpen(true);
    }
  };

  if (phase === 'contributed') {
    return <ContributedConfirmation onDone={() => onDismiss(true, selectedMood ?? undefined)} />;
  }

  return (
    <View className="flex-1">
      {/* ── Phase 1: Acknowledgment ── */}
      {phase === 'acknowledge' && (
        <Pressable onPress={advancePhase} className="flex-1 px-8 justify-end pb-16">
          {/* TODO(mascot): Insert illustrated mascot component here when asset is ready */}
          <View className="flex-1" />
          <EaseView initialAnimate={FADE_OUT} animate={FADE_IN} transition={EASE_SLOW}>
            <AppText className="font-serif text-2xl leading-9 text-foreground">
              {isNight ? NIGHT_SESSION_END_ACTIVITY : 'You showed up for\nyourself today.'}
            </AppText>
          </EaseView>
        </Pressable>
      )}

      {/* ── Phase 2: Mood Check ── */}
      {phase === 'mood' && (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={SCROLL_CONTENT}
        >
          <EaseView
            initialAnimate={SLIDE_OUT}
            animate={SLIDE_IN}
            transition={EASE_IN}
            className="flex-1"
          >
            {/* Header */}
            <View className="px-8 pt-14 pb-8">
              <AppText className="font-serif text-3xl text-foreground mb-2">
                How do you feel now?
              </AppText>
              <AppText className="text-sm font-light leading-5 text-foreground/40">
                Your answer stays private. It helps you notice patterns over time.
              </AppText>
            </View>

            {/* Mood pills */}
            <View className="px-8 gap-4">
              {MOODS.map((mood) => (
                <PressableFeedback
                  key={mood}
                  onPress={() => handleMoodPress(mood)}
                  accessibilityLabel={MOOD_LABELS[mood]}
                  className={`w-full rounded-2xl border px-5 py-4 ${
                    selectedMood === mood
                      ? 'border-accent/40 bg-accent/10'
                      : 'border-border/60 bg-surface/30'
                  }`}
                >
                  <AppText
                    className={`text-base text-center ${
                      selectedMood === mood
                        ? 'text-accent font-medium'
                        : 'text-foreground/50 font-light'
                    }`}
                  >
                    {MOOD_LABELS[mood]}
                  </AppText>
                </PressableFeedback>
              ))}
            </View>

            {/* Spacer pushes CTA to bottom */}
            <View className="flex-1" />

            {/* Pinned CTA */}
            <View className="px-8 pt-6 pb-12">
              <PressableFeedback
                onPress={advancePhase}
                accessibilityLabel={selectedMood ? 'Continue' : 'Skip for now'}
                className={`w-full rounded-2xl border px-5 py-4 ${
                  selectedMood
                    ? 'border-foreground/20 bg-foreground/5'
                    : 'border-border/40'
                }`}
              >
                <AppText
                  className={`text-sm text-center ${
                    selectedMood ? 'text-foreground/70' : 'text-foreground/25'
                  }`}
                >
                  {selectedMood ? 'Continue' : 'Skip for now'}
                </AppText>
              </PressableFeedback>
            </View>
          </EaseView>
        </ScrollView>
      )}

      {/* ── Phase 3: The Offer ── */}
      {phase === 'offer' && distilledText && (
        <View className="flex-1">
          <EaseView
            initialAnimate={SLIDE_OUT}
            animate={SLIDE_IN}
            transition={EASE_IN}
            className="flex-1"
          >
            {/* Header */}
            <View className="px-8 pt-14 pb-8">
              <AppText className="font-serif text-2xl text-foreground mb-2">
                Leave it for someone.
              </AppText>
              <AppText className="text-sm font-light leading-5 text-foreground/40">
                Your words might help someone who feels exactly this.
              </AppText>
            </View>

            {/* Distilled text card */}
            <View className="px-8 mb-6 rounded-2xl border border-border/50 bg-surface/40 mx-8 py-4">
              <AppText className="text-sm font-light italic leading-6 text-foreground/60">
                {`"${distilledText}"`}
              </AppText>
            </View>

            {/* Spacer */}
            <View className="flex-1" />

            {/* TODO(bridge): replace or extend this phase with BridgeOffer component when Trusted Bridge feature ships */}
            {/* Action buttons pinned at bottom */}
            <View className="px-8 gap-3 pb-12">
              <PressableFeedback
                onPress={() => setPhase('contributed')}
                accessibilityLabel="Yes, share anonymously"
                className={`w-full rounded-2xl border px-5 py-4 ${
                  contributeByDefault
                    ? 'border-accent/40 bg-accent/10'
                    : 'border-border/60 bg-surface/30'
                }`}
              >
                <AppText
                  className={`text-base text-center ${
                    contributeByDefault ? 'text-accent font-medium' : 'text-foreground/50 font-light'
                  }`}
                >
                  Yes, anonymously
                </AppText>
              </PressableFeedback>
              <PressableFeedback
                onPress={advancePhase}
                accessibilityLabel="Not this time"
                className="w-full rounded-2xl border border-border/40 px-5 py-4"
              >
                <AppText className="text-sm text-center text-foreground/30 font-light">
                  Not this time
                </AppText>
              </PressableFeedback>
            </View>
          </EaseView>
        </View>
      )}

      {/* ── Phase 4: Close ── */}
      {phase === 'close' && (
        <View className="flex-1 px-8 justify-center">
          <EaseView initialAnimate={FADE_OUT} animate={FADE_IN} transition={EASE_IN}>
            <View className="gap-5 items-start">
              <LinkButton
                onPress={() => onHaveMore(undefined, selectedMood ?? undefined)}
                size="sm"
              >
                <LinkButton.Label className="font-light text-accent/70">
                  Have more? I&apos;m here.
                </LinkButton.Label>
              </LinkButton>
              <Pressable
                onPress={() => onDismiss(false, selectedMood ?? undefined)}
                accessibilityLabel="Done"
              >
                <AppText className="text-sm text-foreground/30">Done</AppText>
              </Pressable>
            </View>
          </EaseView>
        </View>
      )}

      {/* ── Heavier Feedback Sheet ── */}
      <BottomSheet
        isOpen={heavierSheetOpen}
        onOpenChange={(open) => { if (!open) setHeavierSheetOpen(false); }}
      >
        <BottomSheet.Portal>
          <BottomSheetBlurOverlay />
          <BottomSheet.Content
            snapPoints={HEAVIER_SHEET_SNAP}
            enableOverDrag={false}
            enableDynamicSizing={false}
            backgroundClassName="bg-background"
            handleIndicatorClassName="bg-foreground/20"
          >
            <HeavierFeedbackPrompt
              sessionId={sessionId}
              onDismiss={() => setHeavierSheetOpen(false)}
            />
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </View>
  );
};
