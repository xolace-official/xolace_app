// PROTOTYPE — throwaway (#431). Three answers to "where does the revive prompt live?"
import { Pressable, View } from 'react-native';
import { AppText } from '@/src/components/shared/app-text';

export type Sim = {
  savers: 0 | 1;
  hoursLeft: number; // of the 48h window
  priorStreak: number;
  best: number;
  nextMilestone: number; // where the next saver is earned
  revived: boolean;
  dismissed: boolean;
};

export type VariantProps = {
  sim: Sim;
  revive: () => void;
  dismiss: () => void;
  openSheet: () => void;
};

/** Soft, campfire-toned countdown — no ticking clock. */
export const softWindow = (h: number) =>
  h > 24 ? 'until tomorrow night' : h > 6 ? 'until tonight' : 'for a few more hours';

const MiniCard = ({ day, cooling }: { day: number | string; cooling?: boolean }) => (
  <View className={`w-[62px] overflow-hidden rounded-xl ${cooling ? 'opacity-50' : ''}`}>
    <View className={`items-center py-0.5 ${cooling ? 'bg-muted' : 'bg-accent'}`}>
      <AppText className="text-[9px] font-semibold text-accent-foreground">DAY</AppText>
    </View>
    <View className="items-center bg-surface py-1.5">
      <AppText className="text-xl font-bold text-foreground">{day}</AppText>
    </View>
  </View>
);

const ComposeFrame = ({ header, children }: { header: React.ReactNode; children?: React.ReactNode }) => (
  <View className="gap-4 rounded-3xl bg-surface/40 p-4">
    <View className="flex-row items-center gap-2">{header}</View>
    {children}
    <View className="h-28 rounded-2xl border border-border/60 bg-surface p-3">
      <AppText className="text-muted">What are you carrying?</AppText>
    </View>
  </View>
);

/** A · The card itself cools; tapping it opens the revive sheet. */
export const CardVariant = ({ sim, openSheet }: VariantProps) => {
  const broken = !sim.revived;
  return (
    <ComposeFrame
      header={
        <Pressable onPress={broken && sim.savers > 0 ? openSheet : undefined} className="flex-row items-center gap-2">
          <MiniCard day={broken && sim.savers === 0 ? 0 : sim.priorStreak} cooling={broken && sim.savers > 0} />
          {broken && sim.savers > 0 && (
            <View className="rounded-full bg-ember/20 px-2 py-0.5">
              <AppText className="text-[11px] font-semibold text-ember">Tap to rekindle</AppText>
            </View>
          )}
        </Pressable>
      }
    />
  );
};

/** B · Inline banner above the input, exact hours. 0 savers = silence. */
export const BannerVariant = ({ sim, revive, dismiss }: VariantProps) => {
  const show = !sim.revived && !sim.dismissed && sim.savers > 0;
  return (
    <ComposeFrame header={<MiniCard day={sim.revived ? sim.priorStreak : 0} />}>
      {show && (
        <View className="gap-3 rounded-2xl border border-ember/40 bg-ember/10 p-4">
          <AppText className="font-semibold text-foreground">
            Your {sim.priorStreak}-day fire went out.
          </AppText>
          <AppText className="text-sm text-muted">
            You have a streak saver. Use it to pick up where you left off — {Math.round(sim.hoursLeft)}h left.
          </AppText>
          <View className="flex-row gap-2">
            <Pressable onPress={revive} className="flex-1 items-center rounded-xl bg-ember py-2.5">
              <AppText className="font-semibold text-accent-foreground">Rekindle</AppText>
            </Pressable>
            <Pressable onPress={dismiss} className="items-center rounded-xl px-4 py-2.5">
              <AppText className="text-muted">Not now</AppText>
            </Pressable>
          </View>
        </View>
      )}
    </ComposeFrame>
  );
};

/** C · One-time full-screen moment on first open after the break. */
export const MomentVariant = ({ sim, revive, dismiss }: VariantProps) => {
  if (sim.revived || sim.dismissed) {
    return <ComposeFrame header={<MiniCard day={sim.revived ? sim.priorStreak : 0} />} />;
  }
  const fill = sim.hoursLeft / 48;
  return (
    <View className="items-center gap-5 rounded-3xl bg-overlay px-6 py-10">
      {/* ember "ring" draining as the window closes */}
      <View className="h-28 w-28 items-center justify-center rounded-full border-4 border-border/40">
        <View
          className="absolute rounded-full bg-ember"
          style={{ width: 96 * fill, height: 96 * fill, opacity: 0.25 + 0.6 * fill }}
        />
        <AppText className="text-3xl font-bold text-foreground">{sim.priorStreak}</AppText>
      </View>
      {sim.savers > 0 ? (
        <>
          <AppText className="text-center text-lg font-semibold text-foreground">The fire&apos;s low, not out.</AppText>
          <AppText className="text-center text-muted">
            Spend your streak saver to keep your {sim.priorStreak} days. It holds {softWindow(sim.hoursLeft)}.
          </AppText>
          <Pressable onPress={revive} className="w-full items-center rounded-2xl bg-ember py-3">
            <AppText className="font-semibold text-accent-foreground">Rekindle my {sim.priorStreak} days</AppText>
          </Pressable>
          <Pressable onPress={dismiss}>
            <AppText className="text-muted">Start fresh instead</AppText>
          </Pressable>
        </>
      ) : (
        <>
          <AppText className="text-center text-lg font-semibold text-foreground">A new fire starts today.</AppText>
          <AppText className="text-center text-muted">
            Your best is still {sim.best} days. Reach {sim.nextMilestone} to earn a streak saver for next time.
          </AppText>
          <Pressable onPress={dismiss} className="w-full items-center rounded-2xl bg-accent py-3">
            <AppText className="font-semibold text-accent-foreground">Sit by the fire</AppText>
          </Pressable>
        </>
      )}
    </View>
  );
};

/** Shared sheet for variant A (and a candidate for any tap-through). */
export const ReviveSheet = ({ sim, revive, close }: { sim: Sim; revive: () => void; close: () => void }) => (
  <View className="absolute inset-x-0 bottom-0 gap-3 rounded-t-3xl bg-overlay p-6 pb-32">
    <AppText className="text-lg font-semibold text-foreground">
      {sim.savers > 0 ? `Rekindle your ${sim.priorStreak} days?` : 'Your streak reset'}
    </AppText>
    <AppText className="text-muted">
      {sim.savers > 0
        ? `You missed a day. A streak saver brings your count back — ${softWindow(sim.hoursLeft)}. The missed day stays honest on your graph.`
        : `No saver this time. Your best is still ${sim.best}. Reach day ${sim.nextMilestone} to earn one.`}
    </AppText>
    {sim.savers > 0 && (
      <Pressable onPress={revive} className="items-center rounded-2xl bg-ember py-3">
        <AppText className="font-semibold text-accent-foreground">Use 1 streak saver</AppText>
      </Pressable>
    )}
    <Pressable onPress={close} className="items-center py-2">
      <AppText className="text-muted">{sim.savers > 0 ? 'Not now' : 'Okay'}</AppText>
    </Pressable>
  </View>
);
