import {
  ScrollView, View, Text, TouchableOpacity,
  Animated, ActivityIndicator, Platform,
} from 'react-native';
import { useStore } from '../../store/useStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { getCourseForLanguage, getLessonsForCourse, isDbReady } from '../../db/assetDb';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Lesson {
  id: string;
  unit_number: number;
  lesson_order: number;
  title: string;
  cefr_level: string;
  unit_theme: string;
}
interface Unit {
  unitNumber: number;
  theme: string;
  cefr: string;
  emoji: string;
  color: string;
  lessons: Lesson[];
}

const UNIT_COLORS = [
  '#3b82f6','#22c55e','#a855f7','#f97316',
  '#ec4899','#14b8a6','#eab308','#ef4444',
];
const THEME_EMOJI: Record<string, string> = {
  greetings: '👋', family: '👨‍👩‍👧', food: '🍛', travel: '✈️',
  numbers: '🔢', time: '⏰', school: '📚', work: '💼', general: '💬',
};
const CEFR_COLOR: Record<string, string> = {
  A1: '#22c55e', A2: '#3b82f6', B1: '#a855f7', B2: '#f97316',
};

// ─── Pulse ring animation ─────────────────────────────────────────────────────
function PulseRing({ color }: { color: string }) {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale,   { toValue: 1.45, duration: 1000, useNativeDriver: true }),
          Animated.timing(scale,   { toValue: 1,    duration: 1000, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0,    duration: 1000, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.7,  duration: 1000, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{
      position: 'absolute',
      width: 76, height: 76, borderRadius: 38,
      borderWidth: 3, borderColor: color,
      transform: [{ scale }], opacity,
    }} />
  );
}

// ─── Home tab ─────────────────────────────────────────────────────────────────
export default function HomeTab() {
  const router = useRouter();
  const { xp, language, currentStreak } = useStore();
  const [units, setUnits]               = useState<Unit[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  // Load lessons whenever language changes (e.g. after onboarding completes)
  useEffect(() => {
    if (Platform.OS !== 'web') loadLessons();
  }, [language]); // eslint-disable-line react-hooks/exhaustive-deps

  // Also reload when tab regains focus (returning from a lesson)
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'web') loadLessons();
    }, [language]) // eslint-disable-line react-hooks/exhaustive-deps
  );

  async function loadLessons() {
    setLoading(true);
    setError(null);
    try {
      if (!language) { setLoading(false); return; }

      const lang   = language === 'Telugu' ? 'te' : 'hi';
      const course = await getCourseForLanguage(lang);
      if (!course) {
        setError('Course not found. Please restart the app.');
        setLoading(false);
        return;
      }

      const lessons = await getLessonsForCourse(course.id);

      // Group lessons into units
      const unitMap = new Map<number, Lesson[]>();
      for (const lesson of lessons) {
        const arr = unitMap.get(lesson.unit_number) ?? [];
        arr.push(lesson);
        unitMap.set(lesson.unit_number, arr);
      }

      const builtUnits: Unit[] = Array.from(unitMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([unitNum, unitLessons], idx) => {
          const sample = unitLessons[Math.floor(unitLessons.length / 2)];
          return {
            unitNumber: unitNum,
            theme:  sample.unit_theme,
            cefr:   sample.cefr_level,
            emoji:  THEME_EMOJI[sample.unit_theme] ?? '💬',
            color:  UNIT_COLORS[idx % UNIT_COLORS.length],
            lessons: unitLessons,
          };
        });

      setUnits(builtUnits);
    } catch (e: any) {
      console.error('[HomeTab] loadLessons error:', e);
      setError('Failed to load lessons: ' + e?.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLessonPress(lesson: Lesson) {
    // String-based navigation — works with typed routes off/on
    router.push(('/lesson/' + lesson.id) as any);
  }

  const dailyGoal   = 50;
  const todayXP     = xp % dailyGoal;
  const progressPct = Math.min(100, (todayXP / dailyGoal) * 100);

  // ─── Web platform ─────────────────────────────────────────────────────────
  if (Platform.OS === 'web') {
    return (
      <LinearGradient colors={['#0a0a0a', '#111827', '#0f172a']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontSize: 72, marginBottom: 20 }}>📱</Text>
        <Text style={{ fontSize: 26, fontWeight: '900', color: '#ffffff', textAlign: 'center', marginBottom: 12, letterSpacing: -0.5 }}>
          Best on Mobile
        </Text>
        <Text style={{ fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 28 }}>
          {'Bright Lingo uses a local SQLite database for offline-first learning.\nDownload Expo Go to experience the full app on your phone.'}
        </Text>
        <View style={{ backgroundColor: '#1f2937', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 14, borderWidth: 1, borderColor: '#3b82f6' }}>
          <Text style={{ color: '#3b82f6', fontWeight: '800', fontSize: 15 }}>expo.dev/go  →  Scan QR code</Text>
        </View>
      </LinearGradient>
    );
  }

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ color: '#6b7280', marginTop: 16, fontSize: 15 }}>Loading your course…</Text>
      </View>
    );
  }

  // ─── No language selected ─────────────────────────────────────────────────
  if (!language) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontSize: 64 }}>🌐</Text>
        <Text style={{ color: '#ffffff', fontSize: 22, fontWeight: '800', marginTop: 20, textAlign: 'center' }}>
          No Language Selected
        </Text>
        <Text style={{ color: '#6b7280', marginTop: 10, textAlign: 'center', fontSize: 15 }}>
          Complete the onboarding to choose Telugu or Hindi.
        </Text>
      </View>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontSize: 48 }}>⚠️</Text>
        <Text style={{ color: '#ef4444', fontSize: 16, marginTop: 16, textAlign: 'center' }}>{error}</Text>
        <TouchableOpacity
          onPress={loadLessons}
          style={{ marginTop: 20, backgroundColor: '#1f2937', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}
        >
          <Text style={{ color: '#3b82f6', fontWeight: '700' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Main UI ─────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0a0a0a' }}
      contentContainerStyle={{ paddingBottom: 56 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Daily Goal Banner ── */}
      <LinearGradient colors={['#1e3a8a', '#1d4ed8']} style={{ margin: 16, borderRadius: 20, padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 22, marginRight: 10 }}>⚡</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#bfdbfe', fontSize: 12, fontWeight: '600' }}>Daily Goal</Text>
            <Text style={{ color: '#ffffff', fontSize: 17, fontWeight: '800' }}>{todayXP} / {dailyGoal} XP</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: '#93c5fd', fontSize: 19, fontWeight: '800' }}>{Math.round(progressPct)}%</Text>
            {currentStreak > 0 && (
              <Text style={{ color: '#fbbf24', fontSize: 12 }}>🔥 {currentStreak}-day streak!</Text>
            )}
          </View>
        </View>
        <View style={{ height: 8, backgroundColor: '#1e40af', borderRadius: 4, overflow: 'hidden' }}>
          <View style={{ height: 8, backgroundColor: '#60a5fa', borderRadius: 4, width: `${progressPct}%` }} />
        </View>
      </LinearGradient>

      {/* ── Language tag ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', letterSpacing: 1 }}>
          {language === 'Telugu' ? '🪷 Telugu → English' : '🇮🇳 Hindi → English'}
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: '#1f2937', marginLeft: 12 }} />
      </View>

      {/* ── Skill Tree ── */}
      {units.map((unit) => (
        <UnitSection
          key={unit.unitNumber}
          unit={unit}
          onLessonPress={handleLessonPress}
        />
      ))}
    </ScrollView>
  );
}

// ─── Unit Section ─────────────────────────────────────────────────────────────
function UnitSection({
  unit,
  onLessonPress,
}: {
  unit: Unit;
  onLessonPress: (lesson: Lesson) => void;
}) {
  const color       = unit.color;
  const cefrColor   = CEFR_COLOR[unit.cefr] ?? '#6b7280';

  return (
    <View style={{ marginBottom: 8 }}>
      {/* Unit header */}
      <LinearGradient
        colors={[color + '22', color + '08']}
        style={{
          marginHorizontal: 16, borderRadius: 20, padding: 16,
          marginBottom: 16, borderWidth: 1, borderColor: color + '44',
          flexDirection: 'row', alignItems: 'center',
        }}
      >
        <View style={{
          width: 48, height: 48, borderRadius: 14,
          backgroundColor: color + '33', alignItems: 'center',
          justifyContent: 'center', marginRight: 14,
          borderWidth: 1.5, borderColor: color,
        }}>
          <Text style={{ fontSize: 22 }}>{unit.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color, textTransform: 'uppercase', letterSpacing: 1 }}>
              Unit {unit.unitNumber}
            </Text>
            <View style={{ backgroundColor: cefrColor + '33', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: cefrColor }}>{unit.cefr}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#ffffff' }}>
            {unit.theme.charAt(0).toUpperCase() + unit.theme.slice(1)}
          </Text>
        </View>
        <Text style={{ fontSize: 12, color: '#4b5563', fontWeight: '600' }}>{unit.lessons.length} lessons</Text>
      </LinearGradient>

      {/* Lesson nodes — zigzag layout */}
      <View style={{ paddingHorizontal: 24, marginBottom: 8 }}>
        {unit.lessons.map((lesson, idx) => {
          const isLeft = idx % 2 === 0;
          // All lessons in all units are accessible (no artificial locking)
          const isFirst = idx === 0;

          return (
            <View key={lesson.id} style={{ alignItems: isLeft ? 'flex-start' : 'flex-end', marginBottom: 8 }}>
              {/* Connector line between nodes */}
              {idx > 0 && (
                <View style={{
                  width: 2, height: 18,
                  backgroundColor: color + '33',
                  alignSelf: isLeft ? 'flex-start' : 'flex-end',
                  marginLeft: isLeft ? 34 : 0,
                  marginRight: isLeft ? 0 : 34,
                  marginBottom: -2,
                }} />
              )}

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onLessonPress(lesson)}
                style={{ alignItems: 'center' }}
              >
                <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                  {isFirst && <PulseRing color={color} />}
                  <View style={{
                    width: 68, height: 68, borderRadius: 34,
                    backgroundColor: isFirst ? color : color + '22',
                    borderWidth: 2.5,
                    borderColor: isFirst ? color : color + '66',
                    alignItems: 'center', justifyContent: 'center',
                    shadowColor: color,
                    shadowOffset: { width: 0, height: isFirst ? 8 : 3 },
                    shadowOpacity: isFirst ? 0.55 : 0.2,
                    shadowRadius: isFirst ? 14 : 6,
                    elevation: isFirst ? 10 : 3,
                  }}>
                    <Text style={{ fontSize: 22 }}>
                      {isFirst ? '▶' : lesson.lesson_order <= 2 ? '📖' : '✏️'}
                    </Text>
                  </View>
                </View>
                <Text style={{
                  fontSize: 10, fontWeight: '700', maxWidth: 88,
                  textAlign: 'center', color: '#9ca3af', lineHeight: 14,
                }} numberOfLines={2}>
                  {lesson.title.replace(/ — Part \d+/, '')} {lesson.lesson_order}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}
