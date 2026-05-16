import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import * as Localization from 'expo-localization';
import { usePostHog } from 'posthog-react-native';
import { COUNTRY_RESOURCES } from '@/src/features/crisis-resources/data';
import type { CountryCode, CountryData } from '@/src/features/crisis-resources/types';

type UseCrisisResourcesResult = {
  selectedCountry: CountryCode | null;
  setCountry: (code: CountryCode | null) => void;
  countryData: CountryData | null;
};

export function useCrisisResources(): UseCrisisResourcesResult {
  const { from = 'idle_button' } = useLocalSearchParams<{ from?: string }>();
  const posthog = usePostHog();

  const region = Localization.getLocales()[0]?.regionCode;
  const [selectedCountry, setCountry] = useState<CountryCode | null>(
    region && COUNTRY_RESOURCES[region as CountryCode] ? (region as CountryCode) : null
  );

  useEffect(() => {
    posthog.capture('crisis_resources_opened', {
      country: selectedCountry ?? 'unrecognized',
      entry_point: from,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const countryData = selectedCountry ? COUNTRY_RESOURCES[selectedCountry] : null;

  return { selectedCountry, setCountry, countryData };
}
