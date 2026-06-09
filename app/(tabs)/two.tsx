// This file is intentionally left as a redirect - the 'two' tab is not part of the blueprint.
// It is kept to avoid Expo Router errors from stale navigation state.
import { Redirect } from 'expo-router';
export default function TwoScreen() {
  return <Redirect href="/(tabs)" />;
}
