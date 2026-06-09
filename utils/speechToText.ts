import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

// ============================================================================
// ⚠️ ACTION REQUIRED: PASTE YOUR GROQ API KEY HERE ⚠️
// Get a free key from: https://console.groq.com/keys
// ============================================================================
const GROQ_API_KEY: string = 'gsk_your_api_key_here';

import { useStore } from '../store/useStore';

export async function transcribeAudio(uri: string, lang: 'te' | 'hi'): Promise<string | null> {
  const customKey = useStore.getState().groqApiKey;
  const apiKey = customKey || GROQ_API_KEY;

  if (apiKey === 'gsk_your_api_key_here') {
    console.error('[STT] Groq API key is missing. Please add it to utils/speechToText.ts');
    throw new Error('MISSING_API_KEY');
  }

  try {
    // 1. Prepare the file
    // Expo Audio.Recording usually gives us a local file URI (e.g. file:///.../audio.m4a)
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('Audio file does not exist at URI: ' + uri);
    }

    // React Native FormData requires a specific object format for files, but WinterCG fetch
    // in Expo 56 doesn't support the non-standard React Native object part.
    // Instead, we use expo-file-system's native uploadAsync which is far more reliable.
    console.log('[STT] Sending audio to Groq Whisper API...');

    const uploadResponse = await FileSystem.uploadAsync(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      uri,
      {
        fieldName: 'file',
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        parameters: {
          model: 'whisper-large-v3',
          language: lang,
          response_format: 'json',
        },
      }
    );

    if (uploadResponse.status !== 200) {
      console.error('[STT] API Error Response:', uploadResponse.body);
      throw new Error(`API returned ${uploadResponse.status}: ${uploadResponse.body}`);
    }

    const data = JSON.parse(uploadResponse.body);
    console.log('[STT] Transcription Success:', data.text);
    return data.text.trim();

  } catch (error) {
    console.error('[STT] Transcription failed:', error);
    return null;
  }
}

// Simple helper to check if two strings loosely match (ignoring punctuation, case, whitespace)
export function checkPronunciation(spoken: string, expected: string): boolean {
  const normalize = (s: string) =>
    s.toLowerCase()
      .replace(/[.,!?।\s]/g, ''); // Remove all punctuation and whitespace

  const normSpoken = normalize(spoken);
  const normExpected = normalize(expected);

  // Allow for slight variations or perfect match
  return normSpoken.includes(normExpected) || normExpected.includes(normSpoken) || normSpoken === normExpected;
}
