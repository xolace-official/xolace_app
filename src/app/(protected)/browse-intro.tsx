import { router } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import { BrowseIntroScreen } from '@/src/components/shared/browse-intro-screen';
import { useAppStore } from '@/src/store/store';

const MUSIC_HERO = {
  uri: 'https://groovy-mandrill-892.eu-west-1.convex.cloud/api/storage/e3196aca-e476-4708-b734-4acc433aa39b',
};

/**
 * Music welcome, presented as a full-screen modal over the family list so
 * neither the tab bar nor the list's header shows through. Opened by
 * `FamilyListScreen` the first time the live family is Music.
 */
export default function BrowseIntroRoute() {
  const posthog = usePostHog();
  const setMusicIntroSeen = useAppStore((s) => s.setMusicIntroSeen);

  return (
    <BrowseIntroScreen
      heroImage={MUSIC_HERO}
      title="Music, built for support"
      subtitle="A growing catalogue picked for how it feels, not just how it sounds. New tracks arrive as the collection grows."
      ctaLabel="Hold to begin"
      onContinue={() => {
        setMusicIntroSeen(true);
        posthog.capture('music_intro_completed');
        router.back();
      }}
    />
  );
}
