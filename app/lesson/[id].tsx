import {
  View, Text, TouchableOpacity, Animated,
  ScrollView, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { getChallengesForLesson, getLessonsForCourse, getCourseForLanguage } from '../../db/assetDb';
import { useStore } from '../../store/useStore';
import * as Speech from 'expo-speech';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Challenge {
  id: string;
  type: string;
  prompt_language: string;
  prompt_text: string;
  expected_answer: string;
  audio_flag: boolean;
  options: string[];
}

type AnswerState = 'idle' | 'correct' | 'wrong';

// ─── Lesson Screen ────────────────────────────────────────────────────────────
export default function LessonScreen() {
  const { id: lessonId } = useLocalSearchParams<{ id: string }>();
  const router           = useRouter();
  const { completeChallenge, hearts } = useStore();

  const [challenges, setChallenges]   = useState<Challenge[]>([]);
  const [current, setCurrent]         = useState(0);
  const [selected, setSelected]       = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [loading, setLoading]         = useState(true);
  const [xpGained, setXpGained]       = useState(0);
  const [lessonTitle, setLessonTitle] = useState('');

  const shakeAnim    = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const correctAnim  = useRef(new Animated.Value(0)).current;

  // ─── Load challenges ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!lessonId) return;

    (async () => {
      try {
        const data = await getChallengesForLesson(lessonId);
        setChallenges(data);

        // Derive a friendly lesson title from the lesson ID
        const parts = lessonId.split('_'); // lesson_te_1
        const langCode = parts[1] as 'te' | 'hi';
        const course = await getCourseForLanguage(langCode);
        if (course) {
          const lessons = await getLessonsForCourse(course.id);
          const found = lessons.find(l => l.id === lessonId);
          if (found) setLessonTitle(found.title);
        }
      } catch (e) {
        console.error('[LessonScreen] Failed to load:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [lessonId]);

  // Animate progress bar
  useEffect(() => {
    if (challenges.length === 0) return;
    Animated.timing(progressAnim, {
      toValue: current / challenges.length,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [current, challenges.length]);

  // ─── Animations ─────────────────────────────────────────────────────────────
  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 55, useNativeDriver: true }),
    ]).start();
  }

  function flashCorrect() {
    correctAnim.setValue(1);
    Animated.timing(correctAnim, { toValue: 0, duration: 800, useNativeDriver: false }).start();
  }

  // ─── TTS ────────────────────────────────────────────────────────────────────
  function speak(text: string, lang: string) {
    const langCode = lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-US';
    Speech.stop();
    Speech.speak(text, { language: langCode, rate: 0.8 });
  }

  // ─── Answer handling ────────────────────────────────────────────────────────
  async function handleSelect(option: string) {
    if (answerState !== 'idle') return;
    if (hearts <= 0 && option !== challenges[current].expected_answer) {
      Alert.alert(
        'No Hearts Left ❤️',
        'Your hearts will regenerate every 4 hours. Come back later!',
        [{ text: 'Go Back', onPress: () => router.back() }]
      );
      return;
    }

    setSelected(option);
    const challenge   = challenges[current];
    const isCorrect   = option.toLowerCase().trim() === challenge.expected_answer.toLowerCase().trim();

    if (isCorrect) {
      setAnswerState('correct');
      flashCorrect();
      setXpGained(prev => prev + 10);
      // Speak the correct answer
      speak(challenge.expected_answer, 'en');
      await completeChallenge(true);
    } else {
      setAnswerState('wrong');
      shake();
      await completeChallenge(false);
    }
  }

  function handleNext() {
    if (current + 1 >= challenges.length) {
      // Lesson complete
      Alert.alert(
        '🎉 Lesson Complete!',
        `Great job! You earned +${xpGained} XP.\n\nKeep up the streak!`,
        [{ text: 'Back to Lessons ✓', onPress: () => router.back() }],
        { cancelable: false }
      );
      return;
    }
    setCurrent(prev => prev + 1);
    setSelected(null);
    setAnswerState('idle');
    shakeAnim.setValue(0);
  }

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#6b7280', fontSize: 15 }}>Loading lesson…</Text>
      </View>
    );
  }

  if (challenges.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#ef4444', fontSize: 18, fontWeight: '700' }}>No challenges found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#3b82f6', fontSize: 16 }}>← Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const challenge = challenges[current];
  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const bgFlash = correctAnim.interpolate({ inputRange: [0, 1], outputRange: ['#0a0a0a', '#052e16'] });

  const isAnswered = answerState !== 'idle';
  const feedbackColor = answerState === 'correct' ? '#22c55e' : '#ef4444';
  const feedbackBg    = answerState === 'correct' ? '#052e16' : '#450a0a';
  const feedbackText  = answerState === 'correct'
    ? '✅ Correct!'
    : `❌  Answer: ${challenge.expected_answer}`;

  return (
    <Animated.View style={{ flex: 1, backgroundColor: bgFlash }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>

        {/* ── Header: close + progress + hearts ── */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 16, paddingVertical: 10,
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              width: 38, height: 38, borderRadius: 12,
              backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#9ca3af', fontSize: 18, lineHeight: 20 }}>✕</Text>
          </TouchableOpacity>

          {/* Progress bar */}
          <View style={{
            flex: 1, marginHorizontal: 12, height: 9,
            backgroundColor: '#1f2937', borderRadius: 5, overflow: 'hidden',
          }}>
            <Animated.View style={{
              height: 9, borderRadius: 5,
              backgroundColor: '#3b82f6',
              width: progressWidth,
            }} />
          </View>

          {/* Hearts pill */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: '#1f2937', borderRadius: 16,
            paddingHorizontal: 10, paddingVertical: 5,
          }}>
            <Text style={{ fontSize: 14 }}>❤️</Text>
            <Text style={{ color: hearts > 0 ? '#ef4444' : '#6b7280', fontWeight: '800', marginLeft: 4, fontSize: 15 }}>
              {hearts}
            </Text>
          </View>
        </View>

        {/* ── Content ── */}
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 24, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Counter */}
          <Text style={{ color: '#4b5563', fontSize: 13, fontWeight: '600', marginBottom: 6 }}>
            {lessonTitle ? lessonTitle + ' · ' : ''}Question {current + 1}/{challenges.length}
          </Text>

          {/* Prompt card */}
          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <View style={{
              backgroundColor: '#111827', borderRadius: 24, padding: 24,
              borderWidth: 1, borderColor: '#1f2937',
              alignItems: 'center', marginBottom: 28, minHeight: 160, justifyContent: 'center',
            }}>
              <View style={{
                backgroundColor: '#1e3a8a', borderRadius: 12,
                paddingHorizontal: 12, paddingVertical: 5,
                marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 6,
              }}>
                <Text style={{ fontSize: 13 }}>
                  {challenge.type === 'listen' ? '🔊' : '🌐'}
                </Text>
                <Text style={{ color: '#93c5fd', fontSize: 12, fontWeight: '700' }}>
                  {challenge.type === 'listen' ? 'Listen & Select' : 'Translate to English'}
                </Text>
              </View>

              {/* TTS Button */}
              <TouchableOpacity
                onPress={() => speak(challenge.prompt_text, challenge.prompt_language)}
                activeOpacity={0.7}
                style={{ marginBottom: 14 }}
              >
                <View style={{
                  backgroundColor: '#0f172a', borderRadius: 18,
                  paddingHorizontal: 20, paddingVertical: 10,
                  flexDirection: 'row', alignItems: 'center', gap: 8,
                  borderWidth: 1, borderColor: '#334155',
                }}>
                  <Text style={{ fontSize: 20 }}>🔊</Text>
                  <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '600' }}>Tap to hear</Text>
                </View>
              </TouchableOpacity>

              <Text style={{
                fontSize: 26, fontWeight: '800', color: '#ffffff',
                textAlign: 'center', lineHeight: 38, letterSpacing: 0.3,
              }}>
                {challenge.prompt_text}
              </Text>
            </View>
          </Animated.View>

          {/* Options */}
          <View style={{ gap: 11 }}>
            {challenge.options.map((option) => {
              const isSelected   = selected === option;
              const isCorrectOpt = option.toLowerCase().trim() === challenge.expected_answer.toLowerCase().trim();

              let bgColor     = '#111827';
              let borderColor = '#1f2937';
              let textColor   = '#d1d5db';

              if (isAnswered) {
                if (isSelected && answerState === 'correct') {
                  bgColor = '#052e16'; borderColor = '#22c55e'; textColor = '#4ade80';
                } else if (isSelected && answerState === 'wrong') {
                  bgColor = '#450a0a'; borderColor = '#ef4444'; textColor = '#f87171';
                } else if (!isSelected && isCorrectOpt) {
                  bgColor = '#052e16'; borderColor = '#22c55e'; textColor = '#4ade80';
                } else {
                  bgColor = '#0f172a'; borderColor = '#1e293b'; textColor = '#4b5563';
                }
              } else if (isSelected) {
                bgColor = '#1e3a8a'; borderColor = '#3b82f6'; textColor = '#ffffff';
              }

              return (
                <TouchableOpacity
                  key={option}
                  activeOpacity={0.8}
                  onPress={() => handleSelect(option)}
                  disabled={isAnswered}
                >
                  <View style={{
                    backgroundColor: bgColor,
                    borderRadius: 16, borderWidth: 2, borderColor,
                    padding: 16, flexDirection: 'row', alignItems: 'center',
                  }}>
                    <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: textColor }}>
                      {option}
                    </Text>
                    {isAnswered && isSelected && (
                      <Text style={{ fontSize: 18 }}>{answerState === 'correct' ? '✅' : '❌'}</Text>
                    )}
                    {isAnswered && !isSelected && isCorrectOpt && (
                      <Text style={{ fontSize: 18 }}>✅</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* ── Feedback + Continue Button ── */}
        {isAnswered && (
          <View style={{ borderTopWidth: 1, borderTopColor: '#1f2937' }}>
            <View style={{ backgroundColor: feedbackBg, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 }}>
              <Text style={{ color: feedbackColor, fontSize: 17, fontWeight: '800' }}>
                {feedbackText}
              </Text>
              {answerState === 'correct' && (
                <Text style={{ color: '#4ade80', fontSize: 12, marginTop: 3 }}>+10 XP earned 🎉</Text>
              )}
              {answerState === 'wrong' && (
                <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 3 }}>Don't worry — keep going!</Text>
              )}
            </View>
            <View style={{ paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 24 : 16, paddingTop: 10 }}>
              <TouchableOpacity onPress={handleNext} activeOpacity={0.85}>
                <LinearGradient
                  colors={answerState === 'correct' ? ['#22c55e', '#16a34a'] : ['#374151', '#4b5563']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 16, paddingVertical: 17, alignItems: 'center' }}
                >
                  <Text style={{ color: '#ffffff', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 }}>
                    {current + 1 >= challenges.length ? '🎉 Finish Lesson' : 'Continue →'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Animated.View>
  );
}
