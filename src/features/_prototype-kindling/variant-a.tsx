/**
 * PROTOTYPE — Variant A · "Devotional stack" (#273)
 *
 * Closest to the Daily Manna reference: a full-width card per step sitting to
 * the right of a continuous rail, icon node straddling the line. Big reading
 * surface, one dominant action per card, "not for me" as a recessive text link.
 * Progress reads from the rail filling in behind the nodes.
 */
import { ScrollView, View, Pressable } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Button } from 'heroui-native';
import { useThemeColor } from 'heroui-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/shared/app-text';
import { MorphLoader } from '@/src/components/shared/loader/morph/morph-loader';
import { useKindlingMock, type KindlingStep, type PreviewState } from './mock';

export function VariantA({ preview }: { preview: PreviewState }) {
  const insets = useSafeAreaInsets();
  const k = useKindlingMock();
  const accent = useThemeColor('accent') as string;
  const foreground = useThemeColor('foreground') as string;

  if (preview === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <MorphLoader />
        <AppText className="mt-6 text-muted text-sm">
          Setting up your kindling…
        </AppText>
      </View>
    );
  }

  const header = (
    <View className="px-5 pb-6">
      <AppText className="text-2xl font-semibold text-foreground">
        Your kindling
      </AppText>
      <AppText className="mt-1 text-[15px] text-muted">
        {preview === 'empty'
          ? 'Nothing here right now.'
          : `A few things to try, from what tonight held. ${k.doneCount} of ${k.total} tended.`}
      </AppText>
    </View>
  );

  if (preview === 'empty') {
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        {header}
        <View className="flex-1 items-center justify-center px-10">
          <SymbolView name="leaf" size={40} tintColor={foreground} />
          <AppText className="mt-4 text-center text-[15px] text-muted">
            When a session leaves something to sit with, a little kindling shows
            up here. Nothing to tend tonight.
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        {header}
        <View className="px-5">
          {k.steps.map((step, i) => (
            <Row
              key={step.id}
              step={step}
              last={i === k.steps.length - 1}
              accent={accent}
              foreground={foreground}
              onDone={() => k.markDone(step.id)}
              onSkip={() => k.skip(step.id)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export function Row({
  step,
  last,
  accent,
  foreground,
  onDone,
  onSkip,
}: {
  step: KindlingStep;
  last: boolean;
  accent: string;
  foreground: string;
  onDone: () => void;
  onSkip: () => void;
}) {
  const done = step.state === 'done';
  const skipped = step.state === 'skipped';

  return (
    <View className="flex-row">
      {/* Rail column */}
      <View className="w-10 items-center">
        <View
          className={`h-9 w-9 items-center justify-center rounded-full border ${
            done
              ? 'border-accent bg-accent'
              : skipped
                ? 'border-border bg-background'
                : 'border-border bg-surface'
          }`}
        >
          {done ? (
            <SymbolView name="checkmark" size={16} tintColor="#fff" />
          ) : skipped ? (
            <SymbolView name="minus" size={16} tintColor={foreground} />
          ) : (
            <SymbolView name={step.symbol} size={16} tintColor={foreground} />
          )}
        </View>
        {!last && (
          <View
            className={`w-0.5 flex-1 ${done ? 'bg-accent' : 'bg-border'}`}
          />
        )}
      </View>

      {/* Card column */}
      <View className={`flex-1 pb-4 pl-3 ${last ? '' : 'pb-6'}`}>
        {skipped ? (
          <View className="py-2">
            <AppText className="text-[11px] uppercase tracking-wider text-muted">
              {step.eyebrow}
            </AppText>
            <AppText className="mt-0.5 text-base text-muted line-through">
              {step.title}
            </AppText>
            <AppText className="mt-1 text-xs text-muted">Not for you</AppText>
          </View>
        ) : (
          <View
            className={`rounded-2xl border border-border bg-surface p-5 ${
              done ? 'opacity-60' : ''
            }`}
          >
            <AppText className="text-[11px] uppercase tracking-wider text-muted">
              {step.eyebrow}
            </AppText>
            <AppText className="mt-1 text-lg font-semibold text-foreground">
              {step.title}
            </AppText>
            <AppText className="mt-2 text-[15px] leading-relaxed text-muted">
              {step.why}
            </AppText>

            {done ? (
              <AppText className="mt-4 text-sm font-medium text-accent">
                Tended
              </AppText>
            ) : (
              <View className="mt-4 flex-row items-center justify-between">
                <Pressable onPress={onSkip} hitSlop={8}>
                  <AppText className="text-sm text-muted">Not for me</AppText>
                </Pressable>
                <Button size="sm" onPress={onDone}>
                  <Button.Label>{step.actionLabel}</Button.Label>
                </Button>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
