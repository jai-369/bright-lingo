import * as Network from 'expo-network';

export async function fetchDefinition(word: string): Promise<string | null> {
  try {
    const networkState = await Network.getNetworkStateAsync();
    
    if (!networkState.isConnected || networkState.isInternetReachable === false) {
      console.log('[Wiktionary] Offline. Silently returning null.');
      return null;
    }

    const url = `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word.toLowerCase())}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return null; // Not found or error
    }

    const json = await response.json();
    
    // Attempt to extract the first English definition
    if (json.en && json.en.length > 0 && json.en[0].definitions && json.en[0].definitions.length > 0) {
      const rawDefinition = json.en[0].definitions[0].definition;
      // Strip HTML tags
      const cleanDefinition = rawDefinition.replace(/<[^>]*>?/gm, '').trim();
      return cleanDefinition;
    }

    return null;
  } catch (error) {
    console.warn('[Wiktionary] Error fetching definition:', error);
    return null; // Silent failure
  }
}
