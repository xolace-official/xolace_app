import { useState } from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import Animated, { FadeIn } from "react-native-reanimated";
import { BottomSheet, PressableFeedback } from "heroui-native";
import { SymbolView } from "expo-symbols";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BottomSheetBlurOverlay } from "@/src/components/bottom-sheet-blur-overlay";
import { AppText } from "@/src/components/shared/app-text";
import { useTokenColor } from "../hooks/use-token-color";
import { resolveAvatar, type AvatarOption } from "../hooks/use-avatars";

type Props = {
  isOpen: boolean;
  avatars: AvatarOption[] | undefined;
  currentKey: string | null;
  onClose: () => void;
};

const PREVIEW = 140;
const THUMB = 60;

// Inner content is remounted on each open (keyed by currentKey in the parent),
// so the local draft selection always starts from the user's current avatar.
function AvatarPickerContent({
  avatars,
  currentKey,
  onClose,
}: {
  avatars: AvatarOption[];
  currentKey: string | null;
  onClose: () => void;
}) {
  const accent = useTokenColor("accent");
  const muted = useTokenColor("muted");
  const setAvatar = useMutation(api.avatars.setAvatar);

  const initial = resolveAvatar(avatars, currentKey);
  const [selectedKey, setSelectedKey] = useState(initial?.key ?? avatars[0].key);

  const selected = resolveAvatar(avatars, selectedKey) ?? avatars[0];
  const changed = selectedKey !== (initial?.key ?? null);

  async function handleSave() {
    if (changed) {
      try {
        await setAvatar({ key: selectedKey });
      } catch {
        // Server rejected (e.g. premium gate). Close without changing.
      }
    }
    onClose();
  }

  return (
    <View className="px-6 pt-2 pb-10">
      <AppText className="font-serif text-xl text-foreground text-center">
        Choose your face by the fire
      </AppText>
      <AppText className="text-sm font-light text-foreground/50 text-center mt-1.5 leading-6">
        Pick the one that feels like you today.
      </AppText>

      {/* Large preview — swaps with a soft fade on selection. */}
      <View className="items-center mt-6 mb-7">
        <Animated.View
          key={selected.key}
          entering={FadeIn.duration(220)}
          style={{
            width: PREVIEW,
            height: PREVIEW,
            borderRadius: PREVIEW / 2,
            borderCurve: "continuous",
            overflow: "hidden",
            backgroundColor: accent + "14",
          }}
        >
          <Image
            source={{ uri: selected.url }}
            style={{ width: PREVIEW, height: PREVIEW }}
            recyclingKey={selected.key}
            cachePolicy="memory-disk"
            contentFit="cover"
            transition={120}
          />
        </Animated.View>
        <AppText className="text-[13px] text-muted mt-3">{selected.label}</AppText>
      </View>

      {/* Thumbnail grid. */}
      <View className="flex-row flex-wrap justify-center gap-4">
        {avatars.map((a) => {
          const isSelected = a.key === selectedKey;
          const locked = a.tier === "premium";
          return (
            <PressableFeedback
              key={a.key}
              onPress={() => {
                if (!locked) setSelectedKey(a.key);
              }}
              accessibilityRole="button"
              accessibilityLabel={a.label}
              accessibilityState={{ selected: isSelected }}
              className="rounded-full"
              style={{
                padding: 3,
                borderRadius: (THUMB + 6) / 2,
                borderWidth: 2,
                borderColor: isSelected ? accent : "transparent",
              }}
            >
              <View
                style={{
                  width: THUMB,
                  height: THUMB,
                  borderRadius: THUMB / 2,
                  borderCurve: "continuous",
                  overflow: "hidden",
                  opacity: locked ? 0.4 : 1,
                  backgroundColor: accent + "14",
                }}
              >
                <Image
                  source={{ uri: a.url }}
                  style={{ width: THUMB, height: THUMB }}
                  recyclingKey={a.key}
                  cachePolicy="memory-disk"
                  contentFit="cover"
                />
              </View>
              {locked && (
                <View className="absolute inset-0 items-center justify-center">
                  <SymbolView name="lock.fill" size={16} tintColor={muted} />
                </View>
              )}
            </PressableFeedback>
          );
        })}
      </View>

      <PressableFeedback
        onPress={handleSave}
        accessibilityRole="button"
        accessibilityLabel="Save avatar"
        className="mt-8 h-14 rounded-2xl items-center justify-center bg-accent"
      >
        <AppText className="text-base font-medium text-accent-foreground">
          {changed ? "Save" : "Done"}
        </AppText>
      </PressableFeedback>
    </View>
  );
}

export function AvatarPickerSheet({ isOpen, avatars, currentKey, onClose }: Props) {
  const ready = avatars && avatars.length > 0;

  return (
    <BottomSheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <BottomSheet.Portal>
        <BottomSheetBlurOverlay />
        <BottomSheet.Content
          enableDynamicSizing
          enableOverDrag={false}
          backgroundClassName="bg-background"
          handleIndicatorClassName="bg-foreground/20"
        >
          {isOpen && ready ? (
            <AvatarPickerContent
              // Remount per open so the draft resets to the live selection.
              key={currentKey ?? "default"}
              avatars={avatars}
              currentKey={currentKey}
              onClose={onClose}
            />
          ) : (
            <View className="px-6 pt-2 pb-10 items-center justify-center" style={{ minHeight: 200 }}>
              <AppText className="text-sm text-muted">Loading avatars…</AppText>
            </View>
          )}
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
