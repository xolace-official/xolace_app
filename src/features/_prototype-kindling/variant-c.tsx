/**
 * PROTOTYPE — Variant C · "Focused spine" (#273)
 *
 * One step open at a time. The first pending step is a full card with its "why"
 * and actions; steps already tended or skipped collapse to slim rail rows above
 * it; steps still ahead are dimmed titles below. Tending or skipping the open
 * one opens the next. When every step is settled, the spine closes with a line.
 *
 * Removes the "wall of three cards" — you only ever decide about one thing —
 * at the cost of not seeing every "why" up front.
 */
import { ScrollView, View, Pressable } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Button, useThemeColor } from 'heroui-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/shared/app-text';
import { MorphLoader } from '@/src/components/shared/loader/morph/morph-loader';
import { useKindlingMock, type KindlingStep, type PreviewState } from './mock';

export function VariantC({ preview }: { preview: PreviewState }) {
  const insets = useSafeAreaInsets();
  const k = useKindlingMock();
  const foreground = useThemeColor('foreground') as string;

  if (preview === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <MorphLoader />
      </View>
    );
  }

  const openIndex = k.steps.findIndex((s) => s.state === 'pending');

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        <View className="px-6 pb-8 pt-2">
          <AppText className="text-2xl font-semibold text-foreground">
            Kindling
          </AppText>
          <AppText className="mt-1 text-[15px] text-muted">
            {preview === 'empty'
              ? 'Nothing to tend right now.'
              : 'Tonight left a few things worth a small effort.'}
          </AppText>
        </View>

        {preview === 'empty' ? (
          <View className="items-center px-12 pt-10">
            <SymbolView name="leaf" size={40} tintColor={foreground} />
            <AppText className="mt-4 text-center text-[15px] text-muted">
              When something is left open after a session, one step at a time
              shows up here.
            </AppText>
          </View>
        ) : (
          <View className="px-6">
            {k.steps.map((step, i) => {
              const isOpen = i === openIndex;
              const isPast = step.state !== 'pending';
              const last = i === k.steps.length - 1;
              return (
                <View key={step.id} className="flex-row">
                  <View className="w-9 items-center">
                    <Node step={step} isOpen={isOpen} foreground={foreground} />
                    {!last && (
                      <View
                        className={`w-0.5 flex-1 ${
                          isPast ? 'bg-accent' : 'bg-border'
                        }`}
                      />
                    )}
                  </View>

                  <View className={`flex-1 pl-3 ${last ? 'pb-2' : 'pb-7'}`}>
                    {isPast ? (
                      <PastLine step={step} />
                    ) : isOpen ? (
                      <OpenCard
                        step={step}
                        onDone={() => k.markDone(step.id)}
                        onSkip={() => k.skip(step.id)}
                      />
                    ) : (
                      <AppText className="py-1.5 text-base text-foreground/35">
                        {step.title}
                      </AppText>
                    )}
                  </View>
                </View>
              );
            })}

            {k.allSettled && (
              <AppText className="pl-12 pt-1 text-sm text-muted">
                That is the kindling tended. Rest now.
              </AppText>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Node({
  step,
  isOpen,
  foreground,
}: {
  step: KindlingStep;
  isOpen: boolean;
  foreground: string;
}) {
  const done = step.state === 'done';
  const skipped = step.state === 'skipped';
  return (
    <View
      className={`items-center justify-center rounded-full border ${
        isOpen ? 'h-10 w-10' : 'h-7 w-7'
      } ${
        done
          ? 'border-accent bg-accent'
          : skipped
            ? 'border-border bg-background'
            : isOpen
              ? 'border-accent bg-surface'
              : 'border-border bg-background'
      }`}
    >
      {done ? (
        <SymbolView name="checkmark" size={14} tintColor="#fff" />
      ) : skipped ? (
        <SymbolView name="minus" size={13} tintColor={foreground} />
      ) : (
        <SymbolView
          name={step.symbol}
          size={isOpen ? 17 : 12}
          tintColor={foreground}
        />
      )}
    </View>
  );
}

function PastLine({ step }: { step: KindlingStep }) {
  const done = step.state === 'done';
  return (
    <View className="py-1.5">
      <AppText
        className={`text-[15px] ${
          done ? 'text-muted' : 'text-muted line-through'
        }`}
      >
        {step.title}
      </AppText>
      <AppText className="mt-0.5 text-xs text-muted">
        {done ? 'Tended' : 'Not for you'}
      </AppText>
    </View>
  );
}

function OpenCard({
  step,
  onDone,
  onSkip,
}: {
  step: KindlingStep;
  onDone: () => void;
  onSkip: () => void;
}) {
  return (
    <View className="rounded-2xl border border-border bg-surface p-5">
      <AppText className="text-[11px] uppercase tracking-wider text-muted">
        {step.eyebrow}
      </AppText>
      <AppText className="mt-1 text-xl font-semibold text-foreground">
        {step.title}
      </AppText>
      <AppText className="mt-2 text-[15px] leading-relaxed text-muted">
        {step.why}
      </AppText>
      <View className="mt-5 flex-row items-center justify-between">
        <Pressable onPress={onSkip} hitSlop={8}>
          <AppText className="text-sm text-muted">Not for me</AppText>
        </Pressable>
        <Button size="sm" onPress={onDone}>
          <Button.Label>{step.actionLabel}</Button.Label>
        </Button>
      </View>
    </View>
  );
}
