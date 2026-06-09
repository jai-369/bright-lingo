export interface GrammarSection {
  heading: string;
  content: string;
  examples: { english: string; native_te: string; native_hi: string }[];
}

export interface GrammarQuiz {
  q: string;
  options: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
}

export interface GrammarLesson {
  id: string;
  title: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  icon: string;
  color: string;
  sections: GrammarSection[];
  quiz: GrammarQuiz[];
}

export const GRAMMAR_LESSONS: GrammarLesson[] = [
  {
    id: 'g-nouns-1',
    title: 'Introduction to Nouns',
    level: 'Beginner',
    description: 'Learn about naming words: people, places, and things.',
    icon: '🍎',
    color: '#ef4444',
    sections: [
      {
        heading: 'What is a Noun?',
        content: 'A noun is a word that names a person, place, thing, or idea. It is one of the most important parts of speech because it tells us what we are talking about.',
        examples: [
          { english: 'Boy', native_te: 'బాలుడు (Bāluḍu)', native_hi: 'लड़का (Laṛkā)' },
          { english: 'City', native_te: 'నగరం (Nagaram)', native_hi: 'शहर (Śahar)' },
          { english: 'Apple', native_te: 'యాపిల్ (Yāpil)', native_hi: 'सेब (Seb)' }
        ]
      },
      {
        heading: 'Common vs. Proper Nouns',
        content: 'Common nouns are general names for things (like "city" or "boy"). Proper nouns are specific names and always start with a capital letter (like "London" or "Ravi").',
        examples: [
          { english: 'He is a boy.', native_te: 'అతను ఒక బాలుడు.', native_hi: 'वह एक लड़का है।' },
          { english: 'His name is Ravi.', native_te: 'అతని పేరు రవి.', native_hi: 'उसका नाम रवि है।' }
        ]
      }
    ],
    quiz: [
      {
        q: 'Which of the following is a Proper Noun?',
        options: ['dog', 'book', 'India', 'tree'],
        answer: 2
      },
      {
        q: 'Identify the noun in this sentence: "The cat is sleeping."',
        options: ['The', 'cat', 'is', 'sleeping'],
        answer: 1
      },
      {
        q: 'What type of noun is "city"?',
        options: ['Proper Noun', 'Common Noun', 'Verb', 'Adjective'],
        answer: 1
      }
    ]
  },
  {
    id: 'g-pronouns-1',
    title: 'Personal Pronouns',
    level: 'Beginner',
    description: 'Words that take the place of nouns (I, you, he, she, it).',
    icon: '👤',
    color: '#3b82f6',
    sections: [
      {
        heading: 'What is a Pronoun?',
        content: 'A pronoun is a word used instead of a noun to avoid repeating the noun over and over. "I, you, he, she, it, we, they" are personal pronouns.',
        examples: [
          { english: 'I', native_te: 'నేను (Nēnu)', native_hi: 'मैं (Maiṁ)' },
          { english: 'You', native_te: 'మీరు/నువ్వు (Mīru/Nuvvu)', native_hi: 'तुम/आप (Tum/Āp)' },
          { english: 'He', native_te: 'అతను (Atanu)', native_hi: 'वह (Vah - Male)' },
          { english: 'She', native_te: 'ఆమె (Āme)', native_hi: 'वह (Vah - Female)' }
        ]
      },
      {
        heading: 'Using Pronouns in Sentences',
        content: 'Pronouns help make sentences flow better. Instead of saying "Ravi is happy. Ravi is smiling," we say "Ravi is happy. He is smiling."',
        examples: [
          { english: 'She is my sister.', native_te: 'ఆమె నా సోదరి.', native_hi: 'वह मेरी बहन है।' },
          { english: 'They are playing.', native_te: 'వారు ఆడుతున్నారు.', native_hi: 'वे खेल रहे हैं।' }
        ]
      }
    ],
    quiz: [
      {
        q: 'Which word is a pronoun?',
        options: ['table', 'beautiful', 'they', 'run'],
        answer: 2
      },
      {
        q: 'Replace the noun with a pronoun: "___ (Sita) is a doctor."',
        options: ['He', 'She', 'It', 'They'],
        answer: 1
      },
      {
        q: 'Which pronoun is used for a thing or an animal?',
        options: ['He', 'We', 'It', 'She'],
        answer: 2
      }
    ]
  },
  {
    id: 'g-verbs-be',
    title: 'The "To Be" Verb',
    level: 'Beginner',
    description: 'Learn the most common verb in English: am, is, are.',
    icon: '⚙️',
    color: '#eab308',
    sections: [
      {
        heading: 'Am, Is, Are',
        content: 'The verb "to be" describes the state of something or someone. In the present tense, it takes three forms: am, is, and are.',
        examples: [
          { english: 'I am', native_te: 'నేను ఉన్నాను', native_hi: 'मैं हूँ' },
          { english: 'He/She/It is', native_te: 'అతను/ఆమె/అది ఉంది', native_hi: 'वह है' },
          { english: 'We/You/They are', native_te: 'మేము/మీరు/వారు ఉన్నారు', native_hi: 'हम/तुम/वे हैं' }
        ]
      },
      {
        heading: 'Making Sentences',
        content: 'We use "to be" to talk about names, ages, feelings, and professions.',
        examples: [
          { english: 'I am happy.', native_te: 'నేను సంతోషంగా ఉన్నాను.', native_hi: 'मैं खुश हूँ।' },
          { english: 'They are students.', native_te: 'వారు విద్యార్థులు.', native_hi: 'वे छात्र हैं।' },
          { english: 'She is a teacher.', native_te: 'ఆమె ఉపాధ్యాయురాలు.', native_hi: 'वह एक शिक्षिका है।' }
        ]
      }
    ],
    quiz: [
      {
        q: 'Fill in the blank: I ___ a student.',
        options: ['is', 'are', 'am', 'be'],
        answer: 2
      },
      {
        q: 'Which sentence is correct?',
        options: ['He are tall.', 'They is friends.', 'She am a doctor.', 'You are beautiful.'],
        answer: 3
      },
      {
        q: 'Fill in the blank: The dog ___ hungry.',
        options: ['is', 'am', 'are', 'be'],
        answer: 0
      }
    ]
  },
  {
    id: 'g-present-simple',
    title: 'Present Simple Tense',
    level: 'Intermediate',
    description: 'Talk about habits, facts, and daily routines.',
    icon: '⏳',
    color: '#8b5cf6',
    sections: [
      {
        heading: 'When to use Present Simple?',
        content: 'We use the Present Simple tense to talk about things that happen regularly (habits) or things that are always true (facts).',
        examples: [
          { english: 'I wake up at 7 AM.', native_te: 'నేను ఉదయం 7 గంటలకు నిద్రలేస్తాను.', native_hi: 'मैं सुबह 7 बजे उठता हूँ।' },
          { english: 'The sun rises in the east.', native_te: 'సూర్యుడు తూర్పున ఉదయిస్తాడు.', native_hi: 'सूरज पूर्व में उगता है।' }
        ]
      },
      {
        heading: 'The "S" Rule for He/She/It',
        content: 'When using He, She, or It, we usually add "s" or "es" to the end of the verb.',
        examples: [
          { english: 'I play.', native_te: 'నేను ఆడుతాను.', native_hi: 'मैं खेलता हूँ।' },
          { english: 'He plays.', native_te: 'అతను ఆడుతాడు.', native_hi: 'वह खेलता है।' },
          { english: 'She goes to school.', native_te: 'ఆమె పాఠశాలకు వెళుతుంది.', native_hi: 'वह स्कूल जाती है।' }
        ]
      }
    ],
    quiz: [
      {
        q: 'Fill in the blank: She ___ to music every day.',
        options: ['listen', 'listens', 'listening', 'listened'],
        answer: 1
      },
      {
        q: 'Which sentence is a fact?',
        options: ['I am eating an apple.', 'Cats drink milk.', 'He is walking.', 'They will arrive tomorrow.'],
        answer: 1
      },
      {
        q: 'Fill in the blank: I ___ not like spicy food.',
        options: ['does', 'is', 'do', 'am'],
        answer: 2
      }
    ]
  }
];
