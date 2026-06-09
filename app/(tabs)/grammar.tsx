import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { GRAMMAR_LESSONS, GrammarLesson, GrammarQuiz, GrammarSection } from '../../data/grammar';
import * as Speech from 'expo-speech';

// ─── Grammar Quiz Section ─────────────────────────────────────────────────────
function GrammarQuizSection({
  quiz,
  accentColor,
  onComplete,
}: {
  quiz: GrammarQuiz[];
  accentColor: string;
  onComplete: (score: number) => void;
}) {
  const [answers, setAnswers] = useState<(number | null)[]>(quiz.map(() => null));
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = answers.every(a => a !== null);
  const score = answers.filter((a, i) => a === quiz[i].answer).length;

  return (
    <View style={{ paddingBottom: 60 }}>
      <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 30 }}>
        Knowledge Check
      </Text>
      
      {quiz.map((q, qi) => (
        <View key={qi} style={{ marginBottom: 24 }}>
          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700', marginBottom: 12, lineHeight: 24 }}>
            {qi + 1}. {q.q}
          </Text>
          {q.options.map((opt, oi) => {
            const isSelected = answers[qi] === oi;
            const isCorrect = q.answer === oi;
            let bg = '#111827';
            let border = '#1f2937';
            let text = '#9ca3af';

            if (submitted) {
              if (isCorrect) { bg = '#052e16'; border = '#22c55e'; text = '#4ade80'; }
              else if (isSelected && !isCorrect) { bg = '#450a0a'; border = '#ef4444'; text = '#f87171'; }
              else { bg = '#0f172a'; border = '#1e293b'; text = '#374151'; }
            } else if (isSelected) {
              bg = accentColor + '33'; border = accentColor; text = '#ffffff';
            }

            return (
              <TouchableOpacity
                key={oi}
                disabled={submitted}
                onPress={() => {
                  if (submitted) return;
                  const next = [...answers];
                  next[qi] = oi;
                  setAnswers(next);
                }}
                style={{
                  backgroundColor: bg, borderRadius: 12, borderWidth: 1.5, borderColor: border,
                  padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center',
                }}
              >
                <View style={{
                  width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: border,
                  alignItems: 'center', justifyContent: 'center', marginRight: 12,
                  backgroundColor: isSelected && !submitted ? accentColor : 'transparent',
                }}>
                  {submitted && isCorrect && <Text style={{ fontSize: 12 }}>✓</Text>}
                  {submitted && isSelected && !isCorrect && <Text style={{ fontSize: 12 }}>✕</Text>}
                </View>
                <Text style={{ flex: 1, color: text, fontSize: 15, fontWeight: '600' }}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {!submitted && (
        <TouchableOpacity disabled={!allAnswered} onPress={() => setSubmitted(true)} style={{ marginTop: 10 }}>
          <LinearGradient
            colors={allAnswered ? [accentColor, accentColor + 'cc'] : ['#1f2937', '#1f2937']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
          >
            <Text style={{ color: allAnswered ? '#ffffff' : '#4b5563', fontSize: 16, fontWeight: '800' }}>
              {allAnswered ? 'Check Answers ✓' : `Answer all ${quiz.length} questions`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {submitted && (
        <View style={{
          backgroundColor: score === quiz.length ? '#052e16' : '#1c1917',
          borderRadius: 20, padding: 24, alignItems: 'center', marginTop: 10,
          borderWidth: 1, borderColor: score === quiz.length ? '#22c55e' : '#44403c',
        }}>
          <Text style={{ fontSize: 48 }}>{score === quiz.length ? '🏆' : '💪'}</Text>
          <Text style={{ fontSize: 24, fontWeight: '900', color: score === quiz.length ? '#4ade80' : '#d6d3d1', marginTop: 12 }}>
            {score} / {quiz.length} correct
          </Text>
          <TouchableOpacity onPress={() => onComplete(score)} style={{ marginTop: 24, width: '100%' }}>
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}
            >
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800' }}>Finish & Claim XP</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Grammar Reader ───────────────────────────────────────────────────────────
function GrammarReader({ lesson, onClose }: { lesson: GrammarLesson; onClose: () => void; }) {
  const insets = useSafeAreaInsets();
  const { addXp, language } = useStore();
  const [stage, setStage] = useState<'reading' | 'quiz' | 'finished'>('reading');
  const [totalXp, setTotalXp] = useState(0);

  const handleFinishQuiz = (score: number) => {
    const earned = score * 15 + 20; // Base 20 XP + 15 per correct answer
    setTotalXp(earned);
    addXp(earned);
    setStage('finished');
  };

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0a0a0a', zIndex: 100 }}>
      {/* Header */}
      <LinearGradient colors={[lesson.color + 'dd', '#0a0a0a']} style={{ paddingTop: insets.top + 10, paddingHorizontal: 16, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={onClose} style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Text style={{ color: '#ffffff', fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 19, fontWeight: '900', color: '#ffffff', letterSpacing: -0.4 }} numberOfLines={1}>{lesson.title}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', marginTop: 4 }}>
              {stage === 'reading' ? 'LEARNING' : stage === 'quiz' ? 'QUIZ' : 'COMPLETED'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Reading Stage */}
      {stage === 'reading' && (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 80 }}>
          <Text style={{ color: '#9ca3af', fontSize: 16, lineHeight: 24, marginBottom: 30, fontStyle: 'italic' }}>
            {lesson.description}
          </Text>

          {lesson.sections.map((sec, i) => (
            <View key={i} style={{ marginBottom: 32 }}>
              <Text style={{ color: lesson.color, fontSize: 20, fontWeight: '800', marginBottom: 12 }}>{sec.heading}</Text>
              <Text style={{ color: '#e5e7eb', fontSize: 16, lineHeight: 26, marginBottom: 16 }}>{sec.content}</Text>
              
              {sec.examples.length > 0 && (
                <View style={{ backgroundColor: '#111827', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1f2937' }}>
                  <Text style={{ color: '#6b7280', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 1 }}>Examples</Text>
                  {sec.examples.map((ex, exIdx) => (
                    <View key={exIdx} style={{ marginBottom: exIdx === sec.examples.length - 1 ? 0 : 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700', flex: 1 }}>{ex.english}</Text>
                        <TouchableOpacity onPress={() => Speech.speak(ex.english)} style={{ padding: 4 }}>
                          <Text style={{ fontSize: 18 }}>🔊</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={{ color: '#9ca3af', fontSize: 14 }}>
                        {language === 'Telugu' ? ex.native_te : ex.native_hi}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity onPress={() => setStage('quiz')} style={{ marginTop: 20 }}>
            <LinearGradient colors={[lesson.color, lesson.color + 'cc']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}>
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800' }}>Continue to Quiz 🧠</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Quiz Stage */}
      {stage === 'quiz' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
          <GrammarQuizSection quiz={lesson.quiz} accentColor={lesson.color} onComplete={handleFinishQuiz} />
        </ScrollView>
      )}

      {/* Finished Stage */}
      {stage === 'finished' && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 }}>
          <Text style={{ fontSize: 80, marginBottom: 20 }}>🎉</Text>
          <Text style={{ color: '#ffffff', fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 12 }}>Lesson Complete!</Text>
          <Text style={{ color: '#9ca3af', fontSize: 16, textAlign: 'center', marginBottom: 40, lineHeight: 24 }}>You have mastered the concepts of this grammar lesson.</Text>
          <View style={{ backgroundColor: lesson.color + '22', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: lesson.color, width: '100%', marginBottom: 40 }}>
            <Text style={{ color: lesson.color, fontSize: 14, fontWeight: '800', marginBottom: 8, letterSpacing: 1 }}>TOTAL REWARD</Text>
            <Text style={{ color: '#fbbf24', fontSize: 48, fontWeight: '900' }}>+{totalXp} XP</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={{ width: '100%' }}>
            <View style={{ backgroundColor: '#1f2937', borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}>
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800' }}>Back to Grammar</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Main Grammar Tab ─────────────────────────────────────────────────────────
export default function GrammarTab() {
  const [selectedLesson, setSelectedLesson] = useState<GrammarLesson | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 56 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 16, paddingTop: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 28, fontWeight: '900', color: '#ffffff', letterSpacing: -1 }}>Grammar Rules</Text>
          <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Master the structure of English.</Text>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          {GRAMMAR_LESSONS.map((lesson) => (
            <TouchableOpacity key={lesson.id} onPress={() => setSelectedLesson(lesson)} activeOpacity={0.8} style={{ marginBottom: 16 }}>
              <View style={{ backgroundColor: '#111827', borderRadius: 20, borderWidth: 1, borderColor: '#1f2937', overflow: 'hidden' }}>
                <View style={{ width: 6, height: '100%', backgroundColor: lesson.color, position: 'absolute', left: 0, top: 0 }} />
                <View style={{ padding: 20, paddingLeft: 24, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: lesson.color + '22', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: lesson.color + '55', marginRight: 16 }}>
                    <Text style={{ fontSize: 26 }}>{lesson.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: lesson.color, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{lesson.level}</Text>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#ffffff', marginBottom: 4 }}>{lesson.title}</Text>
                    <Text style={{ fontSize: 13, color: '#9ca3af', lineHeight: 18 }}>{lesson.description}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {selectedLesson && (
        <GrammarReader lesson={selectedLesson} onClose={() => setSelectedLesson(null)} />
      )}
    </View>
  );
}
