import { Redirect } from 'expo-router';
import { useStore } from '../store/useStore';

export default function Index() {
  const hasCompletedOnboarding = useStore((state) => state.hasCompletedOnboarding());

  if (hasCompletedOnboarding) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/onboarding" />;
}
