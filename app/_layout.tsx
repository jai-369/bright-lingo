import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import '../global.css';
import { useColorScheme } from '@/components/useColorScheme';
import { initAssetDb } from '../db/assetDb';
import { onAppOpen } from '../db/gamification';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Hold the splash screen until boot is complete
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (!fontsLoaded) return;

    const boot = async () => {
      try {
        const db = await initAssetDb();  // null on web (no asset copy)
        if (db) {
          await onAppOpen();             // only runs when DB is available
        }
      } catch (e) {
        console.error('[Boot] Error during initialisation:', e);
      } finally {
        setAppReady(true);
      }
    };

    boot();
  }, [fontsLoaded]);

  useEffect(() => {
    if (appReady) SplashScreen.hideAsync();
  }, [appReady]);

  if (!fontsLoaded || !appReady) return null;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index"      options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)"     options={{ headerShown: false }} />
        <Stack.Screen name="lesson/[id]" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="modal"      options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
