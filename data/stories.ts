import { TELUGU_STORIES } from './stories/telugu';
import { HINDI_STORIES } from './stories/hindi';

export interface VocabItem {
  native: string;
  transliteration: string;
  english: string;
}

export interface QuizQuestion {
  q: string;
  options: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
}

export interface SpeakingSentence {
  native: string;        // sentence in native script
  roman: string;         // romanization
  english: string;       // English meaning
  lang: 'te' | 'hi';    // for TTS language code
}

export interface WordBuilderEx {
  english: string;       // English clue
  correct: string[];     // correct word order
  shuffled: string[];    // pre-shuffled display order
}

export interface Story {
  id: string;
  lang: 'te' | 'hi';
  emoji: string;
  genre: string;
  genreColor: string;
  accentColor: string;
  difficulty: 'A1' | 'A2' | 'B1';
  readMin: number;
  titleNative: string;
  titleRoman: string;
  titleEnglish: string;
  tagline: string;
  content: string[];
  vocab: VocabItem[];
  quiz: QuizQuestion[];
  speaking?: SpeakingSentence[];   // gameplay: speaking lab
  wordBuilder?: WordBuilderEx[];   // gameplay: word builder
}

export const STORIES: Story[] = [
  ...TELUGU_STORIES,
  ...HINDI_STORIES,
];
