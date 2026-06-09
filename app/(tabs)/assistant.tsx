import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../store/useStore';
import { chatWithAI, ChatMessage } from '../../utils/openRouter';
import * as Speech from 'expo-speech';

export default function AssistantTab() {
  const insets = useSafeAreaInsets();
  const { displayName, language, xp, currentStreak } = useStore();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Initialize the chat context
  useEffect(() => {
    const initChat = async () => {
      setIsLoading(true);
      const systemPrompt: ChatMessage = {
        role: 'system',
        content: `You are Hootie, the Bright Lingo Personal Progress AI Tutor, taking the persona of a friendly, wise, and highly encouraging Owl 🦉. 
        The user's name is ${displayName || 'Learner'}. 
        They are learning ${language || 'a new language'}. 
        Their current XP is ${xp} and their learning streak is ${currentStreak} days.
        Your job is to:
        1. Analyze their progress and personalize their learning.
        2. Act as an interactive, highly motivating tutor.
        3. Suggest their next lessons or practice new words dynamically based on their language.
        4. Keep your responses engaging, well-formatted, and relatively concise (under 150 words usually).
        5. Greet them enthusiastically based on their current stats right now!`,
      };

      try {
        const firstResponse = await chatWithAI([systemPrompt]);
        if (firstResponse) {
          setMessages([
            systemPrompt,
            { role: 'assistant', content: firstResponse }
          ]);
          Speech.speak(firstResponse.replace(/[*_]/g, ''), { rate: 0.95 });
        } else {
          setMessages([
            systemPrompt,
            { role: 'assistant', content: "Hello! I'm your Personal Progress AI. Unfortunately, my API key isn't set up yet. Please add your OpenRouter API key in utils/openRouter.ts!" }
          ]);
        }
      } catch (err) {
        setMessages([
          systemPrompt,
          { role: 'assistant', content: "Oops! I couldn't connect. Please make sure your OpenRouter API key is configured correctly in utils/openRouter.ts." }
        ]);
      }
      setIsLoading(false);
    };

    if (messages.length === 0) {
      initChat();
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatWithAI(updatedMessages);
      if (response) {
        setMessages([...updatedMessages, { role: 'assistant', content: response }]);
        Speech.speak(response.replace(/[*_]/g, ''), { rate: 0.95 });
      }
    } catch (err) {
      console.error(err);
    }
    
    setIsLoading(false);
  };

  // Auto-scroll
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isLoading]);

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#0a0a0a' }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 }}>
        <Text style={{ fontSize: 28, fontWeight: '900', color: '#ffffff', letterSpacing: -1 }}>
          Hootie the Tutor 🦉
        </Text>
        <Text style={{ fontSize: 14, color: '#10b981', marginTop: 4, fontWeight: '700' }}>
          Your personalized {language} learning guide
        </Text>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
      >
        {messages.filter(m => m.role !== 'system').map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <View 
              key={index} 
              style={{ 
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                marginBottom: 16,
              }}
            >
              {!isUser && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, marginLeft: 4 }}>
                  <Text style={{ fontSize: 14, marginRight: 4 }}>🦉</Text>
                  <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '700' }}>
                    Hootie
                  </Text>
                </View>
              )}
              <LinearGradient
                colors={isUser ? ['#2563eb', '#1d4ed8'] : ['#1f2937', '#111827']}
                style={{
                  borderRadius: 20,
                  borderBottomRightRadius: isUser ? 4 : 20,
                  borderBottomLeftRadius: !isUser ? 4 : 20,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: isUser ? '#3b82f6' : '#374151'
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 15, lineHeight: 22 }}>
                  {msg.content}
                </Text>
              </LinearGradient>
            </View>
          );
        })}
        
        {isLoading && (
          <View style={{ alignSelf: 'flex-start', marginLeft: 4, marginTop: 8 }}>
            <ActivityIndicator color="#10b981" />
          </View>
        )}
      </ScrollView>

      <View style={{ 
        padding: 12, 
        paddingBottom: Math.max(insets.bottom, 12),
        backgroundColor: '#0f172a',
        borderTopWidth: 1,
        borderTopColor: '#1f2937',
        flexDirection: 'row',
        alignItems: 'center'
      }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask me anything in English or your target language..."
          placeholderTextColor="#6b7280"
          style={{
            flex: 1,
            backgroundColor: '#1f2937',
            color: '#ffffff',
            borderRadius: 24,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 15,
            borderWidth: 1,
            borderColor: '#374151',
            marginRight: 10,
          }}
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          onPress={handleSend}
          disabled={!input.trim() || isLoading}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: input.trim() && !isLoading ? '#10b981' : '#374151',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 20 }}>↗</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
