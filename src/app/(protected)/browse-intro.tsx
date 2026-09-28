import { router, useLocalSearchParams } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import { BrowseIntroScreen } from '@/src/components/shared/browse-intro-screen';
import { useAppStore } from '@/src/store/store';

type Family = 'music' | 'support';

const CONTENT: Record<
  Family,
  { heroImage: { uri: string }; title: string; subtitle: string; event: string }
> = {
  music: {
    heroImage: { uri: 'https://groovy-mandrill-892.eu-west-1.convex.cloud/api/storage/e3196aca-e476-4708-b734-4acc433aa39b' },
    title: 'Music, built for support',
    subtitle:
      'A growing catalogue picked for how it feels, not just how it sounds. New tracks arrive as the collection grows.',
    event: 'music_intro_completed',
  },
  support: {
    heroImage: { uri: 'https://groovy-mandrill-892.eu-west-1.convex.cloud/api/storage/a3659ad0-ea0f-4413-a583-5e7eea25639b' },
    title: 'Support audio, for when words are hard',
    subtitle:
      'Short guided pieces to sit with, whenever things get loud. New sessions arrive as the collection grows.',
    event: 'support_audio_intro_completed',
  },
};

/**
 * Browse family welcome, presented as a full-screen modal over the family
 * list so neither the tab bar nor the list's header shows through. Opened by
 * `FamilyListScreen` the first time the live family (`?family=`) has not
 * been seen — Music and Support audio are keyed independently.
 */
export default function BrowseIntroRoute() {
  const { family: rawFamily } = useLocalSearchParams<{ family?: string }>();
  const family: Family = rawFamily === 'support' ? 'support' : 'music';
  const posthog = usePostHog();
  const setMusicIntroSeen = useAppStore((s) => s.setMusicIntroSeen);
  const setSupportAudioIntroSeen = useAppStore((s) => s.setSupportAudioIntroSeen);
  const { heroImage, title, subtitle, event } = CONTENT[family];

  return (
    <BrowseIntroScreen
      heroImage={heroImage}
      title={title}
      subtitle={subtitle}
      ctaLabel="Hold to begin"
      onContinue={() => {
        if (family === 'music') setMusicIntroSeen(true);
        else setSupportAudioIntroSeen(true);
        posthog.capture(event);
        router.back();
      }}
    />
  );
}
