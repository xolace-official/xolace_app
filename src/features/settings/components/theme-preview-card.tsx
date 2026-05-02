import { Pressable, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppText } from '@/src/components/shared/app-text';
import type { ThemeEntry } from '@/src/lib/themes';

type Props = {
  theme: ThemeEntry;
  isActive: boolean;
  onPress: () => void;
};

/**
 * Mini preview card showing a snapshot of the reflect idle screen.
 * Uses theme.preview hex colors as inline styles — no CSS variable
 * resolution needed, works regardless of the active global theme.
 *
 * Active: accent ring + "Active" micro-label.
 * Premium/unavailable: lock glyph overlay; tap is handled by parent.
 */
export const ThemePreviewCard = ({ theme, isActive, onPress }: Props) => {
  const { preview } = theme;
  const isLocked = theme.tier === 'premium' && theme.available === false;

  return (
    <Pressable
      onPress={onPress}
      style={{ width: 130 }}
      accessibilityRole="button"
      accessibilityLabel={`${theme.name} theme${isActive ? ', active' : ''}`}
    >
      {/* Outer ring — only visible when active */}
      <View
        style={{
          borderRadius: 16,
          padding: isActive ? 2 : 0,
          borderWidth: isActive ? 1.5 : 0,
          borderColor: isActive ? preview.accent : 'transparent',
        }}
      >
        {/* Card body */}
        <View
          style={{
            backgroundColor: preview.bg,
            borderRadius: isActive ? 14 : 16,
            overflow: 'hidden',
            minHeight: 140,
            padding: 14,
          }}
        >
          {/* Encouragement line */}
          <AppText
            style={{
              fontSize: 9,
              fontStyle: 'italic',
              color: preview.fg + '50',
              marginBottom: 8,
            }}
          >
            {"What's here right now..."}
          </AppText>

          {/* Faux separator */}
          <View
            style={{
              height: 0.5,
              backgroundColor: preview.border,
              marginBottom: 8,
            }}
          />

          {/* Headline */}
          <AppText
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: preview.fg,
              lineHeight: 17,
              marginBottom: 12,
            }}
          >
            {"What's here\nright now?"}
          </AppText>

          {/* Texture chip */}
          <View
            style={{
              alignSelf: 'flex-start',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: preview.accent + '60',
              backgroundColor: preview.accent + '18',
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            <AppText
              style={{ fontSize: 9, color: preview.accent, fontWeight: '500' }}
            >
              heavy
            </AppText>
          </View>

          {/* Accent dot bottom-right */}
          <View
            style={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              width: 5,
              height: 5,
              borderRadius: 2.5,
              backgroundColor: preview.accent + '80',
            }}
          />

          {/* Lock overlay for premium */}
          {isLocked && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: preview.bg + 'cc',
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppText style={{ fontSize: 18 }}>🔒</AppText>
            </View>
          )}
        </View>
      </View>

      {/* Label row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 6,
          gap: 4,
        }}
      >
        <AppText className="text-xs text-foreground/70">{theme.name}</AppText>
        {isActive && (
          <Animated.View entering={FadeIn.duration(200)}>
            <AppText
              style={{ fontSize: 9, color: preview.accent }}
            >
              · Active
            </AppText>
          </Animated.View>
        )}
      </View>
    </Pressable>
  );
};
