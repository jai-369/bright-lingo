import { ScrollView, View, Text, TextInput } from 'react-native';
import { useStore } from '../../store/useStore';
import { LinearGradient } from 'expo-linear-gradient';

function StatCard({ emoji, value, label, color }: { emoji: string; value: string | number; label: string; color: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#111827', borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1f2937' }}>
      <Text style={{ fontSize: 28, marginBottom: 4 }}>{emoji}</Text>
      <Text style={{ fontSize: 24, fontWeight: '900', color }}>{value}</Text>
      <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '600', marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function HeartBar({ current, max = 5 }: { current: number; max?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
      {Array.from({ length: max }).map((_, i) => (
        <Text key={i} style={{ fontSize: 24, opacity: i < current ? 1 : 0.25 }}>❤️</Text>
      ))}
    </View>
  );
}

export default function ProfileTab() {
  const { displayName, language, skillLevel, hearts, xp, currentStreak } = useStore();

  const levelLabel = xp < 100 ? 'Newcomer' : xp < 300 ? 'Explorer' : xp < 700 ? 'Adventurer' : 'Champion';
  const nextLevel = xp < 100 ? 100 : xp < 300 ? 300 : xp < 700 ? 700 : 1000;
  const progress = (xp / nextLevel) * 100;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0a0a0a' }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      {/* Profile Banner */}
      <LinearGradient colors={['#1e3a8a', '#1d4ed8', '#7c3aed']} style={{ paddingTop: 40, paddingBottom: 60, alignItems: 'center' }}>
        <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>
          <Text style={{ fontSize: 48 }}>{language === 'Telugu' ? '🪷' : '🇮🇳'}</Text>
        </View>
        <Text style={{ fontSize: 28, fontWeight: '900', color: '#ffffff', letterSpacing: -0.5 }}>{displayName || 'Learner'}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 }}>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '600' }}>
            Learning {language || 'English'} · {skillLevel || 'Beginner'}
          </Text>
        </View>
      </LinearGradient>

      {/* Level Card */}
      <View style={{ marginHorizontal: 16, marginTop: -32, backgroundColor: '#111827', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#1f2937', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 20, marginRight: 10 }}>🏅</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#9ca3af', fontSize: 13, fontWeight: '600' }}>Current Level</Text>
            <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '800' }}>{levelLabel}</Text>
          </View>
          <Text style={{ color: '#eab308', fontWeight: '700', fontSize: 16 }}>{xp} XP</Text>
        </View>
        {/* XP Bar */}
        <View style={{ height: 10, backgroundColor: '#1f2937', borderRadius: 5 }}>
          <LinearGradient colors={['#eab308', '#f97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ height: 10, borderRadius: 5, width: `${Math.min(100, progress)}%` }} />
        </View>
        <Text style={{ color: '#4b5563', fontSize: 12, marginTop: 6 }}>{xp} / {nextLevel} XP to next level</Text>
      </View>

      {/* Stats Grid */}
      <View style={{ flexDirection: 'row', gap: 12, marginHorizontal: 16, marginTop: 16 }}>
        <StatCard emoji="🔥" value={currentStreak} label="Day Streak" color="#f97316" />
        <StatCard emoji="⚡" value={xp} label="Total XP" color="#eab308" />
        <StatCard emoji="🎯" value={skillLevel || 'Beginner'} label="Level" color="#a855f7" />
      </View>

      {/* Hearts */}
      <View style={{ marginHorizontal: 16, marginTop: 16, backgroundColor: '#111827', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#1f2937' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 18, marginRight: 8 }}>❤️</Text>
          <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 18 }}>Hearts</Text>
          <Text style={{ color: '#6b7280', marginLeft: 'auto', fontSize: 14 }}>{hearts}/5</Text>
        </View>
        <HeartBar current={hearts} />
        {hearts < 5 && (
          <Text style={{ color: '#4b5563', fontSize: 12, marginTop: 12 }}>
            ⏱ Hearts regenerate 1 every 4 hours
          </Text>
        )}
      </View>

      {/* Achievements */}
      <View style={{ marginHorizontal: 16, marginTop: 16 }}>
        <Text style={{ color: '#9ca3af', fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Achievements</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {[
            { emoji: '🌟', label: 'First Lesson', locked: xp === 0 },
            { emoji: '🔥', label: '3-Day Streak', locked: currentStreak < 3 },
            { emoji: '💯', label: '100 XP', locked: xp < 100 },
          ].map((a, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: '#111827', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: a.locked ? '#1f2937' : '#374151', opacity: a.locked ? 0.4 : 1 }}>
              <Text style={{ fontSize: 28 }}>{a.emoji}</Text>
              <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: '600', marginTop: 6, textAlign: 'center' }}>{a.label}</Text>
            </View>
          ))}
        </View>
      </View>
      {/* API Keys Settings */}
      <View style={{ marginHorizontal: 16, marginTop: 16, backgroundColor: '#111827', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#1f2937' }}>
        <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '800', marginBottom: 16 }}>API Settings</Text>
        <Text style={{ color: '#9ca3af', fontSize: 13, marginBottom: 12 }}>
          You can provide your own API keys to run the app. If left blank, the app will use the default keys if available.
        </Text>
        
        <Text style={{ color: '#d1d5db', fontSize: 14, fontWeight: '600', marginBottom: 6 }}>Groq API Key (Voice)</Text>
        <TextInput
          value={useStore(s => s.groqApiKey) || ''}
          onChangeText={(text) => useStore.getState().setApiKeys(text, useStore.getState().openRouterApiKey || '')}
          placeholder="gsk_..."
          placeholderTextColor="#4b5563"
          secureTextEntry
          style={{ backgroundColor: '#1f2937', color: '#ffffff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#374151', marginBottom: 16 }}
        />

        <Text style={{ color: '#d1d5db', fontSize: 14, fontWeight: '600', marginBottom: 6 }}>OpenRouter API Key (Chat)</Text>
        <TextInput
          value={useStore(s => s.openRouterApiKey) || ''}
          onChangeText={(text) => useStore.getState().setApiKeys(useStore.getState().groqApiKey || '', text)}
          placeholder="sk-or-v1-..."
          placeholderTextColor="#4b5563"
          secureTextEntry
          style={{ backgroundColor: '#1f2937', color: '#ffffff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#374151' }}
        />
      </View>
    </ScrollView>
  );
}
