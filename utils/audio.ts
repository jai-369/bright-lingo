import * as FileSystem from 'expo-file-system/legacy';
import { createAudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import * as Network from 'expo-network';

const AUDIO_CDN_BASE = 'https://cdn.jsdelivr.net/gh/username/repo@main/audio';
const AUDIO_CACHE_DIR = FileSystem.cacheDirectory + 'audio/';

async function ensureCacheDirExists() {
  const dirInfo = await FileSystem.getInfoAsync(AUDIO_CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(AUDIO_CACHE_DIR, { intermediates: true });
  }
}

export async function playWord(word: string) {
  const normalizedWord = word.toLowerCase().trim();
  await ensureCacheDirExists();
  const localUri = AUDIO_CACHE_DIR + `${normalizedWord}.mp3`;

  try {
    // Check if cached locally
    const fileInfo = await FileSystem.getInfoAsync(localUri);

    if (fileInfo.exists) {
      console.log('[playWord] Playing from local cache:', localUri);
      await playAudioFile(localUri, normalizedWord);
      return;
    }

    // Check Network
    const networkState = await Network.getNetworkStateAsync();

    if (networkState.isConnected && networkState.isInternetReachable !== false) {
      console.log('[playWord] File not cached. Downloading from CDN...');
      const remoteUrl = `${AUDIO_CDN_BASE}/${encodeURIComponent(normalizedWord)}.mp3`;
      
      const downloadResult = await FileSystem.downloadAsync(remoteUrl, localUri);
      
      if (downloadResult.status === 200) {
        console.log('[playWord] Download complete. Playing:', localUri);
        await playAudioFile(downloadResult.uri, normalizedWord);
        return;
      } else {
        console.warn(`[playWord] CDN Download failed with status ${downloadResult.status}. Falling back to TTS.`);
      }
    } else {
      console.log('[playWord] Offline and file not cached. Falling back to TTS.');
    }
    
  } catch (error) {
    console.error('[playWord] Error during audio resolution:', error);
  }

  // Fallback
  console.log(`[playWord] Using TTS Fallback for: "${word}"`);
  Speech.speak(word);
}

async function playAudioFile(uri: string, word: string) {
  try {
    const player = createAudioPlayer(uri);
    player.play();

    // The player will automatically be garbage collected when out of scope,
    // but if we had precise status listeners we would call player.release() here.
    // For short words, relying on GC or unmanaged playback is fine in SDK 56.
  } catch (err) {
    console.error('[playWord] Failed to play audio file:', err);
    Speech.speak(word); // ultimate fallback
  }
}
