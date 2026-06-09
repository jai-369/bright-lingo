import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { persistUserProfile } from '../../db/gamification';
import { LinearGradient } from 'expo-linear-gradient';

const LEVELS = [
  { id: 'Beginner', label: 'Beginner', emoji: '🌱', desc: 'I\'ve never studied before', color: '#22c55e', bg: '#052e16' },
  { id: 'I know a little', label: 'I know a little', emoji: '📖', desc: 'I know some words and phrases', color: '#3b82f6', bg: '#0c1a3e' },
  { id: 'Intermediate', label: 'Intermediate', emoji: '🚀', desc: 'I can hold basic conversations', color: '#a855f7', bg: '#1a0a3e' },
];

export default function SkillScreen() {
  const router = useRouter();
  const { setSkillLevel, displayName, language } = useStore();
  const [selected, setSelected] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const selectSkill = async (level: string) => {
    setSelected(level);
    setSkillLevel(level);
    try {
      await persistUserProfile(displayName || '', language === 'Telugu' ? 'te' : 'hi');
    } catch (e) {
      console.error('[Skill] Failed to persist user:', e);
    }
    setTimeout(() => router.replace('/(tabs)'), 300);
  };

  return (
    <LinearGradient colors={['#0a0a0a', '#111827', '#0f172a']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 24, paddingTop: 40 }}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Back / Progress */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 40 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
              <Text style={{ color: '#9ca3af', fontSize: 18 }}>‹</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[0, 1, 2].map(i => (
                <View key={i} style={{ width: i === 2 ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i <= 1 ? '#22c55e' : '#3b82f6' }} />
              ))}
            </View>
          </View>

          <Text style={{ fontSize: 13, fontWeight: '600', color: '#3b82f6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Step 3 of 3</Text>
          <Text style={{ fontSize: 34, fontWeight: '900', color: '#ffffff', letterSpacing: -1, lineHeight: 40, marginBottom: 8 }}>Hi {displayName}! 👋</Text>
          <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 40 }}>How much {language} do you already know?</Text>

          {LEVELS.map((level) => {
            const isSelected = selected === level.id;
            return (
              <TouchableOpacity
                key={level.id}
                onPress={() => selectSkill(level.id)}
                activeOpacity={0.85}
                style={{
                  marginBottom: 16,
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: isSelected ? level.color : '#1f2937',
                  backgroundColor: isSelected ? level.bg : '#111827',
                  padding: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  shadowColor: isSelected ? level.color : 'transparent',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                }}
              >
                <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: isSelected ? level.bg : '#1f2937', alignItems: 'center', justifyContent: 'center', marginRight: 16, borderWidth: 1, borderColor: isSelected ? level.color : '#374151' }}>
                  <Text style={{ fontSize: 26 }}>{level.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: isSelected ? '#ffffff' : '#e5e7eb' }}>{level.label}</Text>
                  <Text style={{ fontSize: 13, color: isSelected ? '#9ca3af' : '#4b5563', marginTop: 2 }}>{level.desc}</Text>
                </View>
                <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: isSelected ? level.color : '#374151', backgroundColor: isSelected ? level.color : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {isSelected && <Text style={{ fontSize: 12, color: '#fff' }}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}
