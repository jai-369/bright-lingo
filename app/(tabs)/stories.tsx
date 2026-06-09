import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Animated, Platform, StyleSheet
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { STORIES, Story, VocabItem, QuizQuestion, SpeakingSentence, WordBuilderEx } from '../../data/stories';
import * as Speech from 'expo-speech';
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync } from 'expo-audio';
import { transcribeAudio, checkPronunciation } from '../../utils/speechToText';
// ─── Genre badge ──────────────────────────────────────────────────────────────
function GenreBadge({ label, color }: { label: string; color: string }) {
  return (
    <View style={{
      backgroundColor: color + '22', borderRadius: 20,
      paddingHorizontal: 10, paddingVertical: 3,
      borderWidth: 1, borderColor: color + '66',
    }}>
      <Text style={{ color, fontSize: 11, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

// ─── Difficulty badge ─────────────────────────────────────────────────────────
const DIFF_COLOR = { A1: '#22c55e', A2: '#3b82f6', B1: '#a855f7' };
function DiffBadge({ level }: { level: 'A1' | 'A2' | 'B1' }) {
  const c = DIFF_COLOR[level];
  return (
    <View style={{
      backgroundColor: c + '22', borderRadius: 8,
      paddingHorizontal: 7, paddingVertical: 2,
      borderWidth: 1, borderColor: c,
    }}>
      <Text style={{ color: c, fontSize: 10, fontWeight: '800' }}>{level}</Text>
    </View>
  );
}

// ─── Story card ───────────────────────────────────────────────────────────────
function StoryCard({ story, onPress }: { story: Story; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1,    duration: 80, useNativeDriver: true }),
    ]).start(onPress);
  };

  return (
    <Animated.View style={{ transform: [{ scale }], marginBottom: 16 }}>
      <TouchableOpacity activeOpacity={1} onPress={press}>
        <View style={{
          backgroundColor: '#111827', borderRadius: 24,
          borderWidth: 1, borderColor: '#1f2937',
          overflow: 'hidden',
        }}>
          <LinearGradient
            colors={[story.genreColor, story.accentColor]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ height: 5 }}
          />
          <View style={{ padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <View style={{
                width: 52, height: 52, borderRadius: 16,
                backgroundColor: story.genreColor + '22',
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1, borderColor: story.genreColor + '55',
                marginRight: 14,
              }}>
                <Text style={{ fontSize: 26 }}>{story.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 17, fontWeight: '800', color: '#ffffff',
                  letterSpacing: -0.3, lineHeight: 22,
                }}>
                  {story.titleEnglish}
                </Text>
                <Text style={{ fontSize: 13, color: story.genreColor, fontWeight: '600', marginTop: 1 }}>
                  {story.titleNative}  ·  {story.titleRoman}
                </Text>
              </View>
            </View>

            <Text style={{
              fontSize: 14, color: '#9ca3af', lineHeight: 20, marginBottom: 14,
              fontStyle: 'italic',
            }}>
              "{story.tagline}"
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <GenreBadge label={story.genre} color={story.genreColor} />
              <DiffBadge level={story.difficulty} />
              <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 12, color: '#4b5563' }}>⏱ {story.readMin} min</Text>
                <Text style={{ fontSize: 12, color: '#4b5563' }}>·</Text>
                <Text style={{ fontSize: 12, color: '#4b5563' }}>{story.vocab.length} words</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Vocab card ───────────────────────────────────────────────────────────────
function VocabCard({ item, color }: { item: VocabItem; color: string }) {
  return (
    <View style={{
      backgroundColor: '#0f172a', borderRadius: 16,
      padding: 14, borderWidth: 1, borderColor: '#1f2937',
      marginBottom: 10,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color }}>{item.native}</Text>
        <Text style={{ fontSize: 13, color: '#6b7280', fontStyle: 'italic' }}>
          /{item.transliteration}/
        </Text>
      </View>
      <Text style={{ fontSize: 15, color: '#d1d5db', fontWeight: '600', marginTop: 4 }}>
        {item.english}
      </Text>
    </View>
  );
}

// ─── Gameplay: Speaking Lab ───────────────────────────────────────────────────
function SpeakingLab({
  data,
  accentColor,
  onComplete,
}: {
  data: SpeakingSentence[];
  accentColor: string;
  onComplete: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<'idle' | 'listening' | 'analyzing' | 'success' | 'error'>('idle');
  const [feedbackText, setFeedbackText] = useState('');
  
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const current = data[index];

  const handleSpeak = () => {
    Speech.speak(current.native, {
      language: current.lang === 'te' ? 'te-IN' : 'hi-IN',
      pitch: 1.0,
      rate: 0.9,
    });
  };

  const handlePressIn = async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (permission.status !== 'granted') {
        alert('Microphone permission is required to check pronunciation.');
        return;
      }

      try {
        await recorder.prepareToRecordAsync();
      } catch (e: any) {
        // Ignore error if already prepared
        if (!e.message?.includes('already been prepared')) {
          throw e;
        }
      }
      recorder.record();
      setIsRecording(true);
      setStatus('listening');
      setFeedbackText('');
    } catch (err) {
      console.error('Failed to start recording', err);
      setStatus('error');
      setFeedbackText('Microphone failed to start.');
    }
  };

  const handlePressOut = async () => {
    if (!recorder.isRecording) return;

    setIsRecording(false);
    setStatus('analyzing');
    setFeedbackText('');

    try {
      await recorder.stop();
      const uri = recorder.uri;

      if (!uri) throw new Error('No audio URI found');

      // 1. Send to Groq for transcription
      const transcription = await transcribeAudio(uri, current.lang);
      
      if (!transcription) {
        setStatus('error');
        setFeedbackText('Failed to reach AI. Ensure your API key is in utils/speechToText.ts');
        return;
      }

      // 2. Validate
      const isCorrect = checkPronunciation(transcription, current.native);

      if (isCorrect) {
        setStatus('success');
        setFeedbackText('✨ Great Pronunciation!');
        setTimeout(() => {
          if (index < data.length - 1) {
            setIndex(index + 1);
            setStatus('idle');
            setFeedbackText('');
          } else {
            onComplete();
          }
        }, 2000);
      } else {
        setStatus('error');
        setFeedbackText(`Heard: "${transcription}"\nTry again!`);
      }

    } catch (err) {
      console.error('Failed to process recording', err);
      setStatus('error');
      setFeedbackText('Error analyzing audio.');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
      <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 20, fontWeight: '700' }}>
        SPEAKING LAB {index + 1} OF {data.length}
      </Text>
      
      <View style={{
        backgroundColor: '#111827', borderRadius: 24, padding: 24, width: '100%',
        alignItems: 'center', borderWidth: 1, borderColor: '#1f2937', marginBottom: 40
      }}>
        <Text style={{ color: '#d1d5db', fontSize: 16, marginBottom: 16, textAlign: 'center' }}>
          {current.english}
        </Text>
        <Text style={{ color: '#ffffff', fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 8 }}>
          {current.native}
        </Text>
        <Text style={{ color: accentColor, fontSize: 16, textAlign: 'center', fontStyle: 'italic' }}>
          {current.roman}
        </Text>

        <TouchableOpacity
          onPress={handleSpeak}
          style={{
            marginTop: 24, backgroundColor: accentColor + '22',
            paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
            flexDirection: 'row', alignItems: 'center', gap: 8,
            borderWidth: 1, borderColor: accentColor + '66'
          }}
        >
          <Text style={{ fontSize: 18 }}>🔊</Text>
          <Text style={{ color: accentColor, fontWeight: '700' }}>Listen</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 120, alignItems: 'center', justifyContent: 'center' }}>
        {status === 'idle' && (
          <Text style={{ color: '#6b7280', marginBottom: 16 }}>Hold button to speak</Text>
        )}
        {status === 'listening' && (
          <Text style={{ color: '#ef4444', marginBottom: 16, fontWeight: '700' }}>🔴 Listening...</Text>
        )}
        {status === 'analyzing' && (
          <Text style={{ color: '#eab308', marginBottom: 16, fontWeight: '700' }}>⏳ Transcribing via Groq...</Text>
        )}
        {status === 'success' && (
          <Text style={{ color: '#22c55e', marginBottom: 16, fontWeight: '700', fontSize: 18 }}>{feedbackText}</Text>
        )}
        {status === 'error' && (
          <Text style={{ color: '#f87171', marginBottom: 16, fontWeight: '700', textAlign: 'center' }}>{feedbackText}</Text>
        )}

        <TouchableOpacity
          activeOpacity={0.8}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={status === 'analyzing' || status === 'success'}
          style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: isRecording ? '#ef4444' : accentColor,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: isRecording ? '#ef4444' : accentColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.5, shadowRadius: 10, elevation: 10,
            transform: [{ scale: isRecording ? 1.1 : 1 }]
          }}
        >
          <Text style={{ fontSize: 32 }}>🎤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Gameplay: Word Builder ───────────────────────────────────────────────────
function WordBuilder({
  data,
  accentColor,
  onComplete,
}: {
  data: WordBuilderEx[];
  accentColor: string;
  onComplete: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>(data[0].shuffled);
  const [status, setStatus] = useState<'playing' | 'success' | 'error'>('playing');

  const current = data[index];

  const handleWordSelect = (word: string, wordIdx: number) => {
    if (status !== 'playing') return;
    
    setSelectedWords([...selectedWords, word]);
    const newAvailable = [...availableWords];
    newAvailable.splice(wordIdx, 1);
    setAvailableWords(newAvailable);

    // If that was the last word, check it
    if (newAvailable.length === 0) {
      const finalSentence = [...selectedWords, word].join(' ');
      if (finalSentence === current.correct.join(' ')) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    }
  };

  const handleWordDeselect = (word: string, wordIdx: number) => {
    if (status !== 'playing' && status !== 'error') return;
    
    const newSelected = [...selectedWords];
    newSelected.splice(wordIdx, 1);
    setSelectedWords(newSelected);
    setAvailableWords([...availableWords, word]);
    setStatus('playing'); // Reset error state if they are correcting it
  };

  const handleNext = () => {
    if (index < data.length - 1) {
      setIndex(index + 1);
      setSelectedWords([]);
      setAvailableWords(data[index + 1].shuffled);
      setStatus('playing');
    } else {
      onComplete();
    }
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 40 }}>
      <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 20, fontWeight: '700', textAlign: 'center' }}>
        SENTENCE BUILDER {index + 1} OF {data.length}
      </Text>
      
      <Text style={{ color: '#ffffff', fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 40 }}>
        {current.english}
      </Text>

      {/* Selected words area */}
      <View style={{
        minHeight: 120, borderWidth: 2, borderStyle: 'dashed',
        borderColor: status === 'error' ? '#ef4444' : status === 'success' ? '#22c55e' : '#374151',
        borderRadius: 20, padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 10,
        alignContent: 'flex-start', marginBottom: 40,
        backgroundColor: status === 'error' ? '#450a0a' : status === 'success' ? '#052e16' : 'transparent'
      }}>
        {selectedWords.length === 0 && (
          <Text style={{ color: '#6b7280', fontSize: 16, fontStyle: 'italic', alignSelf: 'center', width: '100%', textAlign: 'center', marginTop: 30 }}>
            Tap words below to build the sentence
          </Text>
        )}
        {selectedWords.map((word, i) => (
          <TouchableOpacity
            key={`sel-${i}`}
            onPress={() => handleWordDeselect(word, i)}
            style={{
              backgroundColor: status === 'success' ? '#22c55e' : accentColor,
              paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '700' }}>{word}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Available words area */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
        {availableWords.map((word, i) => (
          <TouchableOpacity
            key={`avail-${i}`}
            onPress={() => handleWordSelect(word, i)}
            style={{
              backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151',
              paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
            }}
          >
            <Text style={{ color: '#d1d5db', fontSize: 18, fontWeight: '700' }}>{word}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer controls */}
      <View style={{ marginTop: 'auto', marginBottom: 40 }}>
        {status === 'error' && (
          <Text style={{ color: '#f87171', textAlign: 'center', marginBottom: 20, fontSize: 16, fontWeight: '700' }}>
            Not quite right. Tap a word above to remove it and try again.
          </Text>
        )}
        
        {status === 'success' && (
          <TouchableOpacity onPress={handleNext}>
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
            >
              <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '800' }}>
                Awesome! Continue ➔
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Gameplay: Quiz Section ───────────────────────────────────────────────────
function QuizSection({
  quiz,
  accentColor,
  onComplete,
}: {
  quiz: QuizQuestion[];
  accentColor: string;
  onComplete: (score: number) => void;
}) {
  const [answers, setAnswers]     = useState<(number | null)[]>(quiz.map(() => null));
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = answers.every(a => a !== null);
  const score = answers.filter((a, i) => a === quiz[i].answer).length;

  const handleSubmit = () => {
    setSubmitted(true);
  };

  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: 60 }}>
      {quiz.map((q, qi) => (
        <View key={qi} style={{ marginBottom: 24 }}>
          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700', marginBottom: 12, lineHeight: 24 }}>
            {qi + 1}. {q.q}
          </Text>
          {q.options.map((opt, oi) => {
            const isSelected = answers[qi] === oi;
            const isCorrect  = q.answer === oi;
            let bg     = '#111827';
            let border = '#1f2937';
            let text   = '#9ca3af';

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
                  backgroundColor: bg, borderRadius: 12,
                  borderWidth: 1.5, borderColor: border,
                  padding: 14, marginBottom: 8,
                  flexDirection: 'row', alignItems: 'center',
                }}
              >
                <View style={{
                  width: 24, height: 24, borderRadius: 12,
                  borderWidth: 1.5, borderColor: border,
                  alignItems: 'center', justifyContent: 'center',
                  marginRight: 12,
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
        <TouchableOpacity
          disabled={!allAnswered}
          onPress={handleSubmit}
          style={{ marginTop: 10 }}
        >
          <LinearGradient
            colors={allAnswered ? [accentColor, accentColor + 'cc'] : ['#1f2937', '#1f2937']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
          >
            <Text style={{
              color: allAnswered ? '#ffffff' : '#4b5563',
              fontSize: 16, fontWeight: '800',
            }}>
              {allAnswered ? 'Check Answers ✓' : `Answer all ${quiz.length} questions`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {submitted && (
        <View style={{
          backgroundColor: score >= (quiz.length / 2) ? '#052e16' : '#1c1917',
          borderRadius: 20, padding: 24, alignItems: 'center', marginTop: 10,
          borderWidth: 1, borderColor: score >= (quiz.length / 2) ? '#22c55e' : '#44403c',
        }}>
          <Text style={{ fontSize: 48 }}>{score === quiz.length ? '🏆' : score > (quiz.length / 2) ? '🎉' : '💪'}</Text>
          <Text style={{
            fontSize: 24, fontWeight: '900', color: score >= (quiz.length / 2) ? '#4ade80' : '#d6d3d1',
            marginTop: 12,
          }}>
            {score} / {quiz.length} correct
          </Text>
          <Text style={{ color: '#9ca3af', marginTop: 8, textAlign: 'center', fontSize: 15, lineHeight: 22 }}>
            {score === quiz.length
              ? 'Perfect score! You mastered this story.'
              : 'Great effort! Review the story anytime to improve.'}
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

// ─── Story reader (Multi-Stage) ───────────────────────────────────────────────
type Stage = 'reading' | 'speaking' | 'wordBuilder' | 'quiz' | 'finished';

function StoryReader({
  story,
  onClose,
}: {
  story: Story;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { addXp } = useStore();
  const [stage, setStage] = useState<Stage>('reading');
  const [totalXp, setTotalXp] = useState(0);

  const hasSpeaking = story.speaking && story.speaking.length > 0;
  const hasWordBuilder = story.wordBuilder && story.wordBuilder.length > 0;

  const handleAdvanceReading = () => {
    if (hasSpeaking) setStage('speaking');
    else if (hasWordBuilder) setStage('wordBuilder');
    else setStage('quiz');
  };

  const handleFinishQuiz = (score: number) => {
    const earned = (score * 10) + (hasSpeaking ? 20 : 0) + (hasWordBuilder ? 20 : 0);
    setTotalXp(earned);
    addXp(earned);
    setStage('finished');
  };

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0a0a0a', zIndex: 100 }}>
      {/* Header */}
      <LinearGradient
        colors={[story.accentColor + 'dd', '#0a0a0a']}
        style={{ paddingTop: insets.top + 10, paddingHorizontal: 16, paddingBottom: 16 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: 38, height: 38, borderRadius: 12,
              backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 19, fontWeight: '900', color: '#ffffff', letterSpacing: -0.4 }} numberOfLines={1}>
              {story.titleEnglish}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700' }}>
                {stage === 'reading' ? 'READING' : stage === 'speaking' ? 'SPEAKING LAB' : stage === 'wordBuilder' ? 'WORD BUILDER' : stage === 'quiz' ? 'QUIZ' : 'COMPLETE'}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>•</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{story.titleNative}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* STAGE: Reading */}
      {stage === 'reading' && (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 60 }}>
            <View style={{
              backgroundColor: story.genreColor + '11', borderRadius: 16,
              borderLeftWidth: 3, borderLeftColor: story.genreColor,
              padding: 14, marginBottom: 24,
            }}>
              <Text style={{ color: '#d1d5db', fontSize: 14, lineHeight: 22, fontStyle: 'italic' }}>
                "{story.tagline}"
              </Text>
            </View>

            {story.content.map((para, i) => (
              <Text
                key={i}
                style={{
                  fontSize: 16, color: '#e5e7eb', lineHeight: 28,
                  marginBottom: 16, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
                }}
              >
                {para}
              </Text>
            ))}

            <View style={{ height: 1, backgroundColor: '#1f2937', marginVertical: 28 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, marginRight: 10 }}>📚</Text>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#ffffff' }}>Key Vocabulary</Text>
            </View>
            {story.vocab.map((v, i) => (
              <VocabCard key={i} item={v} color={story.genreColor} />
            ))}

            <TouchableOpacity onPress={handleAdvanceReading} style={{ marginTop: 32 }}>
              <LinearGradient
                colors={[story.accentColor, story.accentColor + 'cc']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
              >
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800' }}>
                  {hasSpeaking ? 'Continue to Speaking Lab 🎤' : hasWordBuilder ? 'Continue to Word Builder 🧩' : 'Continue to Quiz 🧠'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* STAGE: Speaking Lab */}
      {stage === 'speaking' && story.speaking && (
        <SpeakingLab 
          data={story.speaking} 
          accentColor={story.accentColor} 
          onComplete={() => setStage(hasWordBuilder ? 'wordBuilder' : 'quiz')} 
        />
      )}

      {/* STAGE: Word Builder */}
      {stage === 'wordBuilder' && story.wordBuilder && (
        <WordBuilder 
          data={story.wordBuilder} 
          accentColor={story.accentColor} 
          onComplete={() => setStage('quiz')} 
        />
      )}

      {/* STAGE: Quiz */}
      {stage === 'quiz' && (
        <ScrollView style={{ flex: 1, paddingTop: 20 }}>
          <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 30 }}>
            Comprehension Check
          </Text>
          <QuizSection 
            quiz={story.quiz} 
            accentColor={story.accentColor} 
            onComplete={handleFinishQuiz} 
          />
        </ScrollView>
      )}

      {/* STAGE: Finished */}
      {stage === 'finished' && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 }}>
          <Text style={{ fontSize: 80, marginBottom: 20 }}>🎉</Text>
          <Text style={{ color: '#ffffff', fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 12 }}>
            Story Complete!
          </Text>
          <Text style={{ color: '#9ca3af', fontSize: 16, textAlign: 'center', marginBottom: 40, lineHeight: 24 }}>
            You completed the reading, interactive challenges, and the final quiz.
          </Text>

          <View style={{
            backgroundColor: story.accentColor + '22', borderRadius: 20, padding: 24,
            alignItems: 'center', borderWidth: 1, borderColor: story.accentColor, width: '100%', marginBottom: 40
          }}>
            <Text style={{ color: story.accentColor, fontSize: 14, fontWeight: '800', marginBottom: 8, letterSpacing: 1 }}>TOTAL REWARD</Text>
            <Text style={{ color: '#fbbf24', fontSize: 48, fontWeight: '900' }}>+{totalXp} XP</Text>
          </View>

          <TouchableOpacity onPress={onClose} style={{ width: '100%' }}>
            <View style={{ backgroundColor: '#1f2937', borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}>
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800' }}>Back to Stories</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Main: Stories Tab ────────────────────────────────────────────────────────
export default function StoriesTab() {
  const { language } = useStore();
  const insets       = useSafeAreaInsets();
  const [selected, setSelected] = useState<Story | null>(null);
  const [filter, setFilter]     = useState<'all' | 'te' | 'hi'>('all');

  // Determine default filter based on user's language
  const effectiveFilter = language
    ? (filter === 'all' ? (language === 'Telugu' ? 'te' : 'hi') : filter)
    : filter;

  const visible = STORIES.filter(s => effectiveFilter === 'all' || s.lang === effectiveFilter);

  const FILTERS: { key: 'all' | 'te' | 'hi'; label: string; emoji: string }[] = [
    { key: 'all', label: 'All', emoji: '🌐' },
    { key: 'te',  label: 'Telugu', emoji: '🪷' },
    { key: 'hi',  label: 'Hindi',  emoji: '🇮🇳' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 56 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 16, marginBottom: 4 }}>
          <Text style={{ fontSize: 28, fontWeight: '900', color: '#ffffff', letterSpacing: -1 }}>
            Stories
          </Text>
          <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
            Immersive reading, speaking, and building challenges
          </Text>
        </View>

        <View style={{
          flexDirection: 'row', paddingHorizontal: 16,
          paddingVertical: 12, gap: 8,
        }}>
          {FILTERS.map(f => {
            const isActive = effectiveFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  paddingHorizontal: 16, paddingVertical: 8,
                  borderRadius: 20, borderWidth: 1.5,
                  backgroundColor: isActive ? '#1e3a8a' : '#111827',
                  borderColor: isActive ? '#3b82f6' : '#1f2937',
                }}
              >
                <Text style={{ fontSize: 14 }}>{f.emoji}</Text>
                <Text style={{
                  fontSize: 13, fontWeight: '700',
                  color: isActive ? '#93c5fd' : '#4b5563',
                }}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          <View style={{ flex: 1 }} />
          <View style={{
            backgroundColor: '#1f2937', borderRadius: 20,
            paddingHorizontal: 12, paddingVertical: 8,
            justifyContent: 'center',
          }}>
            <Text style={{ color: '#6b7280', fontSize: 13, fontWeight: '700' }}>
              {visible.length} stories
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
          {visible.map(story => (
            <StoryCard
              key={story.id}
              story={story}
              onPress={() => setSelected(story)}
            />
          ))}
        </View>

        <View style={{
          marginHorizontal: 16, marginTop: 8,
          backgroundColor: '#111827', borderRadius: 16,
          padding: 16, borderWidth: 1, borderColor: '#1f2937',
          flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        }}>
          <Text style={{ fontSize: 20 }}>💡</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#9ca3af', fontSize: 13, lineHeight: 20 }}>
              <Text style={{ color: '#d1d5db', fontWeight: '700' }}>New gameplay mode! </Text>
              Read the story, then complete the Speaking Lab and Word Builder to earn up to 80 XP.
            </Text>
          </View>
        </View>
      </ScrollView>

      {selected && (
        <StoryReader
          story={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </View>
  );
}
