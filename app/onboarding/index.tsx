import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../../store/useStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';

const LANGUAGES = [
  {
    id: 'Telugu',
    flag: '🪷',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    gradient: ['#3b82f6', '#1d4ed8'] as const,
    border: '#1e40af',
    speakers: '83 million speakers',
  },
  {
    id: 'Hindi',
    flag: '🇮🇳',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    gradient: ['#f97316', '#c2410c'] as const,
    border: '#9a3412',
    speakers: '600 million speakers',
  },
];

export default function LanguagePicker() {
  const router = useRouter();
  const setLanguage = useStore((state) => state.setLanguage);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const selectLanguage = (lang: string) => {
    setLanguage(lang);
    router.push('/onboarding/name');
  };

  return (
    <LinearGradient colors={['#0a0a0a', '#111827', '#0f172a']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center' }}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#1d4ed8', alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16 }}>
              <Text style={{ fontSize: 40 }}>🌟</Text>
            </View>
            <Text style={{ fontSize: 36, fontWeight: '900', color: '#ffffff', letterSpacing: -1 }}>Bright Lingo</Text>
            <Text style={{ fontSize: 16, color: '#6b7280', marginTop: 8 }}>What do you want to learn?</Text>
          </View>

          {/* Language Cards */}
          {LANGUAGES.map((lang, idx) => (
            <TouchableOpacity
              key={lang.id}
              activeOpacity={0.85}
              onPress={() => selectLanguage(lang.id)}
              style={{ marginBottom: 16 }}
            >
              <LinearGradient
                colors={lang.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 24, padding: 24, flexDirection: 'row', alignItems: 'center',
                  borderWidth: 1, borderColor: lang.border,
                  shadowColor: lang.gradient[0], shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 20,
                  elevation: 12,
                }}
              >
                <Text style={{ fontSize: 56, marginRight: 20 }}>{lang.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 28, fontWeight: '800', color: '#ffffff' }}>{lang.name}</Text>
                  <Text style={{ fontSize: 18, color: 'rgba(255,255,255,0.75)', fontWeight: '500' }}>{lang.nativeName}</Text>
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>{lang.speakers}</Text>
                </View>
                <Text style={{ fontSize: 24, color: 'rgba(255,255,255,0.7)' }}>›</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}

          {/* Progress dots */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32, gap: 8 }}>
            {[0, 1, 2].map(i => (
              <View key={i} style={{ width: i === 0 ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === 0 ? '#3b82f6' : '#374151' }} />
            ))}
          </View>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}
