/**
 * PROTOTYPE — Variant B · "Compact checklist" (#273)
 *
 * The rail node IS the affordance: tap it to tend the step. Dense rows, no card
 * chrome, one muted "why" line under each title, the action as a small inline
 * link. Skipped rows shrink to a struck-through line. Progress is a segmented
 * bar across the top — the rail and the bar agree.
 *
 * Trades reading comfort for at-a-glance state: you see all three steps and
 * where you are without scrolling.
 */
import { ScrollView, View, Pressable } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useThemeColor } from 'heroui-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/shared/app-text';
import { MorphLoader } from '@/src/components/shared/loader/morph/morph-loader';
import { useKindlingMock, type KindlingStep, type PreviewState } from './mock';

export function VariantB({ preview }: { preview: PreviewState }) {
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

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        <View className="px-5 pb-5 pt-2">
          <AppText className="text-xl font-semibold text-foreground">
            Kindling
          </AppText>

          {preview === 'empty' ? (
            <AppText className="mt-2 text-sm text-muted">
              Nothing to tend right now.
            </AppText>
          ) : (
            <>
              <AppText className="mt-1 text-[13px] text-muted">
                From tonight · {k.doneCount}/{k.total}
              </AppText>
              <View className="mt-3 flex-row gap-1.5">
                {k.steps.map((s) => (
                  <View
                    key={s.id}
                    className={`h-1.5 flex-1 rounded-full ${
                      s.state === 'done'
                        ? 'bg-accent'
                        : s.state === 'skipped'
                          ? 'bg-border'
                          : 'bg-surface-secondary'
                    }`}
                  />
                ))}
              </View>
            </>
          )}
        </View>

        {preview === 'empty' ? (
          <View className="items-center px-10 pt-16">
            <SymbolView name="leaf" size={36} tintColor={foreground} />
            <AppText className="mt-4 text-center text-sm text-muted">
              A session that leaves something open drops a little kindling here.
            </AppText>
          </View>
        ) : (
          <View className="px-5">
            {k.steps.map((step, i) => (
              <Line
                key={step.id}
                step={step}
                last={i === k.steps.length - 1}
                foreground={foreground}
                onDone={() => k.markDone(step.id)}
                onSkip={() => k.skip(step.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Line({
  step,
  last,
  foreground,
  onDone,
  onSkip,
}: {
  step: KindlingStep;
  last: boolean;
  foreground: string;
  onDone: () => void;
  onSkip: () => void;
}) {
  const done = step.state === 'done';
  const skipped = step.state === 'skipped';

  return (
    <View className="flex-row">
      <View className="w-8 items-center">
        <Pressable
          onPress={done || skipped ? undefined : onDone}
          hitSlop={12}
          className={`h-7 w-7 items-center justify-center rounded-full border ${
            done
              ? 'border-accent bg-accent'
              : skipped
                ? 'border-border bg-background'
                : 'border-foreground/40 bg-background'
          }`}
        >
          {done ? (
            <SymbolView name="checkmark" size={13} tintColor="#fff" />
          ) : skipped ? (
            <SymbolView name="minus" size={13} tintColor={foreground} />
          ) : null}
        </Pressable>
        {!last && (
          <View
            className={`w-0.5 flex-1 ${done ? 'bg-accent' : 'bg-border'}`}
          />
        )}
      </View>

      {skipped ? (
        <View className="flex-1 py-2 pl-3">
          <AppText className="text-sm text-muted line-through">
            {step.title}
          </AppText>
        </View>
      ) : (
        <View className={`flex-1 pl-3 ${last ? 'pb-2' : 'pb-6'}`}>
          <View className="flex-row items-center gap-2">
            <SymbolView name={step.symbol} size={13} tintColor={foreground} />
            <AppText
              className={`flex-1 text-[15px] font-medium ${
                done ? 'text-muted' : 'text-foreground'
              }`}
            >
              {step.title}
            </AppText>
          </View>
          {!done && (
            <>
              <AppText className="mt-1 text-[13px] leading-snug text-muted">
                {step.why}
              </AppText>
              <View className="mt-2 flex-row items-center gap-4">
                <Pressable onPress={onDone} hitSlop={6}>
                  <AppText className="text-[13px] font-semibold text-accent">
                    {step.actionLabel}
                  </AppText>
                </Pressable>
                <Pressable onPress={onSkip} hitSlop={6}>
                  <AppText className="text-[13px] text-muted">
                    Not for me
                  </AppText>
                </Pressable>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}
