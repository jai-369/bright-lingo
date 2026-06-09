import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { getDb } from '../../db/assetDb';
import * as Network from 'expo-network';
import { LinearGradient } from 'expo-linear-gradient';

interface Article {
  title: string;
  description: string;
  link: string;
  readingTime?: number;
}

function ArticleCard({ article, index }: { article: Article; index: number }) {
  const colors = [
    ['#1e3a8a', '#1d4ed8'],
    ['#14532d', '#166534'],
    ['#581c87', '#7e22ce'],
    ['#7c2d12', '#c2410c'],
    ['#0c4a6e', '#0369a1'],
  ] as const;
  const [c1, c2] = colors[index % colors.length];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => Linking.openURL(article.link).catch(console.error)}
      style={{ marginBottom: 16 }}
    >
      <View style={{ backgroundColor: '#111827', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#1f2937' }}>
        <LinearGradient colors={[c1, c2]} style={{ height: 6 }} />
        <View style={{ padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ backgroundColor: c1 + '44', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: c2 + '66' }}>
              <Text style={{ color: '#93c5fd', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>VOA Learning English</Text>
            </View>
            {article.readingTime && (
              <Text style={{ color: '#4b5563', fontSize: 12, marginLeft: 'auto' }}>⏱ {article.readingTime} min read</Text>
            )}
          </View>
          <Text style={{ fontSize: 17, fontWeight: '800', color: '#ffffff', lineHeight: 24, marginBottom: 8 }}>{article.title}</Text>
          {article.description ? (
            <Text style={{ fontSize: 14, color: '#6b7280', lineHeight: 20 }}>{article.description}</Text>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14 }}>
            <Text style={{ color: '#3b82f6', fontSize: 13, fontWeight: '700' }}>Read full article →</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ReadingTab() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    fetchReadingFeed();
  }, []);

  const fetchReadingFeed = async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      setIsOnline(!!networkState.isConnected);

      const db = getDb();
      const cachedFeedRow = await db.getFirstAsync<{ value: string }>('SELECT value FROM Metadata WHERE key = ?', ['feed_articles']);
      const lastFetchRow  = await db.getFirstAsync<{ value: string }>('SELECT value FROM Metadata WHERE key = ?', ['feed_last_fetch']);

      if (cachedFeedRow) {
        setArticles(JSON.parse(cachedFeedRow.value));
        setLoading(false);
      }

      const now = Date.now();
      const lastFetch = lastFetchRow ? parseInt(lastFetchRow.value, 10) : 0;

      if (now - lastFetch > 24 * 60 * 60 * 1000 && networkState.isConnected && networkState.isInternetReachable !== false) {
        const response = await fetch('https://learningenglish.voanews.com/api/epiqq');
        if (response.ok) {
          const xml = await response.text();
          const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
          const freshArticles: Article[] = [];

          for (let i = 0; i < Math.min(5, items.length); i++) {
            const itemXml = items[i];
            const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
            const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
            const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/);

            if (titleMatch && linkMatch) {
              let description = descMatch ? descMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>?/gm, '').trim() : '';
              if (description.length > 180) description = description.substring(0, 180) + '…';
              const readingTime = Math.max(1, Math.round(description.split(' ').length / 200));
              freshArticles.push({
                title: titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
                link: linkMatch[1].trim(),
                description,
                readingTime,
              });
            }
          }

          if (freshArticles.length > 0) {
            setArticles(freshArticles);
            await db.runAsync(`INSERT OR REPLACE INTO Metadata (key, value) VALUES ('feed_articles', ?)`, [JSON.stringify(freshArticles)]);
            await db.runAsync(`INSERT OR REPLACE INTO Metadata (key, value) VALUES ('feed_last_fetch', ?)`, [now.toString()]);
          }
        }
      }
    } catch (error) {
      console.warn('[ReadingTab] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0a0a0a' }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: '900', color: '#ffffff', letterSpacing: -1 }}>Daily Reading</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isOnline ? '#22c55e' : '#6b7280', marginRight: 6 }} />
          <Text style={{ color: '#6b7280', fontSize: 14 }}>
            {isOnline ? 'Live feed from VOA Learning English' : 'Cached articles — you\'re offline'}
          </Text>
        </View>
      </View>

      {loading && articles.length === 0 ? (
        <View style={{ alignItems: 'center', paddingTop: 80 }}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={{ color: '#6b7280', marginTop: 16 }}>Fetching today's articles…</Text>
        </View>
      ) : articles.length === 0 ? (
        <View style={{ alignItems: 'center', paddingTop: 80 }}>
          <Text style={{ fontSize: 56 }}>📵</Text>
          <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '800', marginTop: 16 }}>No Articles Yet</Text>
          <Text style={{ color: '#6b7280', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
            Connect to the internet to download today's reading practice
          </Text>
        </View>
      ) : (
        articles.map((article, idx) => (
          <ArticleCard key={idx} article={article} index={idx} />
        ))
      )}
    </ScrollView>
  );
}
