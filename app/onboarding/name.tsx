import { View, Text, TextInput, TouchableOpacity, Animated, Easing, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { LinearGradient } from 'expo-linear-gradient';

export default function NameScreen() {
  const router = useRouter();
  const setDisplayName = useStore((state) => state.setDisplayName);
  const language = useStore((state) => state.language);
  const [name, setName] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const nextStep = () => {
    if (name.trim()) {
      setDisplayName(name.trim());
      router.push('/onboarding/skill');
    }
  };

  const isReady = name.trim().length > 0;

  return (
    <LinearGradient colors={['#0a0a0a', '#111827', '#0f172a']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 32 }}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], flex: 1 }}>
            {/* Back / Progress */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 40 }}>
              <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                <Text style={{ color: '#9ca3af', fontSize: 18 }}>‹</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[0, 1, 2].map(i => (
                  <View key={i} style={{ width: i === 1 ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === 1 ? '#3b82f6' : i < 1 ? '#22c55e' : '#374151' }} />
                ))}
              </View>
            </View>

            {/* Heading */}
            <View style={{ marginBottom: 40 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#3b82f6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Step 2 of 3</Text>
              <Text style={{ fontSize: 34, fontWeight: '900', color: '#ffffff', letterSpacing: -1, lineHeight: 40 }}>What should{'\n'}we call you?</Text>
              <Text style={{ fontSize: 16, color: '#6b7280', marginTop: 12 }}>
                Learning {language} as {language === 'Telugu' ? 'తెలుగు' : 'हिन्दी'}
              </Text>
            </View>

            {/* Input */}
            <View style={{
              backgroundColor: '#1f2937', borderRadius: 20, borderWidth: 2,
              borderColor: isReady ? '#3b82f6' : '#374151',
              paddingHorizontal: 20, paddingVertical: 4, marginBottom: 16,
            }}>
              <TextInput
                style={{ fontSize: 24, fontWeight: '700', color: '#ffffff', paddingVertical: 16 }}
                placeholder="Your name..."
                placeholderTextColor="#4b5563"
                value={name}
                onChangeText={setName}
                autoFocus
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={nextStep}
              />
            </View>
            <Text style={{ fontSize: 13, color: '#4b5563', marginBottom: 40 }}>This is how you'll appear in your profile</Text>

            {/* Spacer */}
            <View style={{ flex: 1 }} />

            {/* CTA Button */}
            <TouchableOpacity onPress={nextStep} disabled={!isReady} activeOpacity={0.85}>
              <LinearGradient
                colors={isReady ? ['#22c55e', '#16a34a'] : ['#1f2937', '#1f2937']}
                style={{
                  borderRadius: 20, paddingVertical: 20, alignItems: 'center',
                  borderWidth: 2, borderColor: isReady ? '#15803d' : '#374151',
                  shadowColor: isReady ? '#22c55e' : 'transparent',
                  shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: '800', color: isReady ? '#ffffff' : '#4b5563' }}>
                  Continue →
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
