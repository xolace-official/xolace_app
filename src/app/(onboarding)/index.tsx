import { Redirect } from 'expo-router'

import { useAppStore } from '@/src/store/store'
import { PromiseScreen } from '@/src/features/onboarding/components/screens/PromiseScreen'

const OnboardingPromise = () => {
  const introSeen = useAppStore((s) => s.introSeen)

  if (introSeen) {
    return <Redirect href="/auth-onboarding" />
  }

  return (
    <PromiseScreen />
  )
}

export default OnboardingPromise
