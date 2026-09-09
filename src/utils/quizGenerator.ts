import { VOCAB_DATA, VocabItem } from '../data/vocabData';
import { QuizQuestion, QuizQuestionType, SemesterType, SubjectType } from '../types';

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateQuizQuestions(
  subject: SubjectType,
  count: number,
  customPool?: VocabItem[],
  semester?: SemesterType
): QuizQuestion[] {
  const basePool = customPool && customPool.length > 0 ? customPool : VOCAB_DATA;

  let pool = basePool;
  if (subject !== '전체') {
    const subjectFiltered = basePool.filter((item) => item.subject === subject);
    if (subjectFiltered.length > 0) {
      pool = subjectFiltered;
    }
  }

  // Filter by semester if specific semester is chosen
  if (semester && semester !== '전체') {
    const semesterFiltered = pool.filter((item) => item.semester === semester);
    if (semesterFiltered.length > 0) {
      pool = semesterFiltered;
    }
  }

  // Fallback if requested count is larger than pool
  const actualCount = Math.min(count, pool.length);
  const shuffledVocab = shuffle(pool).slice(0, actualCount);

  return shuffledVocab.map((item, index) => {
    const isEnglish = item.subject === '영어' || /^[a-zA-Z\s]+$/.test(item.word.trim());
    // Check if item has a valid real Chinese character Hanja
    const hasRealHanja =
      Boolean(item.hanja) &&
      item.hanja.trim() !== '-' &&
      !item.hanja.startsWith('[') &&
      /[\u4E00-\u9FFF]/.test(item.hanja);

    // Determine available question types for this item
    const possibleTypes: QuizQuestionType[] = [];
    if (hasRealHanja) {
      possibleTypes.push('hanjaToWord', 'wordToHanja', 'meaningToWord', 'wordToMeaning');
    } else {
      // English or vocabulary without Hanja
      possibleTypes.push('meaningToWord', 'wordToMeaning');
      if (item.example && item.example.toLowerCase().includes(item.word.toLowerCase())) {
        possibleTypes.push('sentenceFillBlank');
      }
    }

    const type = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
    let questionTitle = '';
    let questionHighlight = '';
    let correctOption = '';
    const wrongOptionsPool = pool.filter((v) => v.word !== item.word);
    let options: string[] = [];

    switch (type) {
      case 'hanjaToWord':
        questionTitle = '다음 한자의 음(낱말)은 무엇일까요?';
        questionHighlight = `[ ${item.hanja} ]`;
        correctOption = item.word;
        options = [correctOption, ...shuffle(wrongOptionsPool).slice(0, 3).map((v) => v.word)];
        break;

      case 'wordToHanja':
        questionTitle = '다음 낱말에 알맞은 한자는 무엇일까요?';
        questionHighlight = `[ ${item.word} ]`;
        correctOption = item.hanja;
        const uniqueHanjas = Array.from(new Set(wrongOptionsPool.map((v) => v.hanja))).filter(
          (h) => h && h !== '-' && !h.startsWith('[')
        );
        options = [correctOption, ...shuffle(uniqueHanjas).slice(0, 3)];
        break;

      case 'meaningToWord':
        questionTitle = isEnglish
          ? '다음 뜻을 가진 알맞은 영어 단어는 무엇일까요?'
          : '다음 뜻을 가진 알맞은 낱말은 무엇일까요?';
        questionHighlight = `"${item.meaning}"`;
        correctOption = item.word;
        options = [correctOption, ...shuffle(wrongOptionsPool).slice(0, 3).map((v) => v.word)];
        break;

      case 'wordToMeaning':
        questionTitle = isEnglish
          ? '다음 영어 단어의 올바른 우리말 뜻은 무엇일까요?'
          : '다음 낱말의 올바른 뜻은 무엇일까요?';
        questionHighlight = `[ ${item.word} ]`;
        correctOption = item.meaning;
        options = [correctOption, ...shuffle(wrongOptionsPool).slice(0, 3).map((v) => v.meaning)];
        break;

      case 'sentenceFillBlank':
        questionTitle = isEnglish
          ? '다음 문장의 빈칸 (     )에 들어갈 알맞은 영어 단어는?'
          : '다음 문장의 빈칸 (     )에 들어갈 알맞은 낱말은?';
        // Replace word in example with blank (     )
        const regex = new RegExp(`\\b${item.word}\\b`, 'i');
        const blankSentence = item.example.replace(regex, '(        )');
        questionHighlight = `"${blankSentence}"`;
        correctOption = item.word;
        options = [correctOption, ...shuffle(wrongOptionsPool).slice(0, 3).map((v) => v.word)];
        break;
    }

    // Ensure we have 4 options even if pool is small
    const uniqueOptions = Array.from(new Set(options));
    while (uniqueOptions.length < 4 && wrongOptionsPool.length > 0) {
      const randomExtra = shuffle(wrongOptionsPool)[0];
      const optVal =
        type === 'wordToMeaning'
          ? randomExtra.meaning
          : type === 'wordToHanja'
          ? randomExtra.hanja
          : randomExtra.word;
      if (!uniqueOptions.includes(optVal)) {
        uniqueOptions.push(optVal);
      } else {
        break;
      }
    }

    return {
      id: `q_${index + 1}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      item,
      questionTitle,
      questionHighlight,
      options: shuffle(uniqueOptions),
      correctOption,
    };
  });
}

