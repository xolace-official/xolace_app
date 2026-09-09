/**
 * PROTOTYPE — Variant D · "Devotional + progress" (#273)
 *
 * Variant A's card + rail, unchanged, plus B's progress line pulled up to the
 * header: the "N of 3 tended" count sits on the same row as the segmented bar.
 * Loading here is a plain skeleton — the kindling screen only ever waits on its
 * own query, never on generation (that beat lives on session-end).
 */
import { ScrollView, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useThemeColor } from 'heroui-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/shared/app-text';
import { Row } from './variant-a';
import { useKindlingMock, type PreviewState } from './mock';

export function VariantD({ preview }: { preview: PreviewState }) {
  const insets = useSafeAreaInsets();
  const k = useKindlingMock();
  const accent = useThemeColor('accent') as string;
  const foreground = useThemeColor('foreground') as string;

  if (preview === 'loading') {
    return (
      <View
        className="flex-1 bg-background px-5"
        style={{ paddingTop: insets.top }}
      >
        <View className="h-7 w-40 rounded-md bg-surface-secondary" />
        <View className="mt-3 h-1.5 w-full rounded-full bg-surface-secondary" />
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            className="mt-6 h-40 rounded-2xl border border-border bg-surface"
          />
        ))}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="px-5 pb-6">
        <AppText className="text-2xl font-semibold text-foreground">
          Your kindling
        </AppText>
        {preview === 'empty' ? (
          <AppText className="mt-1 text-[15px] text-muted">
            Nothing here right now.
          </AppText>
        ) : (
          <>
            <AppText className="mt-1 text-[15px] text-muted">
              A few things to try, from what tonight held.
            </AppText>
            {/* B's progress line, on one row with the count. */}
            <View className="mt-4 flex-row items-center gap-3">
              <AppText className="text-[13px] font-medium text-muted">
                {k.doneCount} of {k.total} tended
              </AppText>
              <View className="flex-1 flex-row gap-1.5">
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
            </View>
          </>
        )}
      </View>

      {preview === 'empty' ? (
        <View className="flex-1 items-center justify-center px-10">
          <SymbolView name="leaf" size={40} tintColor={foreground} />
          <AppText className="mt-4 text-center text-[15px] text-muted">
            When a session leaves something to sit with, a little kindling shows
            up here. Nothing to tend tonight.
          </AppText>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        >
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
      )}
    </View>
  );
}
