// ============================================================================
// ⚠️ ACTION REQUIRED: PASTE YOUR OPENROUTER API KEY HERE ⚠️
// Get a free key from: https://openrouter.ai/keys
// ============================================================================
const OPENROUTER_API_KEY: string = 'sk-or-v1-your_openrouter_key_here';

import { useStore } from '../store/useStore';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type TaskType = 'chat' | 'grammar' | 'story_generation';

export async function chatWithAI(messages: ChatMessage[], taskType: TaskType = 'chat'): Promise<string | null> {
  const customKey = useStore.getState().openRouterApiKey;
  const apiKey = customKey || OPENROUTER_API_KEY;

  if (apiKey === 'sk-or-v1-your_openrouter_key_here') {
    console.error('[AI] OpenRouter API key is missing. Please add it to utils/openRouter.ts');
    throw new Error('MISSING_API_KEY');
  }

  // Intelligently select the best free model based on the task
  let selectedModel = 'google/gemini-2.5-pro:free';
  if (taskType === 'chat') {
    selectedModel = 'meta-llama/llama-3-8b-instruct'; // Faster for simple chat
  } else if (taskType === 'grammar') {
    selectedModel = 'google/gemini-2.5-pro:free'; // Better logic/reasoning
  } else if (taskType === 'story_generation') {
    selectedModel = 'google/gemini-2.5-pro:free'; // Better creative writing
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://brightlingo.app', // Required by OpenRouter
        'X-Title': 'Bright Lingo',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // OpenRouter Fallback Routing: Try primary model, fallback to others if busy
        models: [selectedModel, 'google/gemini-2.5-pro:free', 'mistralai/mistral-7b-instruct:free'],
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI] API Error:', errorText);
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error('[AI] Chat failed:', error);
    return null;
  }
}
