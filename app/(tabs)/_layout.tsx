import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { LinearGradient } from 'expo-linear-gradient';

function GlobalHeader() {
  const insets = useSafeAreaInsets();
  const { hearts, xp, currentStreak } = useStore();

  return (
    <LinearGradient
      colors={['#0f172a', '#111827']}
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: 14,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#1f2937',
      }}
    >
      {/* Logo */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#ffffff', letterSpacing: -0.5 }}>
          Bright<Text style={{ color: '#3b82f6' }}> Lingo</Text>
        </Text>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {/* Streak */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1f2937', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, borderWidth: 1, borderColor: currentStreak > 0 ? '#f97316' : '#374151' }}>
          <Text style={{ fontSize: 16 }}>🔥</Text>
          <Text style={{ color: currentStreak > 0 ? '#f97316' : '#6b7280', fontWeight: '800', fontSize: 15, marginLeft: 4 }}>{currentStreak}</Text>
        </View>
        {/* Hearts */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1f2937', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, borderWidth: 1, borderColor: hearts > 0 ? '#ef4444' : '#374151' }}>
          <Text style={{ fontSize: 16 }}>❤️</Text>
          <Text style={{ color: hearts > 0 ? '#ef4444' : '#6b7280', fontWeight: '800', fontSize: 15, marginLeft: 4 }}>{hearts}</Text>
        </View>
        {/* XP */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1f2937', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#eab308' }}>
          <Text style={{ fontSize: 16 }}>⚡</Text>
          <Text style={{ color: '#eab308', fontWeight: '800', fontSize: 15, marginLeft: 4 }}>{xp}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

export default function TabLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <GlobalHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0f172a',
            borderTopColor: '#1f2937',
            borderTopWidth: 1,
            height: 64,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#3b82f6',
          tabBarInactiveTintColor: '#4b5563',
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Learn',
            tabBarIcon: ({ focused }) => (
              <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? '#1e3a8a' : 'transparent', borderRadius: 8 }}>
                <Text style={{ fontSize: 18 }}>🏠</Text>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="stories"
          options={{
            title: 'Stories',
            tabBarIcon: ({ focused }) => (
              <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? '#4c1d95' : 'transparent', borderRadius: 8 }}>
                <Text style={{ fontSize: 18 }}>📖</Text>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="reading"
          options={{
            title: 'News',
            tabBarIcon: ({ focused }) => (
              <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? '#1e3a8a' : 'transparent', borderRadius: 8 }}>
                <Text style={{ fontSize: 18 }}>📰</Text>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="assistant"
          options={{
            title: 'AI Tutor',
            tabBarIcon: ({ focused }) => (
              <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? '#065f46' : 'transparent', borderRadius: 8 }}>
                <Text style={{ fontSize: 18 }}>🤖</Text>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }) => (
              <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? '#1e3a8a' : 'transparent', borderRadius: 8 }}>
                <Text style={{ fontSize: 18 }}>👤</Text>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="grammar"
          options={{
            title: 'Grammar',
            tabBarIcon: ({ focused }) => (
              <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? '#b91c1c' : 'transparent', borderRadius: 8 }}>
                <Text style={{ fontSize: 18 }}>📝</Text>
              </View>
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
